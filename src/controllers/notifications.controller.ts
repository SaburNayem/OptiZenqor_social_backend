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
    return {
      inbox: await this.coreDatabase.getNotificationInbox(userId),
      campaigns: this.platformData.getCampaigns(),
      preferences: this.appExtensionsData.getPushNotificationPreferences(),
    };
  }

  @Get('inbox')
  @ApiQuery({ name: 'userId', required: false })
  async getInbox(@Query('userId') userId?: string) {
    return this.coreDatabase.getNotificationInbox(userId);
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
    return this.coreDatabase.markNotificationRead(id, body.userId);
  }
}
