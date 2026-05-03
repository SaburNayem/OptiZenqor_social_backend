import { BadRequestException, Body, Controller, Get, Headers, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResendOtpDto, SendOtpDto, VerifyOtpDto } from '../dto/api.dto';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { AppExtensionsDatabaseService } from '../services/app-extensions-database.service';
import { AppUtilityDatabaseService } from '../services/app-utility-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { MailService } from '../services/mail.service';
import { MonetizationDatabaseService } from '../services/monetization-database.service';
import { RealtimeStateService } from '../services/realtime-state.service';
import { ReelsDatabaseService } from '../services/reels-database.service';
import { SocialStateDatabaseService } from '../services/social-state-database.service';
import { SupportDatabaseService } from '../services/support-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('account-ops')
@Controller()
export class AccountOpsController {
  constructor(
    private readonly realtimeState: RealtimeStateService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly reelsDatabase: ReelsDatabaseService,
    private readonly monetizationDatabase: MonetizationDatabaseService,
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly mailService: MailService,
    private readonly socialStateDatabase: SocialStateDatabaseService,
    private readonly supportDatabase: SupportDatabaseService,
    private readonly appExtensionsDatabase: AppExtensionsDatabaseService,
    private readonly appUtilityDatabase: AppUtilityDatabaseService,
  ) {}

  @Post('auth/send-otp')
  async sendOtp(@Body() body: SendOtpDto) {
    return this.sendPersistedOtp(
      body.destination,
      body.channel,
      'sent',
    );
  }

  @Post('auth/resend-otp')
  async resendOtp(@Body() body: ResendOtpDto) {
    return this.sendPersistedOtp(
      body.destination,
      this.looksLikeEmail(body.destination) ? 'email' : 'phone',
      'resent',
    );
  }

  @Post('auth/verify-otp')
  async verifyOtp(@Body() body: VerifyOtpDto) {
    const destination = body.destination?.trim() || body.email?.trim();

    if (destination) {
      const purpose = this.resolveOtpPurpose(destination);
      const verification = await this.coreDatabase.getAuthCode(
        destination,
        purpose,
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

      await this.coreDatabase.deleteAuthCode(destination, purpose);

      return successResponse('OTP verified successfully.', {
        destination,
        channel: purpose === 'verify_email' ? 'email' : 'phone',
        verificationStatus: 'verified',
      });
    }

    throw new BadRequestException('A destination or email is required to verify OTP.');
  }

  @Get('recommendations')
  async getRecommendations(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Recommendations fetched successfully.',
      await this.appUtilityDatabase.getRecommendations(user.id),
    );
  }

  @Get('chat/presence')
  getPresence() {
    return this.realtimeState.getPresenceSnapshot();
  }

  @Get('chat/preferences')
  async getConversationPreferences(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const preferences = await this.socialStateDatabase.getChatPreferences(user.id);
    return successResponse('Chat preferences fetched successfully.', preferences);
  }

  @Patch('notification-preferences')
  async updateNotificationPreferences(
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Notification preferences updated successfully.',
      await this.accountStateDatabase.updateSettingsState(user.id, body),
    );
  }

  @Get('notification-preferences')
  async getNotificationPreferences(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Notification preferences fetched successfully.',
      await this.accountStateDatabase.getSettingsState(user.id),
    );
  }

  @Get('safety/config')
  async getSafetyConfig(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const preferences = await this.socialStateDatabase.getChatPreferences(user.id);
    return successResponse(
      'Safety config fetched successfully.',
      preferences.safetyConfig,
    );
  }

  @Get('support/chat')
  async getSupportChat(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization).catch(() => null);
    return successResponse(
      'Support chat fetched successfully.',
      await this.supportDatabase.getSupportChat(user?.id ?? null),
    );
  }

  @Get('wallet/ledger')
  async getWalletLedger(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Wallet ledger fetched successfully.',
      await this.monetizationDatabase.getWalletTransactions(user.id),
    );
  }

  @Get('master-data')
  async getMasterData() {
    return successResponse(
      'Master data fetched successfully.',
      await this.appUtilityDatabase.getMasterData(),
    );
  }

  @Get('legal/consents')
  async getLegalConsents(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Legal consents fetched successfully.',
      await this.appUtilityDatabase.getLegalConsents(user.id),
    );
  }

  @Patch('legal/consents')
  async updateLegalConsents(
    @Body() body: Record<string, boolean>,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Legal consents updated successfully.',
      await this.appUtilityDatabase.updateLegalConsents(user.id, body),
    );
  }

  @Post('legal/account-deletion')
  async requestAccountDeletion(
    @Body() body: { reason?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Account deletion requested successfully.',
      await this.appUtilityDatabase.requestAccountDeletion(user.id, body.reason),
    );
  }

  @Post('legal/data-export')
  async requestDataExport(
    @Body() body: { format?: string; userId?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const userId = await this.resolveExportUserId(body.userId, authorization);
    const exportRequest = await this.appUtilityDatabase.requestDataExport(userId, body.format);
    return successResponse('Data export requested successfully.', {
      userId,
      ...exportRequest.summary,
    });
  }

  @Get('security/state')
  async getSecurityState(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Security state fetched successfully.',
      await this.appUtilityDatabase.getSecurityState(user.id),
    );
  }

  @Post('security/logout-all')
  async logoutAll(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'All sessions logged out successfully.',
      await this.appUtilityDatabase.logoutAllSessions(user.id),
    );
  }

  private async sendPersistedOtp(
    destination: string,
    channel: 'email' | 'phone',
    verificationStatus: 'sent' | 'resent',
  ) {
    const normalizedDestination = destination.trim();
    const purpose = this.resolveOtpPurpose(normalizedDestination);
    const code = this.generateVerificationCode();
    await this.coreDatabase.storeAuthCode(
      normalizedDestination,
      purpose,
      code,
      new Date(Date.now() + 10 * 60 * 1000),
    );
    const delivery =
      channel === 'email'
        ? await this.mailService.sendVerificationEmail(normalizedDestination, code)
        : {
            success: true,
            mode: 'phone-dev-fallback',
            message:
              'Phone OTP delivery provider is not configured. Code was persisted for verification flow.',
          };
    const message =
      verificationStatus === 'resent'
        ? `A new 6-digit verification code has been sent to your ${channel}.`
        : `A 6-digit verification code has been sent to your ${channel}.`;

    return successResponse(message, {
      destination: normalizedDestination,
      channel,
      cooldownSeconds: 45,
      verificationStatus,
      delivery,
    });
  }

  private resolveOtpPurpose(destination: string) {
    return this.looksLikeEmail(destination) ? 'verify_email' : 'verify_phone';
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
    if (!user?.id) {
      throw new BadRequestException('A valid authenticated user is required for data export.');
    }
    return user.id;
  }
}
