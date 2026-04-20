import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import { CreateNotificationCampaignDto } from '../dto/api.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(
    private readonly platformData: PlatformDataService,
    private readonly ecosystemData: EcosystemDataService,
    private readonly appExtensionsData: AppExtensionsDataService,
  ) {}

  @Get()
  getNotificationsOverview() {
    return {
      inbox: this.ecosystemData.getNotificationInbox(),
      campaigns: this.platformData.getCampaigns(),
      preferences: this.appExtensionsData.getPushNotificationPreferences(),
    };
  }

  @Get('inbox')
  getInbox() {
    return this.ecosystemData.getNotificationInbox();
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
}
