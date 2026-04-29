import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Headers,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ForgotPasswordDto,
  GoogleAuthDto,
  LoginDto,
  RefreshTokenDto,
  ResetPasswordDto,
  SignupDto,
  VerifyEmailConfirmDto,
} from '../dto/auth.dto';
import { MailService } from '../services/mail.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { UploadsDatabaseService } from '../services/uploads-database.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly mailService: MailService,
    private readonly uploadsDatabase: UploadsDatabaseService,
  ) {}

  @Get('demo-accounts')
  @ApiOperation({
    summary: 'List registered test accounts when explicitly enabled',
    description:
      'This route is disabled by default and should not be exposed in production. It returns registered accounts without passwords only when AUTH_EXPOSE_TEST_ACCOUNTS=true.',
  })
  @ApiOkResponse({
    description: 'Registered accounts visible for controlled local testing.',
  })
  async getDemoAccounts() {
    if ((process.env.AUTH_EXPOSE_TEST_ACCOUNTS ?? 'false') !== 'true') {
      throw new UnauthorizedException('Test account listing is disabled.');
    }
    return {
      success: true,
      message: 'Test accounts fetched successfully.',
      data: await this.coreDatabase.getDemoAuthAccounts(),
    };
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login with email and password',
    description: 'Authenticates against registered PostgreSQL-backed user accounts.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'User login successful.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  async login(@Body() body: LoginDto) {
    const session = await this.coreDatabase.authenticateUser(body);
    return this.buildSessionResponse(session, 'Login successful.');
  }

  @Post('google')
  @ApiOperation({
    summary: 'Login or signup with Google',
    description:
      'Creates or logs in a user using Google account data. Google token verification is still application-managed and should be hardened with provider-side validation for production.',
  })
  @ApiBody({ type: GoogleAuthDto })
  async googleAuth(@Body() body: GoogleAuthDto) {
    return this.buildSessionResponse(
      await this.coreDatabase.loginWithGoogle(body),
      'Google authentication successful.',
    );
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  async refreshToken(@Body() body: RefreshTokenDto) {
    return this.buildSessionResponse(
      await this.coreDatabase.refreshUserToken(body.refreshToken),
      'Token refreshed successfully.',
    );
  }

  @Post('logout')
  @ApiBearerAuth('user-bearer')
  @ApiOperation({ summary: 'Logout current user session' })
  async logout(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    return this.coreDatabase.revokeUserSession(token);
  }

  @Post('signup')
  @ApiOperation({
    summary: 'Signup a new user account',
    description:
      'Supports required account fields plus optional bio, interests, and one photo reference via avatarUrl/photoUrl or avatarId/photoId.',
  })
  @ApiBody({ type: SignupDto })
  @ApiOkResponse({ description: 'Signup completed.' })
  async signup(@Body() body: SignupDto) {
    if (body.password !== body.confirmPassword) {
      throw new BadRequestException('confirmPassword must match password.');
    }

    const normalizedEmail = body.email.trim().toLowerCase();
    const normalizedUsername = body.username.trim();
    const existingUser = await this.coreDatabase.findUserByEmailOptional(normalizedEmail);

    if (existingUser) {
      if (existingUser.emailVerified) {
        throw new ConflictException(
          'An account with this email already exists. Please log in instead.',
        );
      }

      await this.coreDatabase.assertUsernameAvailable(normalizedUsername, existingUser.id);
      const code = this.generateVerificationCode();
      await this.coreDatabase.storeAuthCode(
        existingUser.email,
        'verify_email',
        code,
        new Date(Date.now() + 10 * 60 * 1000),
      );
      const delivery = await this.mailService.sendVerificationEmail(existingUser.email, code);

      return {
        success: true,
        message:
          'This email is already registered but not verified yet. A new 6-digit verification code has been sent.',
        alreadyRegistered: true,
        requiresVerification: true,
        emailVerified: false,
        data: {
          userId: existingUser.id,
          email: existingUser.email,
          verification: {
            required: true,
            email: existingUser.email,
            verificationExpiresInMinutes: 10,
            delivery,
          },
        },
      };
    }

    const user = await this.coreDatabase.createUser({
      name: body.name.trim(),
      username: normalizedUsername,
      email: normalizedEmail,
      password: body.password,
      role: body.role,
      bio: body.bio?.trim(),
      interests: this.normalizeInterests(body.interests),
      avatar: await this.resolveSignupAvatar(body),
    });
    const code = this.generateVerificationCode();
    await this.coreDatabase.storeAuthCode(
      user.email,
      'verify_email',
      code,
      new Date(Date.now() + 10 * 60 * 1000),
    );
    const delivery = await this.mailService.sendVerificationEmail(user.email, code);
    const session = await this.coreDatabase.createUserSession(user.id);
    const verification = {
      required: true,
      email: user.email,
      verificationExpiresInMinutes: 10,
      delivery,
    };

    return this.buildSessionResponse(
      session,
      'Signup successful. A 6-digit verification code has been sent to the email address.',
      { verification },
    );
  }

  @Post('verify-email/confirm')
  @ApiOperation({
    summary: 'Confirm 6-digit email verification code',
  })
  @ApiBody({ type: VerifyEmailConfirmDto })
  async verifyEmail(@Body() body: VerifyEmailConfirmDto) {
    const verification = await this.coreDatabase.getAuthCode(body.email, 'verify_email');
    if (!verification) {
      throw new BadRequestException('No verification request found for this email.');
    }
    if (Date.now() > new Date(verification.expiresAt).getTime()) {
      throw new BadRequestException('Verification code has expired.');
    }
    if (verification.code !== body.code) {
      throw new BadRequestException('Invalid verification code.');
    }

    const user = await this.coreDatabase.markEmailVerified(body.email);
    await this.coreDatabase.deleteAuthCode(body.email, 'verify_email');
    const session = await this.coreDatabase.createUserSession(user.id);

    return this.buildSessionResponse(session, 'Email verified successfully.', {
      emailVerified: true,
    });
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Start forgot-password flow' })
  @ApiBody({ type: ForgotPasswordDto })
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.coreDatabase.getUserByEmail(body.email);
    const code = this.generateVerificationCode();
    await this.coreDatabase.storeAuthCode(
      body.email,
      'reset_password',
      code,
      new Date(Date.now() + 10 * 60 * 1000),
    );
    const delivery = await this.mailService.sendPasswordResetEmail(body.email, code);
    return {
      success: true,
      message: 'Password reset OTP sent successfully.',
      data: {
        email: body.email,
        otp: {
          required: true,
          expiresInMinutes: 10,
        },
        delivery,
      },
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Complete password reset with OTP' })
  @ApiBody({ type: ResetPasswordDto })
  async resetPassword(@Body() body: ResetPasswordDto) {
    const request = await this.coreDatabase.getAuthCode(body.email, 'reset_password');
    if (!request) {
      throw new BadRequestException('No password reset request found for this email.');
    }
    if (Date.now() > new Date(request.expiresAt).getTime()) {
      throw new BadRequestException('Password reset code has expired.');
    }
    if (request.code !== body.otp) {
      throw new BadRequestException('Invalid password reset code.');
    }
    await this.coreDatabase.forceSetPassword(body.email, body.password);
    await this.coreDatabase.deleteAuthCode(body.email, 'reset_password');

    return {
      success: true,
      message: 'Password reset completed.',
      data: {
        email: body.email,
      },
    };
  }

  @Get('me')
  @ApiBearerAuth('user-bearer')
  @ApiOperation({
    summary: 'Get current user from bearer token',
    description: 'Use the token returned from /auth/login in Swagger Authorize.',
  })
  async me(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    const user = await this.coreDatabase.resolveUserFromAccessToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
    return {
      success: true,
      message: 'Current user fetched successfully.',
      user,
      profile: user,
      data: user,
    };
  }

  private buildSessionResponse(
    session: Record<string, unknown>,
    message: string,
    extras: Record<string, unknown> = {},
  ) {
    return {
      success: true,
      message,
      ...session,
      ...extras,
      user: session.user,
      data: {
        ...session,
        ...extras,
      },
    };
  }

  private generateVerificationCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private normalizeInterests(interests?: string[]) {
    if (!interests) {
      return undefined;
    }

    const normalized = [...new Set(interests.map((interest) => interest.trim()).filter(Boolean))];
    return normalized.length > 0 ? normalized : undefined;
  }

  private async resolveSignupAvatar(body: SignupDto) {
    const urlValues = [body.avatarUrl, body.photoUrl]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));
    const uploadIds = [body.avatarId, body.photoId]
      .map((value) => value?.trim())
      .filter((value): value is string => Boolean(value));
    const distinctUrls = [...new Set(urlValues)];
    const distinctUploadIds = [...new Set(uploadIds)];

    if (
      distinctUrls.length > 1 ||
      distinctUploadIds.length > 1 ||
      (distinctUrls.length > 0 && distinctUploadIds.length > 0)
    ) {
      throw new BadRequestException(
        'Provide only one photo field for signup: avatarUrl, photoUrl, avatarId, or photoId.',
      );
    }

    const directUrl = distinctUrls[0];
    if (directUrl) {
      return directUrl;
    }

    const uploadId = distinctUploadIds[0];
    if (!uploadId) {
      return undefined;
    }

    try {
      const upload = await this.uploadsDatabase.getUpload(uploadId);
      const avatar = upload.secureUrl ?? upload.url;
      if (!avatar) {
        throw new BadRequestException(
          `Upload ${uploadId} does not have a usable file URL for signup.`,
        );
      }
      return avatar;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Upload ${uploadId} was not found. Upload the image first or pass avatarUrl/photoUrl instead.`,
      );
    }
  }
}
