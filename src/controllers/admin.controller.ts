import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
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
  AdminModerateContentDto,
  AdminReportsQueryDto,
  AdminSettingsPatchDto,
  AdminUpdateReportDto,
  AdminUpdateUserDto,
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
  async updateSettings(@Body() body: AdminSettingsPatchDto) {
    return successResponse(
      'Admin settings updated successfully.',
      await this.adminDatabase.updateOperationalSettings(body.patch),
    );
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'List admin audit logs' })
  async getAuditLogs(@Query() query: AdminAuditLogsQueryDto) {
    const payload = await this.adminDatabase.queryAuditLogs(query);
    return successResponse('Admin audit logs fetched successfully.', payload, payload.pagination);
  }
}
