import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { SettingsDataService } from '../data/settings-data.service';
import { CreateTicketDto } from '../dto/api.dto';

@ApiTags('support')
@Controller()
export class SupportController {
  constructor(
    private readonly ecosystemData: EcosystemDataService,
    private readonly settingsData: SettingsDataService,
  ) {}

  @Get('notifications/inbox')
  getNotificationInbox() {
    return this.ecosystemData.getNotificationInbox();
  }

  @Get('settings/sections')
  getSettingsSections() {
    return this.settingsData.getSections();
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
  createTicket(@Body() body: CreateTicketDto) {
    return this.ecosystemData.createTicket(body.subject, body.category);
  }
}
