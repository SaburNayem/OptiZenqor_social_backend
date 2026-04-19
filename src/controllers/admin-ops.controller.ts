import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminLoginDto } from '../dto/auth.dto';
import { AdminOpsDataService } from '../data/admin-ops-data.service';
import { extractMockEntityIdFromAuthHeader } from '../utils/token.util';

@ApiTags('admin-ops')
@Controller('admin')
export class AdminOpsController {
  constructor(private readonly adminOpsData: AdminOpsDataService) {}

  @Get('auth/demo-accounts')
  @ApiOperation({
    summary: 'List seeded demo admin accounts',
    description:
      'Use these original admin emails to log in from Swagger. Demo admin password is admin123.',
  })
  getDemoAccounts() {
    return {
      success: true,
      message: 'Demo admin accounts fetched successfully.',
      data: this.adminOpsData.getAdminDemoAccounts(),
    };
  }

  @Post('auth/login')
  @ApiOperation({
    summary: 'Admin dashboard login',
    description:
      'Use one of the original seeded admin emails from GET /admin/auth/demo-accounts. Demo password is admin123.',
  })
  @ApiBody({ type: AdminLoginDto })
  @ApiOkResponse({ description: 'Admin login successful.' })
  @ApiUnauthorizedResponse({ description: 'Invalid admin credentials.' })
  login(@Body() body: AdminLoginDto) {
    return this.adminOpsData.loginAdmin(body.email, body.password);
  }

  @Get('auth/me')
  @ApiBearerAuth('admin-bearer')
  @ApiOperation({
    summary: 'Get current admin session from bearer token',
    description: 'Use the token returned from /admin/auth/login in Swagger Authorize.',
  })
  me(@Headers('authorization') authorization?: string) {
    const adminId = extractMockEntityIdFromAuthHeader(authorization, 'admin-token-');
    const admin = this.adminOpsData
      .getAdminSessions()
      .find((item) => item.adminId === adminId) ?? null;

    return {
      success: true,
      message: 'Current admin fetched successfully.',
      data: admin,
    };
  }

  @Get('auth/sessions')
  getSessions() {
    return this.adminOpsData.getAdminSessions();
  }

  @Patch('auth/sessions/:id/revoke')
  revokeSession(@Param('id') id: string) {
    return this.adminOpsData.revokeAdminSession(id);
  }

  @Get('verification-queue')
  getVerificationQueue() {
    return this.adminOpsData.getVerificationQueue();
  }

  @Patch('verification-queue/:id')
  decideVerification(
    @Param('id') id: string,
    @Body() body: { decision: 'approved' | 'rejected'; note?: string },
  ) {
    return this.adminOpsData.decideVerification(id, body.decision, body.note);
  }

  @Get('moderation-cases')
  getModerationCases() {
    return this.adminOpsData.getModerationCases();
  }

  @Patch('moderation-cases/:id')
  updateModerationCase(@Param('id') id: string, @Body() body: { action: string }) {
    return this.adminOpsData.updateModerationCase(id, body.action);
  }

  @Get('chat-control')
  getChatControl() {
    return this.adminOpsData.getChatModerationCases();
  }

  @Patch('chat-control/:id')
  updateChatControl(
    @Param('id') id: string,
    @Body() body: { freeze?: boolean; restrictParticipant?: string },
  ) {
    return this.adminOpsData.updateChatModerationCase(id, body);
  }

  @Get('broadcast-campaigns')
  getCampaigns() {
    return this.adminOpsData.getCampaigns();
  }

  @Post('broadcast-campaigns')
  createCampaign(
    @Body() body: { name: string; audience: string; segmentId: string; schedule: string },
  ) {
    return this.adminOpsData.createCampaign(body);
  }

  @Get('audience-segments')
  getAudienceSegments() {
    return this.adminOpsData.getAudienceSegments();
  }

  @Get('analytics-pipeline')
  getAnalyticsPipeline() {
    return this.adminOpsData.getAnalyticsPipeline();
  }

  @Get('rbac')
  getRbac() {
    return this.adminOpsData.getPermissionMatrix();
  }

  @Get('operational-settings')
  getOperationalSettings() {
    return this.adminOpsData.getOperationalSettings();
  }

  @Patch('operational-settings')
  updateOperationalSettings(@Body() body: Record<string, unknown>) {
    return this.adminOpsData.updateOperationalSettings(body);
  }

  @Get('audit-log-system')
  getAuditLogs() {
    return this.adminOpsData.getAuditLogs();
  }

  @Get('content-operations')
  getContentOperations() {
    return this.adminOpsData.getContentOperations();
  }

  @Get('commerce-risk')
  getCommerceRisk() {
    return this.adminOpsData.getCommerceRisk();
  }

  @Get('support-operations')
  getSupportOperations() {
    return this.adminOpsData.getSupportOperations();
  }
}
