import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AdminSessionGuard } from '../auth/admin-session.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  AdminSessionRefreshDto,
  AdminSupportOperationsQueryDto,
  AdminSupportTicketUpdateDto,
} from '../dto/admin.dto';
import { AdminLoginDto } from '../dto/auth.dto';
import { AdminDatabaseService } from '../services/admin-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('admin-ops')
@Controller('admin')
export class AdminOpsController {
  constructor(private readonly adminDatabase: AdminDatabaseService) {}

  @Post('auth/login')
  @ApiOperation({ summary: 'Admin dashboard login' })
  @ApiBody({ type: AdminLoginDto })
  @ApiOkResponse({ description: 'Admin login successful.' })
  @ApiUnauthorizedResponse({ description: 'Invalid admin credentials.' })
  login(@Body() body: AdminLoginDto) {
    return this.adminDatabase.loginAdmin(body.email, body.password);
  }

  @Post('auth/refresh')
  @ApiOperation({ summary: 'Refresh an admin session using refresh token' })
  refresh(@Body() body: AdminSessionRefreshDto) {
    return this.adminDatabase.refreshAdminSession(body.refreshToken);
  }

  @Post('auth/logout')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  @ApiOperation({ summary: 'Logout current admin session' })
  logout(@Headers('authorization') authorization?: string) {
    return this.adminDatabase.logoutAdmin(authorization);
  }

  @Get('auth/me')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  @ApiOperation({
    summary: 'Get current admin session from bearer token',
    description: 'Use the token returned from /admin/auth/login in Swagger Authorize.',
  })
  async me(@Headers('authorization') authorization?: string) {
    return successResponse(
      'Current admin fetched successfully.',
      await this.adminDatabase.getAdminMe(authorization),
    );
  }

  @Get('auth/sessions')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  @ApiOperation({ summary: 'List active and revoked admin sessions' })
  async getSessions(@Headers('authorization') authorization?: string) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin sessions fetched successfully.',
      await this.adminDatabase.getAdminSessions(admin.adminId),
    );
  }

  @Patch('auth/sessions/:id/revoke')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard, RolesGuard)
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Revoke an admin session' })
  async revokeSession(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return this.adminDatabase.revokeAdminSession(id, admin.adminId);
  }

  @Get('verification-queue')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  async getVerificationQueue() {
    return successResponse(
      'Verification queue fetched successfully.',
      await this.adminDatabase.getVerificationQueue(),
    );
  }

  @Patch('verification-queue/:id')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard, RolesGuard)
  @Roles('Super Admin', 'Operations Admin', 'Support Admin')
  async decideVerification(
    @Param('id') id: string,
    @Body() body: { decision: 'approved' | 'rejected'; note?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Verification decision applied successfully.',
      await this.adminDatabase.decideVerification(id, body.decision, body.note, admin.adminId),
    );
  }

  @Get('moderation-cases')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  async getModerationCases() {
    return successResponse(
      'Moderation cases fetched successfully.',
      await this.adminDatabase.getModerationCases(),
    );
  }

  @Patch('moderation-cases/:id')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard, RolesGuard)
  @Roles('Super Admin', 'Operations Admin', 'Content Moderator')
  async updateModerationCase(
    @Param('id') id: string,
    @Body() body: { action: string },
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Moderation case updated successfully.',
      await this.adminDatabase.updateModerationCase(id, body.action, admin.adminId),
    );
  }

  @Get('chat-control')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  async getChatControl() {
    return successResponse(
      'Chat moderation cases fetched successfully.',
      await this.adminDatabase.getModerationCases('chat_thread'),
    );
  }

  @Patch('chat-control/:id')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard, RolesGuard)
  @Roles('Super Admin', 'Operations Admin', 'Content Moderator')
  async updateChatControl(
    @Param('id') id: string,
    @Body() body: { freeze?: boolean; restrictParticipant?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Chat moderation case updated successfully.',
      await this.adminDatabase.updateChatModerationCase(id, body, admin.adminId),
    );
  }

  @Get('broadcast-campaigns')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  async getCampaigns() {
    return successResponse(
      'Broadcast campaigns fetched successfully.',
      await this.adminDatabase.getCampaigns(),
    );
  }

  @Post('broadcast-campaigns')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard, RolesGuard)
  @Roles('Super Admin', 'Operations Admin', 'Support Admin')
  async createCampaign(
    @Body() body: { name: string; audience: string; segmentId: string; schedule: string },
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Broadcast campaign created successfully.',
      await this.adminDatabase.createCampaign(body, admin.adminId),
    );
  }

  @Get('audience-segments')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  async getAudienceSegments() {
    return successResponse(
      'Audience segments fetched successfully.',
      await this.adminDatabase.getAudienceSegments(),
    );
  }

  @Get('analytics-pipeline')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  async getAnalyticsPipeline() {
    return successResponse(
      'Analytics pipeline fetched successfully.',
      await this.adminDatabase.getAnalyticsPipeline(),
    );
  }

  @Get('rbac')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  getRbac() {
    return successResponse(
      'Admin permission matrix fetched successfully.',
      this.adminDatabase.getPermissionMatrix(),
    );
  }

  @Get('operational-settings')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  async getOperationalSettings() {
    return successResponse(
      'Operational settings fetched successfully.',
      await this.adminDatabase.getOperationalSettings(),
    );
  }

  @Patch('operational-settings')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard, RolesGuard)
  @Roles('Super Admin', 'Operations Admin')
  async updateOperationalSettings(
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Operational settings updated successfully.',
      await this.adminDatabase.updateOperationalSettings(body, admin.adminId),
    );
  }

  @Get('audit-log-system')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  async getAuditLogs() {
    return successResponse(
      'Admin audit log system fetched successfully.',
      await this.adminDatabase.getAuditLogs(),
    );
  }

  @Get('content-operations')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  async getContentOperations() {
    return successResponse(
      'Content operations fetched successfully.',
      await this.adminDatabase.getContentOperations(),
    );
  }

  @Get('commerce-risk')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  async getCommerceRisk() {
    return successResponse(
      'Commerce risk data fetched successfully.',
      await this.adminDatabase.getCommerceRisk(),
    );
  }

  @Get('support-operations')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  async getSupportOperations(@Query() query: AdminSupportOperationsQueryDto) {
    return successResponse(
      'Support operations fetched successfully.',
      await this.adminDatabase.getSupportOperations(query),
    );
  }

  @Get('support-operations/:id')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard)
  async getSupportOperationDetail(@Param('id') id: string) {
    return successResponse(
      'Support ticket fetched successfully.',
      await this.adminDatabase.getSupportOperationDetail(id),
    );
  }

  @Patch('support-operations/:id')
  @ApiBearerAuth('admin-bearer')
  @UseGuards(AdminSessionGuard, RolesGuard)
  @Roles('Super Admin', 'Operations Admin', 'Support Admin')
  async updateSupportOperation(
    @Param('id') id: string,
    @Body() body: AdminSupportTicketUpdateDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Support ticket updated successfully.',
      await this.adminDatabase.updateSupportTicket(id, body, admin.adminId),
    );
  }
}
