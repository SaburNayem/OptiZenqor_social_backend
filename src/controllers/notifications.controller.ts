import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RegisterPushDeviceDto } from '../dto/admin.dto';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  CreateNotificationCampaignDto,
  MarkNotificationReadDto,
  NotificationDevicesQueryDto,
  UpdateNotificationDeviceDto,
} from '../dto/api.dto';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { AdminDatabaseService } from '../services/admin-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { MonetizationDatabaseService } from '../services/monetization-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly monetizationDatabase: MonetizationDatabaseService,
    private readonly adminDatabase: AdminDatabaseService,
  ) {}

  @Get()
  @ApiQuery({ name: 'userId', required: false })
  async getNotificationsOverview(
    @Query('userId') userId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const resolvedUser =
      userId?.trim() ||
      (await this.coreDatabase
        .requireUserFromAuthorization(authorization)
        .then((user) => user.id)
        .catch(() => undefined));
    const notifications = await this.coreDatabase.getNotificationInbox(resolvedUser);
    const campaigns = await this.monetizationDatabase.getNotificationCampaigns();
    const preferences = resolvedUser
      ? await this.accountStateDatabase.getSettingsState(resolvedUser)
      : {};
    return successResponse('Notifications fetched successfully.', {
      notifications,
      campaigns,
      preferences,
    });
  }

  @Get('inbox')
  @ApiQuery({ name: 'userId', required: false })
  async getInbox(@Query('userId') userId?: string) {
    const notifications = await this.coreDatabase.getNotificationInbox(userId);
    return successResponse('Notification inbox fetched successfully.', notifications);
  }

  @UseGuards(SessionAuthGuard)
  @Get('preferences')
  async getPreferences(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Notification preferences fetched successfully.',
      await this.accountStateDatabase.getSettingsState(user.id),
    );
  }

  @Get('campaigns')
  async getCampaigns() {
    return successResponse(
      'Notification campaigns fetched successfully.',
      await this.monetizationDatabase.getNotificationCampaigns(),
    );
  }

  @Post('campaigns')
  async createCampaign(@Body() body: CreateNotificationCampaignDto) {
    return successResponse(
      'Notification campaign created successfully.',
      await this.monetizationDatabase.createNotificationCampaign(body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Post('devices')
  @ApiBody({ type: RegisterPushDeviceDto })
  async registerDevice(
    @Body() body: RegisterPushDeviceDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Push device registered successfully.',
      await this.adminDatabase.registerPushDevice(user.id, body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Get('devices')
  async getDevices(
    @Query() query: NotificationDevicesQueryDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Push devices fetched successfully.',
      await this.adminDatabase.listUserPushDevices(user.id, query),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('devices/:id')
  async updateDevice(
    @Param('id') id: string,
    @Body() body: UpdateNotificationDeviceDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Push device updated successfully.',
      await this.adminDatabase.updateUserPushDevice(user.id, id, body),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Delete('devices/:token')
  async unregisterDevice(
    @Param('token') token: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Push device unregistered successfully.',
      await this.adminDatabase.unregisterPushDevice(user.id, token),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Delete('devices/id/:id')
  async deleteDeviceById(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Push device deleted successfully.',
      await this.adminDatabase.deleteUserPushDevice(user.id, id),
    );
  }

  @Patch(':id/read')
  @Post(':id/read')
  async markRead(
    @Param('id') id: string,
    @Body() body: MarkNotificationReadDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const notification = await this.coreDatabase.markNotificationRead(id, actor.id);
    return successResponse('Notification marked as read successfully.', notification);
  }
}
