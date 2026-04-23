import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import {
  CreateNotificationCampaignDto,
  MarkNotificationReadDto,
} from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly platformData: PlatformDataService,
    private readonly appExtensionsData: AppExtensionsDataService,
  ) {}

  @Get()
  @ApiQuery({ name: 'userId', required: false })
  async getNotificationsOverview(@Query('userId') userId?: string) {
    const notifications = await this.coreDatabase.getNotificationInbox(userId);
    return {
      success: true,
      message: 'Notifications fetched successfully.',
      notifications,
      items: notifications,
      results: notifications,
      data: notifications,
      inbox: notifications,
      campaigns: this.platformData.getCampaigns(),
      preferences: this.appExtensionsData.getPushNotificationPreferences(),
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

  @Get('preferences')
  getPreferences() {
    return this.appExtensionsData.getPushNotificationPreferences();
  }

  @Get('campaigns')
  getCampaigns() {
    return this.platformData.getCampaigns();
  }

  @Post('campaigns')
  createCampaign(@Body() body: CreateNotificationCampaignDto) {
    return this.platformData.createCampaign(body);
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string, @Body() body: MarkNotificationReadDto) {
    const notification = await this.coreDatabase.markNotificationRead(id, body.userId);
    return {
      success: true,
      message: 'Notification marked as read successfully.',
      ...notification,
      notification,
      data: notification,
    };
  }
}
