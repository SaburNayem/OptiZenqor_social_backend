import { Body, Controller, Get, Headers, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  CreateSupportMessageDto,
  CreateTicketDto,
  UpdateSupportTicketDto,
} from '../dto/api.dto';
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
  async getFaqs() {
    return successResponse(
      'Support FAQs fetched successfully.',
      await this.supportDatabase.getFaqs(),
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

  @Get('support/tickets/:id')
  @UseGuards(SessionAuthGuard)
  async getTicketDetail(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Support ticket fetched successfully.',
      await this.supportDatabase.getTicketDetail(id, user.id),
    );
  }

  @Get('support-help')
  async getSupportHelp(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization).catch(() => null);
    const tickets = await this.supportDatabase.getTickets(user?.id ?? null);
    return successResponse('Support help fetched successfully.', {
      faqs: await this.supportDatabase.getFaqs(),
      tickets,
      chat: await this.supportDatabase.getSupportChat(user?.id ?? null),
      mail: await this.supportDatabase.getSupportMail(),
    });
  }

  @Get('support-help/faq')
  async getSupportHelpFaq() {
    return successResponse(
      'Support FAQs fetched successfully.',
      await this.supportDatabase.getFaqs(),
    );
  }

  @Get('support-help/chat')
  async getSupportHelpChat(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization).catch(() => null);
    return successResponse(
      'Support chat fetched successfully.',
      await this.supportDatabase.getSupportChat(user?.id ?? null),
    );
  }

  @Post('support-help/chat')
  @UseGuards(SessionAuthGuard)
  async postSupportHelpChat(
    @Body() body: CreateSupportMessageDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Support message sent successfully.',
      await this.supportDatabase.createSupportMessage({
        userId: user.id,
        message: body.message,
        attachments: body.attachments,
      }),
    );
  }

  @Get('support-help/mail')
  async getSupportHelpMail() {
    return successResponse(
      'Support mail settings fetched successfully.',
      await this.supportDatabase.getSupportMail(),
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
        message: body.message,
        priority: body.priority,
        userId: user?.id ?? null,
      }),
    );
  }

  @Post('support/tickets/:id/messages')
  @UseGuards(SessionAuthGuard)
  async createTicketMessage(
    @Param('id') id: string,
    @Body() body: CreateSupportMessageDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Support ticket message sent successfully.',
      await this.supportDatabase.createTicketMessage({
        ticketId: id,
        userId: user.id,
        message: body.message,
        attachments: body.attachments,
      }),
    );
  }

  @Patch('support/tickets/:id')
  @UseGuards(SessionAuthGuard)
  async updateTicket(
    @Param('id') id: string,
    @Body() body: UpdateSupportTicketDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Support ticket updated successfully.',
      await this.supportDatabase.updateTicket(id, user.id, body),
    );
  }
}
