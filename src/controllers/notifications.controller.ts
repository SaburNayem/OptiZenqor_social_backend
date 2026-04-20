import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';
import { CreateNotificationCampaignDto } from '../dto/api.dto';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get('campaigns')
  getCampaigns() {
    return this.platformData.getCampaigns();
  }

  @Post('campaigns')
  createCampaign(@Body() body: CreateNotificationCampaignDto) {
    return this.platformData.createCampaign(body);
  }
}
