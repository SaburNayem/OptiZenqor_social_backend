import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';

@ApiTags('support')
@Controller()
export class SupportController {
  constructor(private readonly ecosystemData: EcosystemDataService) {}

  @Get('notifications/inbox')
  getNotificationInbox() {
    return this.ecosystemData.getNotificationInbox();
  }

  @Get('settings/sections')
  getSettingsSections() {
    return this.ecosystemData.getSettingsSections();
  }

  @Get('support/faqs')
  getFaqs() {
    return this.ecosystemData.getFaqs();
  }

  @Get('support/tickets')
  getTickets() {
    return this.ecosystemData.getTickets();
  }

  @Post('support/tickets')
  createTicket(@Body() body: { subject: string; category: string }) {
    return this.ecosystemData.createTicket(body.subject, body.category);
  }
}
