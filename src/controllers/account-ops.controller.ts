import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import { ResendOtpDto, SendOtpDto, VerifyOtpDto } from '../dto/api.dto';

@ApiTags('account-ops')
@Controller()
export class AccountOpsController {
  constructor(private readonly extendedData: ExtendedDataService) {}

  @Post('auth/send-otp')
  sendOtp(@Body() body: SendOtpDto) {
    return this.extendedData.sendOtp(body.destination, body.channel);
  }

  @Post('auth/resend-otp')
  resendOtp(@Body() body: ResendOtpDto) {
    return this.extendedData.resendOtp(body.destination);
  }

  @Post('auth/verify-otp')
  verifyOtp(@Body() body: VerifyOtpDto) {
    return this.extendedData.verifyOtp(body.code);
  }

  @Get('recommendations')
  getRecommendations() {
    return this.extendedData.getRecommendations();
  }

  @Get('chat/presence')
  getPresence() {
    return this.extendedData.getPresence();
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
  requestDataExport(@Body() body: { format?: string }) {
    return this.extendedData.requestDataExport(body.format);
  }

  @Get('security/state')
  getSecurityState() {
    return this.extendedData.getSecurityState();
  }

  @Post('security/logout-all')
  logoutAll() {
    return this.extendedData.logoutAllSessions();
  }
}
