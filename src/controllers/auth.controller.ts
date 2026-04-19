import { BadRequestException, Body, Controller, Get, Headers, Post } from '@nestjs/common';
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
  LoginDto,
  ResetPasswordDto,
  SignupDto,
  VerifyEmailConfirmDto,
} from '../dto/auth.dto';
import { PlatformDataService } from '../data/platform-data.service';
import { MailService } from '../services/mail.service';
import { extractMockEntityIdFromAuthHeader } from '../utils/token.util';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly emailVerificationCodes = new Map<
    string,
    { code: string; expiresAt: number }
  >();

  constructor(
    private readonly platformData: PlatformDataService,
    private readonly mailService: MailService,
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
  getDemoAccounts() {
    return {
      success: true,
      message: 'Demo login accounts fetched successfully.',
      data: this.platformData.getDemoAuthAccounts(),
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
  login(@Body() body: LoginDto) {
    const session = this.platformData.authenticateUser(body);
    return {
      success: true,
      message: 'Login successful.',
      data: session,
    };
  }

  @Post('signup')
  @ApiOperation({ summary: 'Signup a new user account' })
  @ApiBody({ type: SignupDto })
  @ApiOkResponse({ description: 'Signup completed.' })
  async signup(@Body() body: SignupDto) {
    if (body.password !== body.confirmPassword) {
      throw new BadRequestException('confirmPassword must match password.');
    }

    const user = this.platformData.createUser(body);
    const code = this.generateVerificationCode();
    this.emailVerificationCodes.set(user.email, {
      code,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });
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
  verifyEmail(@Body() body: VerifyEmailConfirmDto) {
    const verification = this.emailVerificationCodes.get(body.email);
    if (!verification) {
      throw new BadRequestException('No verification request found for this email.');
    }
    if (Date.now() > verification.expiresAt) {
      throw new BadRequestException('Verification code has expired.');
    }
    if (verification.code !== body.code) {
      throw new BadRequestException('Invalid verification code.');
    }

    const user = this.platformData.markEmailVerified(body.email);
    this.emailVerificationCodes.delete(body.email);

    return {
      success: true,
      message: 'Email verified successfully.',
      data: user,
    };
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Start forgot-password flow' })
  @ApiBody({ type: ForgotPasswordDto })
  forgotPassword(@Body() body: ForgotPasswordDto) {
    return {
      success: true,
      message: 'Password reset OTP sent.',
      data: {
        email: body.email,
        otpHint: 'Use 123456 in the seeded mock backend.',
      },
    };
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Complete password reset with OTP' })
  @ApiBody({ type: ResetPasswordDto })
  resetPassword(@Body() body: ResetPasswordDto) {
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
  me(@Headers('authorization') authorization?: string) {
    const userId = extractMockEntityIdFromAuthHeader(authorization, 'mock-token-');
    return {
      success: true,
      message: 'Current user fetched successfully.',
      data: userId ? this.platformData.getUser(userId) : null,
    };
  }

  private generateVerificationCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }
}
