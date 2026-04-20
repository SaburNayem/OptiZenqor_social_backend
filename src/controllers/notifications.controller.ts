import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import {
  CreateNotificationCampaignDto,
  MarkNotificationReadDto,
} from '../dto/api.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly platformData: PlatformDataService,
    private readonly ecosystemData: EcosystemDataService,
    private readonly appExtensionsData: AppExtensionsDataService,
  ) {}

  @Get()
  @ApiQuery({ name: 'userId', required: false })
  getNotificationsOverview(@Query('userId') userId?: string) {
    return {
      inbox: this.ecosystemData.getNotificationInbox(userId),
      campaigns: this.platformData.getCampaigns(),
      preferences: this.appExtensionsData.getPushNotificationPreferences(),
    };
  }

  @Get('inbox')
  @ApiQuery({ name: 'userId', required: false })
  getInbox(@Query('userId') userId?: string) {
    return this.ecosystemData.getNotificationInbox(userId);
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
  markRead(@Param('id') id: string, @Body() body: MarkNotificationReadDto) {
    return this.ecosystemData.markNotificationRead(id, body.userId);
  }
}
