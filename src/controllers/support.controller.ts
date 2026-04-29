import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CreateTicketDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { SupportDatabaseService } from '../services/support-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('support')
@Controller()
export class SupportController {
  constructor(
    private readonly supportDatabase: SupportDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get('support/faqs')
  getFaqs() {
    return successResponse(
      'Support FAQs fetched successfully.',
      this.supportDatabase.getFaqs(),
    );
  }

  @Get('support/tickets')
  async getTickets(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Support tickets fetched successfully.',
      await this.supportDatabase.getTickets(user.id),
    );
  }

  @Get('support-help')
  async getSupportHelp(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization).catch(() => null);
    const tickets = await this.supportDatabase.getTickets(user?.id ?? null);
    return successResponse('Support help fetched successfully.', {
      faqs: this.supportDatabase.getFaqs(),
      tickets,
      chat: this.supportDatabase.getSupportChat(user?.id ?? null),
      mail: this.supportDatabase.getSupportMail(),
    });
  }

  @Get('support-help/faq')
  getSupportHelpFaq() {
    return successResponse(
      'Support FAQs fetched successfully.',
      this.supportDatabase.getFaqs(),
    );
  }

  @Get('support-help/chat')
  async getSupportHelpChat(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization).catch(() => null);
    return successResponse(
      'Support chat fetched successfully.',
      this.supportDatabase.getSupportChat(user?.id ?? null),
    );
  }

  @Get('support-help/mail')
  getSupportHelpMail() {
    return successResponse(
      'Support mail settings fetched successfully.',
      this.supportDatabase.getSupportMail(),
    );
  }

  @Post('support/tickets')
  async createTicket(
    @Body() body: CreateTicketDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization).catch(() => null);
    return successResponse(
      'Support ticket created successfully.',
      await this.supportDatabase.createTicket({
        subject: body.subject,
        category: body.category,
        userId: user?.id ?? null,
      }),
    );
  }
}
