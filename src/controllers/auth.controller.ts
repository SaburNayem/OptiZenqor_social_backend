import {
  BadRequestException,
  Body,
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
import { ExtendedDataService } from '../data/extended-data.service';
import { MailService } from '../services/mail.service';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly mailService: MailService,
    private readonly extendedData: ExtendedDataService,
  ) {}

  @Get('demo-accounts')
  @ApiOperation({
    summary: 'List seeded demo login accounts',
    description:
      'Use these original seeded emails or usernames to log in from Swagger. All seeded user passwords are 123456.',
  })
  @ApiOkResponse({
    description: 'Seeded demo user accounts for Swagger login testing.',
  })
  async getDemoAccounts() {
    return {
      success: true,
      message: 'Demo login accounts fetched successfully.',
      data: await this.coreDatabase.getDemoAuthAccounts(),
    };
  }

  @Post('login')
  @ApiOperation({
    summary: 'Login with original seeded email and password',
    description:
      'Use one of the original seeded emails from GET /auth/demo-accounts. Demo password is 123456.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'User login successful.' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  async login(@Body() body: LoginDto) {
    const session = await this.coreDatabase.authenticateUser(body);
    return {
      success: true,
      message: 'Login successful.',
      data: session,
    };
  }

  @Post('google')
  @ApiOperation({
    summary: 'Login or signup with Google',
    description:
      'Creates or logs in a user using Google account data. This seeded backend does not validate the Google token externally yet.',
  })
  @ApiBody({ type: GoogleAuthDto })
  async googleAuth(@Body() body: GoogleAuthDto) {
    return {
      success: true,
      message: 'Google authentication successful.',
      data: await this.coreDatabase.loginWithGoogle(body),
    };
  }

  @Post('refresh-token')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiBody({ type: RefreshTokenDto })
  async refreshToken(@Body() body: RefreshTokenDto) {
    return {
      success: true,
      message: 'Token refreshed successfully.',
      data: await this.coreDatabase.refreshUserToken(body.refreshToken),
    };
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

    const user = await this.coreDatabase.createUser({
      name: body.name.trim(),
      username: body.username.trim(),
      email: body.email.trim(),
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

    return {
      success: true,
      message:
        'Signup successful. A 6-digit verification code has been sent to the email address.',
      data: {
        user,
        verification: {
          required: true,
          email: user.email,
          verificationExpiresInMinutes: 10,
          delivery,
        },
      },
    };
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

    return {
      success: true,
      message: 'Email verified successfully.',
      data: user,
    };
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
      data: user,
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
      const upload = this.extendedData.getUpload(uploadId);
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
