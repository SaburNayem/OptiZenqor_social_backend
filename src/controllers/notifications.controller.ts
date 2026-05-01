import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBody, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RegisterPushDeviceDto } from '../dto/admin.dto';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  CreateNotificationCampaignDto,
  MarkNotificationReadDto,
} from '../dto/api.dto';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { AdminDatabaseService } from '../services/admin-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { MonetizationDatabaseService } from '../services/monetization-database.service';

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
    return {
      success: true,
      message: 'Notifications fetched successfully.',
      notifications,
      items: notifications,
      results: notifications,
      data: notifications,
      inbox: notifications,
      campaigns: await this.monetizationDatabase.getNotificationCampaigns(),
      preferences: resolvedUser
        ? await this.accountStateDatabase.getSettingsState(resolvedUser)
        : {},
    };
  }

  @Get('inbox')
  @ApiQuery({ name: 'userId', required: false })
  async getInbox(@Query('userId') userId?: string) {
    const notifications = await this.coreDatabase.getNotificationInbox(userId);
    return {
      success: true,
      message: 'Notification inbox fetched successfully.',
      notifications,
      items: notifications,
      results: notifications,
      data: notifications,
      inbox: notifications,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Get('preferences')
  async getPreferences(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      success: true,
      message: 'Notification preferences fetched successfully.',
      data: await this.accountStateDatabase.getSettingsState(user.id),
    };
  }

  @Get('campaigns')
  async getCampaigns() {
    return {
      success: true,
      message: 'Notification campaigns fetched successfully.',
      data: await this.monetizationDatabase.getNotificationCampaigns(),
    };
  }

  @Post('campaigns')
  async createCampaign(@Body() body: CreateNotificationCampaignDto) {
    return {
      success: true,
      message: 'Notification campaign created successfully.',
      data: await this.monetizationDatabase.createNotificationCampaign(body),
    };
  }

  @UseGuards(SessionAuthGuard)
  @Post('devices')
  @ApiBody({ type: RegisterPushDeviceDto })
  async registerDevice(
    @Body() body: RegisterPushDeviceDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      success: true,
      message: 'Push device registered successfully.',
      data: await this.adminDatabase.registerPushDevice(user.id, body),
    };
  }

  @UseGuards(SessionAuthGuard)
  @Delete('devices/:token')
  async unregisterDevice(
    @Param('token') token: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      success: true,
      message: 'Push device unregistered successfully.',
      data: await this.adminDatabase.unregisterPushDevice(user.id, token),
    };
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
    return {
      success: true,
      message: 'Notification marked as read successfully.',
      ...notification,
      notification,
      data: notification,
    };
  }
}
