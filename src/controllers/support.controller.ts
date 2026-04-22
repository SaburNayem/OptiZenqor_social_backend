import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { ExtendedDataService } from '../data/extended-data.service';
import { CreateTicketDto } from '../dto/api.dto';

@ApiTags('support')
@Controller()
export class SupportController {
  constructor(
    private readonly ecosystemData: EcosystemDataService,
    private readonly extendedData: ExtendedDataService,
    private readonly appExtensionsData: AppExtensionsDataService,
  ) {}

  @Get('support/faqs')
  getFaqs() {
    return this.ecosystemData.getFaqs();
  }

  @Get('support/tickets')
  getTickets() {
    return this.ecosystemData.getTickets();
  }

  @Get('support-help')
  getSupportHelp() {
    return {
      faqs: this.ecosystemData.getFaqs(),
      tickets: this.ecosystemData.getTickets(),
      chat: this.extendedData.getSupportChat(),
      mail: this.appExtensionsData.getSupportMail(),
    };
  }

  @Get('support-help/faq')
  getSupportHelpFaq() {
    return this.ecosystemData.getFaqs();
  }

  @Get('support-help/chat')
  getSupportHelpChat() {
    return this.extendedData.getSupportChat();
  }

  @Get('support-help/mail')
  getSupportHelpMail() {
    return this.appExtensionsData.getSupportMail();
  }

  @Post('support/tickets')
  createTicket(@Body() body: CreateTicketDto) {
    return this.ecosystemData.createTicket(body.subject, body.category);
  }
}
