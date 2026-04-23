import { BadRequestException, Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import { ResendOtpDto, SendOtpDto, VerifyOtpDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { MailService } from '../services/mail.service';
import { RealtimeStateService } from '../services/realtime-state.service';

@ApiTags('account-ops')
@Controller()
export class AccountOpsController {
  constructor(
    private readonly extendedData: ExtendedDataService,
    private readonly realtimeState: RealtimeStateService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly mailService: MailService,
  ) {}

  @Post('auth/send-otp')
  async sendOtp(@Body() body: SendOtpDto) {
    if (body.channel === 'email' && this.looksLikeEmail(body.destination)) {
      return this.sendEmailOtp(body.destination, 'sent');
    }

    const result = this.extendedData.sendOtp(body.destination, body.channel);
    return {
      ...result,
      message: 'OTP sent successfully.',
      data: result,
    };
  }

  @Post('auth/resend-otp')
  async resendOtp(@Body() body: ResendOtpDto) {
    if (this.looksLikeEmail(body.destination)) {
      return this.sendEmailOtp(body.destination, 'resent');
    }

    const result = this.extendedData.resendOtp(body.destination);
    return {
      ...result,
      message: 'OTP resent successfully.',
      data: result,
    };
  }

  @Post('auth/verify-otp')
  async verifyOtp(@Body() body: VerifyOtpDto) {
    const destination = body.destination?.trim() || body.email?.trim();

    if (destination) {
      const verification = await this.coreDatabase.getAuthCode(
        destination,
        'verify_email',
      );
      if (!verification) {
        throw new BadRequestException('No OTP request found for this destination.');
      }
      if (Date.now() > new Date(verification.expiresAt).getTime()) {
        throw new BadRequestException('OTP code has expired.');
      }
      if (verification.code !== body.code) {
        throw new BadRequestException('Invalid OTP code.');
      }

      await this.coreDatabase.deleteAuthCode(destination, 'verify_email');

      return {
        success: true,
        message: 'OTP verified successfully.',
        destination,
        verificationStatus: 'verified',
        data: {
          destination,
          verificationStatus: 'verified',
        },
      };
    }

    const result = this.extendedData.verifyOtp(body.code);
    return {
      ...result,
      message: result.success ? 'OTP verified successfully.' : 'Invalid OTP code.',
      data: result,
    };
  }

  @Get('recommendations')
  getRecommendations() {
    return this.extendedData.getRecommendations();
  }

  @Get('chat/presence')
  getPresence() {
    return this.realtimeState.getPresenceSnapshot();
  }

  @Get('chat/preferences')
  getConversationPreferences() {
    return this.extendedData.getConversationPreferences();
  }

  @Patch('notification-preferences')
  updateNotificationPreferences(@Body() body: Record<string, unknown>) {
    return this.extendedData.updateNotificationPreferences(body);
  }

  @Get('notification-preferences')
  getNotificationPreferences() {
    return this.extendedData.getNotificationPreferences();
  }

  @Get('safety/config')
  getSafetyConfig() {
    return this.extendedData.getSafetyConfig();
  }

  @Get('support/chat')
  getSupportChat() {
    return this.extendedData.getSupportChat();
  }

  @Get('wallet/ledger')
  getWalletLedger() {
    return this.extendedData.getWalletLedger();
  }

  @Get('master-data')
  getMasterData() {
    return this.extendedData.getMasterData();
  }

  @Get('legal/consents')
  getLegalConsents() {
    return this.extendedData.getLegalState();
  }

  @Patch('legal/consents')
  updateLegalConsents(@Body() body: Record<string, boolean>) {
    return this.extendedData.updateLegalConsents(body);
  }

  @Post('legal/account-deletion')
  requestAccountDeletion(@Body() body: { reason?: string }) {
    return this.extendedData.requestAccountDeletion(body.reason);
  }

  @Post('legal/data-export')
  requestDataExport(@Body() body: { format?: string; userId?: string }) {
    const exportRequest = this.extendedData.requestDataExport(body.format);
    return {
      ...exportRequest,
      message: 'Data export requested successfully.',
      userId: body.userId ?? null,
      data: {
        ...exportRequest,
        userId: body.userId ?? null,
      },
    };
  }

  @Get('security/state')
  getSecurityState() {
    return this.extendedData.getSecurityState();
  }

  @Post('security/logout-all')
  logoutAll() {
    return this.extendedData.logoutAllSessions();
  }

  private async sendEmailOtp(destination: string, verificationStatus: 'sent' | 'resent') {
    const code = this.generateVerificationCode();
    await this.coreDatabase.storeAuthCode(
      destination,
      'verify_email',
      code,
      new Date(Date.now() + 10 * 60 * 1000),
    );
    const delivery = await this.mailService.sendVerificationEmail(destination, code);
    const message =
      verificationStatus === 'resent'
        ? 'A new 6-digit verification code has been sent to your email.'
        : 'A 6-digit verification code has been sent to your email.';

    return {
      success: true,
      message,
      destination,
      channel: 'email',
      cooldownSeconds: 45,
      verificationStatus,
      delivery,
      data: {
        destination,
        channel: 'email',
        cooldownSeconds: 45,
        verificationStatus,
        delivery,
      },
    };
  }

  private generateVerificationCode() {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private looksLikeEmail(destination: string) {
    return destination.includes('@');
  }
}
