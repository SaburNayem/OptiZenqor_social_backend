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
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AdminSessionGuard } from '../auth/admin-session.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  AdminAuditLogsQueryDto,
  AdminContentQueryDto,
  AdminEntityListQueryDto,
  AdminModerateContentDto,
  AdminPremiumPlanCreateDto,
  AdminPremiumPlanUpdateDto,
  AdminReportsQueryDto,
  AdminSettingsPatchDto,
  AdminUpdateLiveStreamDto,
  AdminUpdateReportDto,
  AdminUpdateUserDto,
  AdminUpdateUserStatusDto,
  AdminUsersQueryDto,
} from '../dto/admin.dto';
import { AdminDatabaseService } from '../services/admin-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('admin')
@ApiBearerAuth('admin-bearer')
@UseGuards(AdminSessionGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminDatabase: AdminDatabaseService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Backward-compatible admin dashboard overview route' })
  getDashboard() {
    return this.getDashboardOverview();
  }

  @Get('dashboard/overview')
  @ApiOperation({ summary: 'Get admin dashboard overview metrics' })
  async getDashboardOverview() {
    return successResponse(
      'Admin dashboard overview fetched successfully.',
      await this.adminDatabase.getDashboardOverview(),
    );
  }

  @Get('dashboard/users')
  @ApiOperation({ summary: 'Get dashboard user analytics block' })
  async getDashboardUsers() {
    return successResponse(
      'Admin dashboard users fetched successfully.',
      await this.adminDatabase.getDashboardUsers(),
    );
  }

  @Get('dashboard/content')
  @ApiOperation({ summary: 'Get dashboard content analytics block' })
  async getDashboardContent() {
    return successResponse(
      'Admin dashboard content fetched successfully.',
      await this.adminDatabase.getDashboardContent(),
    );
  }

  @Get('dashboard/reports')
  @ApiOperation({ summary: 'Get dashboard reports analytics block' })
  async getDashboardReports() {
    return successResponse(
      'Admin dashboard reports fetched successfully.',
      await this.adminDatabase.getDashboardReports(),
    );
  }

  @Get('dashboard/revenue')
  @ApiOperation({ summary: 'Get dashboard revenue analytics block' })
  async getDashboardRevenue() {
    return successResponse(
      'Admin dashboard revenue fetched successfully.',
      await this.adminDatabase.getDashboardRevenue(),
    );
  }

  @Get('dashboard/moderation')
  @ApiOperation({ summary: 'Get dashboard moderation analytics block' })
  async getDashboardModeration() {
    return successResponse(
      'Admin dashboard moderation fetched successfully.',
      await this.adminDatabase.getDashboardModeration(),
    );
  }

  @Get('users')
  @ApiOperation({ summary: 'List users for admin management' })
  async getAdminUsers(@Query() query: AdminUsersQueryDto) {
    const payload = await this.adminDatabase.queryAdminUsers(query);
    return successResponse('Admin users fetched successfully.', payload, payload.pagination);
  }

  @Patch('users/:id')
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Update a user through the admin surface' })
  async updateAdminUser(
    @Param('id') id: string,
    @Body() body: AdminUpdateUserDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin user updated successfully.',
      await this.adminDatabase.updateAdminUser(id, body, admin.adminId),
    );
  }

  @Patch('users/:id/status')
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Update a user status through a backward-compatible admin route' })
  async updateAdminUserStatus(
    @Param('id') id: string,
    @Body() body: AdminUpdateUserStatusDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin user status updated successfully.',
      await this.adminDatabase.updateAdminUser(id, body, admin.adminId),
    );
  }

  @Get('content')
  @ApiOperation({ summary: 'List moderatable content for admin management' })
  async getContent(@Query() query: AdminContentQueryDto) {
    const payload = await this.adminDatabase.queryAdminContent(query);
    return successResponse('Admin content fetched successfully.', payload, payload.pagination);
  }

  @Patch('content/:type/:id/moderate')
  @Roles('Super Admin', 'Operations Admin', 'Content Moderator')
  @ApiOperation({ summary: 'Moderate a post, reel, or story' })
  async moderateContent(
    @Param('type') type: 'post' | 'reel' | 'story',
    @Param('id') id: string,
    @Body() body: AdminModerateContentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin content moderation applied successfully.',
      await this.adminDatabase.moderateContent(type, id, body, admin.adminId),
    );
  }

  @Patch('content/:id/moderation')
  @Roles('Super Admin', 'Operations Admin', 'Content Moderator')
  @ApiOperation({ summary: 'Moderate content through the dashboard compatibility route' })
  async moderateContentAlias(
    @Param('id') id: string,
    @Body() body: AdminModerateContentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin content moderation applied successfully.',
      await this.adminDatabase.moderateContentById(id, body, admin.adminId),
    );
  }

  @Get('reports')
  @ApiOperation({ summary: 'List reports for admin review' })
  async getReports(@Query() query: AdminReportsQueryDto) {
    const payload = await this.adminDatabase.queryReports(query);
    return successResponse('Admin reports fetched successfully.', payload, payload.pagination);
  }

  @Patch('reports/:id')
  @Roles('Super Admin', 'Operations Admin', 'Content Moderator', 'Support Admin')
  @ApiOperation({ summary: 'Update a report status' })
  async updateReport(
    @Param('id') id: string,
    @Body() body: AdminUpdateReportDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin report updated successfully.',
      await this.adminDatabase.updateReport(id, body, admin.adminId),
    );
  }

  @Get('settings')
  @ApiOperation({ summary: 'Read operational admin settings' })
  async getSettings() {
    return successResponse(
      'Admin settings fetched successfully.',
      await this.adminDatabase.getOperationalSettings(),
    );
  }

  @Patch('settings')
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Update operational admin settings' })
  async updateSettings(
    @Body() body: AdminSettingsPatchDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin settings updated successfully.',
      await this.adminDatabase.updateOperationalSettings(body.patch, admin.adminId),
    );
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'List admin audit logs' })
  async getAuditLogs(@Query() query: AdminAuditLogsQueryDto) {
    const payload = await this.adminDatabase.queryAuditLogs(query);
    return successResponse('Admin audit logs fetched successfully.', payload, payload.pagination);
  }

  @Get('marketplace')
  @ApiOperation({ summary: 'List marketplace items for admin review' })
  async getMarketplace(@Query() query: AdminEntityListQueryDto) {
    const payload = await this.adminDatabase.queryAdminMarketplace(query);
    return successResponse(
      'Admin marketplace data fetched successfully.',
      payload,
      payload.pagination,
    );
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List jobs for admin review' })
  async getJobs(@Query() query: AdminEntityListQueryDto) {
    const payload = await this.adminDatabase.queryAdminJobs(query);
    return successResponse('Admin jobs fetched successfully.', payload, payload.pagination);
  }

  @Get('events')
  @ApiOperation({ summary: 'List events for admin review' })
  async getEvents(@Query() query: AdminEntityListQueryDto) {
    const payload = await this.adminDatabase.queryAdminEvents(query);
    return successResponse('Admin events fetched successfully.', payload, payload.pagination);
  }

  @Get('communities')
  @ApiOperation({ summary: 'List communities for admin review' })
  async getCommunities(@Query() query: AdminEntityListQueryDto) {
    const payload = await this.adminDatabase.queryAdminCommunities(query);
    return successResponse(
      'Admin communities fetched successfully.',
      payload,
      payload.pagination,
    );
  }

  @Get('pages')
  @ApiOperation({ summary: 'List pages for admin review' })
  async getPages(@Query() query: AdminEntityListQueryDto) {
    const payload = await this.adminDatabase.queryAdminPages(query);
    return successResponse('Admin pages fetched successfully.', payload, payload.pagination);
  }

  @Get('live-streams')
  @ApiOperation({ summary: 'List live streams for admin review' })
  async getLiveStreams(@Query() query: AdminEntityListQueryDto) {
    const payload = await this.adminDatabase.queryAdminLiveStreams(query);
    return successResponse(
      'Admin live streams fetched successfully.',
      payload,
      payload.pagination,
    );
  }

  @Patch('live-streams/:id')
  @Roles('Super Admin', 'Operations Admin', 'Content Moderator')
  @ApiOperation({ summary: 'Update live stream moderation and lifecycle state' })
  async updateLiveStream(
    @Param('id') id: string,
    @Body() body: AdminUpdateLiveStreamDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin live stream updated successfully.',
      await this.adminDatabase.updateAdminLiveStream(id, body, admin.adminId),
    );
  }

  @Get('monetization')
  @ApiOperation({ summary: 'List wallet and subscription activity for admin review' })
  async getMonetization(@Query() query: AdminEntityListQueryDto) {
    const payload = await this.adminDatabase.queryAdminMonetization(query);
    return successResponse(
      'Admin monetization data fetched successfully.',
      payload,
      payload.pagination,
    );
  }

  @Get('wallet-subscriptions')
  @ApiOperation({ summary: 'Backward-compatible wallet and subscription admin route' })
  async getWalletSubscriptions(@Query() query: AdminEntityListQueryDto) {
    return this.getMonetization(query);
  }

  @Get('wallet')
  @ApiOperation({ summary: 'List wallet transactions for admin review' })
  async getWallet(@Query() query: AdminEntityListQueryDto) {
    const payload = await this.adminDatabase.queryAdminWallet(query);
    return successResponse(
      'Admin wallet data fetched successfully.',
      payload,
      payload.pagination,
    );
  }

  @Get('subscriptions')
  @ApiOperation({ summary: 'List subscriptions for admin review' })
  async getSubscriptions(@Query() query: AdminEntityListQueryDto) {
    const payload = await this.adminDatabase.queryAdminSubscriptions(query);
    return successResponse(
      'Admin subscriptions fetched successfully.',
      payload,
      payload.pagination,
    );
  }

  @Get('notification-devices')
  @ApiOperation({ summary: 'List push notification devices for admin review' })
  async getNotificationDevices(@Query() query: AdminEntityListQueryDto) {
    const payload = await this.adminDatabase.queryAdminNotificationDevices(query);
    return successResponse(
      'Admin notification devices fetched successfully.',
      payload,
      payload.pagination,
    );
  }

  @Get('notifications/devices')
  @ApiOperation({ summary: 'Backward-compatible admin notifications devices route' })
  async getNotificationDevicesAlias(@Query() query: AdminEntityListQueryDto) {
    return this.getNotificationDevices(query);
  }

  @Get('premium-plans')
  @ApiOperation({ summary: 'List premium plans for admin review' })
  async getPremiumPlans(@Query() query: AdminEntityListQueryDto) {
    const payload = await this.adminDatabase.queryAdminPremiumPlans(query);
    return successResponse(
      'Admin premium plans fetched successfully.',
      payload,
      payload.pagination,
    );
  }

  @Post('premium-plans')
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Create a premium plan' })
  async createPremiumPlan(
    @Body() body: AdminPremiumPlanCreateDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin premium plan created successfully.',
      await this.adminDatabase.createAdminPremiumPlan(body, admin.adminId),
    );
  }

  @Patch('premium-plans/:id')
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Update a premium plan' })
  async updatePremiumPlan(
    @Param('id') id: string,
    @Body() body: AdminPremiumPlanUpdateDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin premium plan updated successfully.',
      await this.adminDatabase.updateAdminPremiumPlan(id, body, admin.adminId),
    );
  }
}
