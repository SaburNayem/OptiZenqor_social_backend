import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { CreateTicketDto } from '../dto/api.dto';

@ApiTags('support')
@Controller()
export class SupportController {
  constructor(private readonly ecosystemData: EcosystemDataService) {}

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
    };
  }

  @Post('support/tickets')
  createTicket(@Body() body: CreateTicketDto) {
    return this.ecosystemData.createTicket(body.subject, body.category);
  }
}
