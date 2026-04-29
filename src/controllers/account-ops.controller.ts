import { BadRequestException, Body, Controller, Get, Headers, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import { ResendOtpDto, SendOtpDto, VerifyOtpDto } from '../dto/api.dto';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { MailService } from '../services/mail.service';
import { MonetizationDatabaseService } from '../services/monetization-database.service';
import { RealtimeStateService } from '../services/realtime-state.service';
import { ReelsDatabaseService } from '../services/reels-database.service';

@ApiTags('account-ops')
@Controller()
export class AccountOpsController {
  constructor(
    private readonly extendedData: ExtendedDataService,
    private readonly realtimeState: RealtimeStateService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly reelsDatabase: ReelsDatabaseService,
    private readonly monetizationDatabase: MonetizationDatabaseService,
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly mailService: MailService,
  ) {}

  @Post('auth/send-otp')
  async sendOtp(@Body() body: SendOtpDto) {
    if (body.channel === 'email' && this.looksLikeEmail(body.destination)) {
      return this.sendEmailOtp(body.destination, 'sent');
    }

    const result = await this.extendedData.sendOtp(body.destination, body.channel);
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

    const result = await this.extendedData.resendOtp(body.destination);
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

    const result = await this.extendedData.verifyOtp(body.code);
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
  async updateNotificationPreferences(
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      success: true,
      message: 'Notification preferences updated successfully.',
      data: await this.accountStateDatabase.updateSettingsState(user.id, body),
    };
  }

  @Get('notification-preferences')
  async getNotificationPreferences(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      success: true,
      message: 'Notification preferences fetched successfully.',
      data: await this.accountStateDatabase.getSettingsState(user.id),
    };
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
  async getWalletLedger(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      success: true,
      message: 'Wallet ledger fetched successfully.',
      data: await this.monetizationDatabase.getWalletTransactions(user.id),
    };
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
  async requestDataExport(
    @Body() body: { format?: string; userId?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const exportRequest = await this.extendedData.requestDataExport(body.format);
    const userId = await this.resolveExportUserId(body.userId, authorization);
    const user = await this.coreDatabase.getUser(userId);
    const posts = await this.coreDatabase.getPosts(userId);
    const reels = await this.reelsDatabase.getReels(userId);
    const summary = {
      username: user.username,
      posts: posts.length,
      reels: reels.length,
      followers: user.followers,
      following: user.following,
      verificationStatus: user.verificationStatus,
    };

    return {
      ...exportRequest,
      message: 'Export requested',
      userId,
      data: summary,
      result: summary,
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

  private async resolveExportUserId(userId?: string, authorization?: string) {
    const normalizedUserId = userId?.trim();
    if (normalizedUserId) {
      return normalizedUserId;
    }

    const token = authorization?.replace(/^Bearer\s+/i, '');
    const user = await this.coreDatabase.resolveUserFromAccessToken(token);
    return user?.id ?? 'u1';
  }
}
