import {
  Body,
  Controller,
  Delete,
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
  AdminEventUpdateDto,
  AdminEventUpsertDto,
  AdminJobUpdateDto,
  AdminJobUpsertDto,
  AdminMarketplaceUpdateDto,
  AdminMarketplaceUpsertDto,
  AdminModerateContentDto,
  AdminNotificationCampaignActionDto,
  AdminNotificationCampaignCreateDto,
  AdminNotificationCampaignUpdateDto,
  AdminNotificationDeviceUpdateDto,
  AdminPageUpdateDto,
  AdminPremiumPlanCreateDto,
  AdminPremiumPlanUpdateDto,
  AdminReportsQueryDto,
  AdminCommunityUpdateDto,
  AdminSettingsPatchDto,
  AdminUpdateLiveStreamDto,
  AdminUpdateReportDto,
  AdminUpdateUserDto,
  AdminUpdateUserStatusDto,
  AdminUsersQueryDto,
  AdminWalletSubscriptionUpdateDto,
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

  @Post('marketplace')
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Create a marketplace item from the admin surface' })
  async createMarketplace(
    @Body() body: AdminMarketplaceUpsertDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin marketplace item created successfully.',
      await this.adminDatabase.createAdminMarketplace(body, admin.adminId),
    );
  }

  @Patch('marketplace/:id')
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Update a marketplace item from the admin surface' })
  async updateMarketplace(
    @Param('id') id: string,
    @Body() body: AdminMarketplaceUpdateDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin marketplace item updated successfully.',
      await this.adminDatabase.updateAdminMarketplace(id, body, admin.adminId),
    );
  }

  @Delete('marketplace/:id')
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Delete a marketplace item from the admin surface' })
  async deleteMarketplace(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin marketplace item deleted successfully.',
      await this.adminDatabase.deleteAdminMarketplace(id, admin.adminId),
    );
  }

  @Get('jobs')
  @ApiOperation({ summary: 'List jobs for admin review' })
  async getJobs(@Query() query: AdminEntityListQueryDto) {
    const payload = await this.adminDatabase.queryAdminJobs(query);
    return successResponse('Admin jobs fetched successfully.', payload, payload.pagination);
  }

  @Post('jobs')
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Create a job from the admin surface' })
  async createJob(
    @Body() body: AdminJobUpsertDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin job created successfully.',
      await this.adminDatabase.createAdminJob(body, admin.adminId),
    );
  }

  @Patch('jobs/:id')
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Update a job from the admin surface' })
  async updateJob(
    @Param('id') id: string,
    @Body() body: AdminJobUpdateDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin job updated successfully.',
      await this.adminDatabase.updateAdminJob(id, body, admin.adminId),
    );
  }

  @Delete('jobs/:id')
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Delete a job from the admin surface' })
  async deleteJob(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin job deleted successfully.',
      await this.adminDatabase.deleteAdminJob(id, admin.adminId),
    );
  }

  @Get('events')
  @ApiOperation({ summary: 'List events for admin review' })
  async getEvents(@Query() query: AdminEntityListQueryDto) {
    const payload = await this.adminDatabase.queryAdminEvents(query);
    return successResponse('Admin events fetched successfully.', payload, payload.pagination);
  }

  @Post('events')
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Create an event from the admin surface' })
  async createEvent(
    @Body() body: AdminEventUpsertDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin event created successfully.',
      await this.adminDatabase.createAdminEvent(body, admin.adminId),
    );
  }

  @Patch('events/:id')
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Update an event from the admin surface' })
  async updateEvent(
    @Param('id') id: string,
    @Body() body: AdminEventUpdateDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin event updated successfully.',
      await this.adminDatabase.updateAdminEvent(id, body, admin.adminId),
    );
  }

  @Delete('events/:id')
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Delete an event from the admin surface' })
  async deleteEvent(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin event deleted successfully.',
      await this.adminDatabase.deleteAdminEvent(id, admin.adminId),
    );
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

  @Get('communities/:id')
  @ApiOperation({ summary: 'Get community detail for admin review' })
  async getCommunityDetail(@Param('id') id: string) {
    return successResponse(
      'Admin community fetched successfully.',
      await this.adminDatabase.getAdminCommunity(id),
    );
  }

  @Patch('communities/:id')
  @Roles('Super Admin', 'Operations Admin', 'Content Moderator')
  @ApiOperation({ summary: 'Update a community from the admin surface' })
  async updateCommunity(
    @Param('id') id: string,
    @Body() body: AdminCommunityUpdateDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin community updated successfully.',
      await this.adminDatabase.updateAdminCommunity(id, body, admin.adminId),
    );
  }

  @Get('pages')
  @ApiOperation({ summary: 'List pages for admin review' })
  async getPages(@Query() query: AdminEntityListQueryDto) {
    const payload = await this.adminDatabase.queryAdminPages(query);
    return successResponse('Admin pages fetched successfully.', payload, payload.pagination);
  }

  @Get('pages/:id')
  @ApiOperation({ summary: 'Get page detail for admin review' })
  async getPageDetail(@Param('id') id: string) {
    return successResponse(
      'Admin page fetched successfully.',
      await this.adminDatabase.getAdminPage(id),
    );
  }

  @Patch('pages/:id')
  @Roles('Super Admin', 'Operations Admin', 'Content Moderator')
  @ApiOperation({ summary: 'Update a page from the admin surface' })
  async updatePage(
    @Param('id') id: string,
    @Body() body: AdminPageUpdateDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin page updated successfully.',
      await this.adminDatabase.updateAdminPage(id, body, admin.adminId),
    );
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

  @Get('live-streams/:id')
  @ApiOperation({ summary: 'Get live stream detail for admin review' })
  async getLiveStreamDetail(@Param('id') id: string) {
    return successResponse(
      'Admin live stream fetched successfully.',
      await this.adminDatabase.getAdminLiveStream(id),
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

  @Patch('wallet-subscriptions/:id')
  @Roles('Super Admin', 'Operations Admin', 'Finance Admin')
  @ApiOperation({ summary: 'Update a subscription from the admin wallet surface' })
  async updateWalletSubscription(
    @Param('id') id: string,
    @Body() body: AdminWalletSubscriptionUpdateDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin wallet subscription updated successfully.',
      await this.adminDatabase.updateAdminWalletSubscription(id, body, admin.adminId),
    );
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

  @Get('revenue/export')
  @Roles('Super Admin', 'Operations Admin', 'Finance Admin')
  @ApiOperation({ summary: 'Export revenue, wallet, and subscription admin data' })
  async exportRevenue(
    @Query() query: AdminEntityListQueryDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin revenue export prepared successfully.',
      await this.adminDatabase.exportAdminRevenue(query, admin.adminId),
    );
  }

  @Get('wallet/export')
  @Roles('Super Admin', 'Operations Admin', 'Finance Admin')
  @ApiOperation({ summary: 'Export wallet transaction admin data' })
  async exportWallet(
    @Query() query: AdminEntityListQueryDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin wallet export prepared successfully.',
      await this.adminDatabase.exportAdminWallet(query, admin.adminId),
    );
  }

  @Get('wallet/:id')
  @ApiOperation({ summary: 'Get wallet transaction detail for admin review' })
  async getWalletDetail(@Param('id') id: string) {
    return successResponse(
      'Admin wallet transaction fetched successfully.',
      await this.adminDatabase.getAdminWalletTransaction(id),
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

  @Get('subscriptions/export')
  @Roles('Super Admin', 'Operations Admin', 'Finance Admin')
  @ApiOperation({ summary: 'Export subscription admin data' })
  async exportSubscriptions(
    @Query() query: AdminEntityListQueryDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin subscriptions export prepared successfully.',
      await this.adminDatabase.exportAdminSubscriptions(query, admin.adminId),
    );
  }

  @Get('subscriptions/:id')
  @ApiOperation({ summary: 'Get subscription detail for admin review' })
  async getSubscriptionDetail(@Param('id') id: string) {
    return successResponse(
      'Admin subscription fetched successfully.',
      await this.adminDatabase.getAdminSubscription(id),
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

  @Get('notification-devices/:id')
  @ApiOperation({ summary: 'Get push notification device detail' })
  async getNotificationDeviceDetail(@Param('id') id: string) {
    return successResponse(
      'Admin notification device fetched successfully.',
      await this.adminDatabase.getAdminNotificationDevice(id),
    );
  }

  @Patch('notification-devices/:id')
  @Roles('Super Admin', 'Operations Admin', 'Support Admin')
  @ApiOperation({ summary: 'Activate or deactivate a push notification device' })
  async updateNotificationDevice(
    @Param('id') id: string,
    @Body() body: AdminNotificationDeviceUpdateDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin notification device updated successfully.',
      await this.adminDatabase.updateAdminNotificationDevice(id, body, admin.adminId),
    );
  }

  @Patch('notifications/devices/:id')
  @Roles('Super Admin', 'Operations Admin', 'Support Admin')
  @ApiOperation({ summary: 'Backward-compatible admin notifications devices mutation route' })
  async updateNotificationDeviceAlias(
    @Param('id') id: string,
    @Body() body: AdminNotificationDeviceUpdateDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.updateNotificationDevice(id, body, authorization);
  }

  @Delete('notification-devices/:id')
  @Roles('Super Admin', 'Operations Admin', 'Support Admin')
  @ApiOperation({ summary: 'Delete a push notification device registration' })
  async deleteNotificationDevice(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin notification device deleted successfully.',
      await this.adminDatabase.deleteAdminNotificationDevice(id, admin.adminId),
    );
  }

  @Get('notifications')
  @ApiOperation({ summary: 'Backward-compatible notifications overview route' })
  async getNotificationsOverview(@Query() query: AdminEntityListQueryDto) {
    const [campaigns, devices] = await Promise.all([
      this.adminDatabase.queryAdminNotificationCampaigns(query),
      this.adminDatabase.queryAdminNotificationDevices(query),
    ]);

    return successResponse('Admin notifications overview fetched successfully.', {
      campaigns,
      devices,
    });
  }

  @Get('notification-campaigns')
  @ApiOperation({ summary: 'List notification campaigns for admin review' })
  async getNotificationCampaigns(@Query() query: AdminEntityListQueryDto) {
    const payload = await this.adminDatabase.queryAdminNotificationCampaigns(query);
    return successResponse(
      'Admin notification campaigns fetched successfully.',
      payload,
      payload.pagination,
    );
  }

  @Post('notification-campaigns')
  @Roles('Super Admin', 'Operations Admin', 'Support Admin')
  @ApiOperation({ summary: 'Create a notification campaign' })
  async createNotificationCampaign(
    @Body() body: AdminNotificationCampaignCreateDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin notification campaign created successfully.',
      await this.adminDatabase.createAdminNotificationCampaign(body, admin.adminId),
    );
  }

  @Patch('notification-campaigns/:id')
  @Roles('Super Admin', 'Operations Admin', 'Support Admin')
  @ApiOperation({ summary: 'Update a notification campaign' })
  async updateNotificationCampaign(
    @Param('id') id: string,
    @Body() body: AdminNotificationCampaignUpdateDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin notification campaign updated successfully.',
      await this.adminDatabase.updateAdminNotificationCampaign(id, body, admin.adminId),
    );
  }

  @Get('notification-campaigns/:id')
  @ApiOperation({ summary: 'Get notification campaign detail and lifecycle stats' })
  async getNotificationCampaignDetail(@Param('id') id: string) {
    return successResponse(
      'Admin notification campaign fetched successfully.',
      await this.adminDatabase.getAdminNotificationCampaign(id),
    );
  }

  @Post('notification-campaigns/:id/actions')
  @Roles('Super Admin', 'Operations Admin', 'Support Admin')
  @ApiOperation({ summary: 'Send, schedule, cancel, or delete a notification campaign' })
  async runNotificationCampaignAction(
    @Param('id') id: string,
    @Body() body: AdminNotificationCampaignActionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin notification campaign action applied successfully.',
      await this.adminDatabase.runAdminNotificationCampaignAction(id, body, admin.adminId),
    );
  }

  @Delete('notification-campaigns/:id')
  @Roles('Super Admin', 'Operations Admin', 'Support Admin')
  @ApiOperation({ summary: 'Delete a notification campaign through a REST endpoint' })
  async deleteNotificationCampaign(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin notification campaign deleted successfully.',
      await this.adminDatabase.deleteAdminNotificationCampaign(id, admin.adminId),
    );
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

  @Delete('premium-plans/:id')
  @Roles('Super Admin', 'Operations Admin')
  @ApiOperation({ summary: 'Delete a premium plan' })
  async deletePremiumPlan(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const admin = await this.adminDatabase.getAuthenticatedAdmin(authorization);
    return successResponse(
      'Admin premium plan deleted successfully.',
      await this.adminDatabase.deleteAdminPremiumPlan(id, admin.adminId),
    );
  }
}
