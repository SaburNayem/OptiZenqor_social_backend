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
import { AdminDatabaseService } from '../services/admin-database.service';

@ApiTags('admin-ops')
@Controller('admin')
export class AdminOpsController {
  constructor(private readonly adminDatabase: AdminDatabaseService) {}

  @Get('auth/demo-accounts')
  @ApiOperation({
    summary: 'List admin accounts when explicitly enabled',
    description:
      'This route is disabled by default and should not be exposed in production.',
  })
  async getDemoAccounts() {
    return {
      success: true,
      message: 'Admin test accounts fetched successfully.',
      data: await this.adminDatabase.listDemoAccounts(),
    };
  }

  @Post('auth/login')
  @ApiOperation({
    summary: 'Admin dashboard login',
    description:
      'Authenticates an admin user against persisted PostgreSQL-backed admin accounts.',
  })
  @ApiBody({ type: AdminLoginDto })
  @ApiOkResponse({ description: 'Admin login successful.' })
  @ApiUnauthorizedResponse({ description: 'Invalid admin credentials.' })
  login(@Body() body: AdminLoginDto) {
    return this.adminDatabase.loginAdmin(body.email, body.password);
  }

  @Get('auth/me')
  @ApiBearerAuth('admin-bearer')
  @ApiOperation({
    summary: 'Get current admin session from bearer token',
    description: 'Use the token returned from /admin/auth/login in Swagger Authorize.',
  })
  async me(@Headers('authorization') authorization?: string) {
    return {
      success: true,
      message: 'Current admin fetched successfully.',
      data: await this.adminDatabase.getAdminMe(authorization),
    };
  }

  @Get('auth/sessions')
  async getSessions() {
    return this.adminDatabase.getAdminSessions();
  }

  @Patch('auth/sessions/:id/revoke')
  async revokeSession(@Param('id') id: string) {
    return this.adminDatabase.revokeAdminSession(id);
  }

  @Get('verification-queue')
  async getVerificationQueue() {
    return this.adminDatabase.getVerificationQueue();
  }

  @Patch('verification-queue/:id')
  async decideVerification(
    @Param('id') id: string,
    @Body() body: { decision: 'approved' | 'rejected'; note?: string },
  ) {
    return this.adminDatabase.decideVerification(id, body.decision, body.note);
  }

  @Get('moderation-cases')
  async getModerationCases() {
    return this.adminDatabase.getModerationCases();
  }

  @Patch('moderation-cases/:id')
  async updateModerationCase(@Param('id') id: string, @Body() body: { action: string }) {
    return this.adminDatabase.updateModerationCase(id, body.action);
  }

  @Get('chat-control')
  async getChatControl() {
    return this.adminDatabase.getModerationCases('chat_thread');
  }

  @Patch('chat-control/:id')
  async updateChatControl(
    @Param('id') id: string,
    @Body() body: { freeze?: boolean; restrictParticipant?: string },
  ) {
    return this.adminDatabase.updateChatModerationCase(id, body);
  }

  @Get('broadcast-campaigns')
  async getCampaigns() {
    return this.adminDatabase.getCampaigns();
  }

  @Post('broadcast-campaigns')
  async createCampaign(
    @Body() body: { name: string; audience: string; segmentId: string; schedule: string },
  ) {
    return this.adminDatabase.createCampaign(body);
  }

  @Get('audience-segments')
  async getAudienceSegments() {
    return this.adminDatabase.getAudienceSegments();
  }

  @Get('analytics-pipeline')
  async getAnalyticsPipeline() {
    return this.adminDatabase.getAnalyticsPipeline();
  }

  @Get('rbac')
  getRbac() {
    return this.adminDatabase.getPermissionMatrix();
  }

  @Get('operational-settings')
  async getOperationalSettings() {
    return this.adminDatabase.getOperationalSettings();
  }

  @Patch('operational-settings')
  async updateOperationalSettings(@Body() body: Record<string, unknown>) {
    return this.adminDatabase.updateOperationalSettings(body);
  }

  @Get('audit-log-system')
  async getAuditLogs() {
    return this.adminDatabase.getAuditLogs();
  }

  @Get('content-operations')
  async getContentOperations() {
    return this.adminDatabase.getContentOperations();
  }

  @Get('commerce-risk')
  async getCommerceRisk() {
    return this.adminDatabase.getCommerceRisk();
  }

  @Get('support-operations')
  async getSupportOperations() {
    return this.adminDatabase.getSupportOperations();
  }
}
