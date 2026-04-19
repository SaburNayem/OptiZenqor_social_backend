import { Body, Controller, Get, Post } from '@nestjs/common';
import { PlatformDataService } from '../data/platform-data.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get('campaigns')
  getCampaigns() {
    return this.platformData.getCampaigns();
  }

  @Post('campaigns')
  createCampaign(
    @Body() body: { name: string; audience: string; schedule: string },
  ) {
    return this.platformData.createCampaign(body);
  }
}
