import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { makeId } from '../common/id.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class SupportDatabaseService {
  constructor(private readonly prisma: PrismaService) {}

  async getFaqs() {
    const faqs = await this.prisma.supportFaq.findMany({
      where: { isPublished: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return faqs.map((faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      sortOrder: faq.sortOrder,
      createdAt: faq.createdAt.toISOString(),
      updatedAt: faq.updatedAt.toISOString(),
    }));
  }

  async getSupportMail() {
    const row = await this.prisma.adminOperationalSetting.findUnique({
      where: { key: 'support.contact' },
    });
    const config =
      row?.value && typeof row.value === 'object' && !Array.isArray(row.value)
        ? (row.value as Record<string, unknown>)
        : {};
    return {
      contactEmail: this.readString(config.contactEmail),
      escalationEmail: this.readString(config.escalationEmail),
      responseTime: this.readString(config.responseTime),
    };
  }

  async getSupportChat(userId?: string | null) {
    if (!userId?.trim()) {
      return this.emptyChat();
    }

    const conversation = await this.ensureConversationForUser(userId.trim());
    const record = await this.prisma.supportConversation.findUnique({
      where: { id: conversation.id },
      include: {
        ticket: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { senderUser: true },
        },
      },
    });

    if (!record) {
      return this.emptyChat();
    }

    return {
      threadId: record.id,
      conversationId: record.id,
      status: record.status,
      channel: record.channel,
      ticketId: record.ticketId,
      messages: record.messages.map((message) => ({
        id: message.id,
        sender:
          message.senderType === 'agent'
            ? 'Support'
            : message.senderUser?.name?.trim() || 'You',
        senderType: message.senderType,
        senderUserId: message.senderUserId,
        text: message.body,
        attachments: this.readStringArray(message.attachments),
        createdAt: message.createdAt.toISOString(),
      })),
    };
  }

  async createSupportMessage(input: {
    userId: string;
    message: string;
    attachments?: string[];
  }) {
    const userId = input.userId.trim();
    const conversation = await this.ensureConversationForUser(userId);
    await this.prisma.supportMessage.create({
      data: {
        id: makeId('support_message'),
        conversationId: conversation.id,
        senderType: 'user',
        senderUserId: userId,
        body: input.message.trim(),
        attachments: input.attachments?.filter((item) => item.trim().length > 0) ?? [],
      },
    });
    await this.touchConversation(conversation.id);
    return this.getSupportChat(userId);
  }

  async getTickets(userId?: string | null) {
    const tickets = await this.prisma.supportTicket.findMany({
      where: userId?.trim() ? { userId: userId.trim() } : undefined,
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    return tickets.map((ticket) => ({
      id: ticket.id,
      userId: ticket.userId,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      conversationId: ticket.conversation?.id ?? null,
      latestMessage:
        ticket.conversation?.messages[0]?.body?.trim() || this.readMetadataString(ticket.metadata, 'latestMessage'),
      metadata: this.readMetadataObject(ticket.metadata),
    }));
  }

  async createTicket(input: {
    subject: string;
    category: string;
    priority?: string | null;
    message?: string | null;
    userId?: string | null;
  }) {
    const subject = input.subject.trim();
    const category = input.category.trim();
    const userId = input.userId?.trim() || null;
    const priority = input.priority?.trim() || 'normal';
    const initialMessage = input.message?.trim() || '';

    const created = await this.prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          id: makeId('ticket'),
          userId,
          subject,
          category,
          priority,
          status: 'open',
          metadata: initialMessage ? { latestMessage: initialMessage } : {},
        },
      });

      const conversation = await tx.supportConversation.create({
        data: {
          id: makeId('support_conversation'),
          ticketId: ticket.id,
          userId,
          status: 'open',
          channel: 'in_app',
        },
      });

      if (initialMessage) {
        await tx.supportMessage.create({
          data: {
            id: makeId('support_message'),
            conversationId: conversation.id,
            senderType: userId ? 'user' : 'guest',
            senderUserId: userId,
            body: initialMessage,
            attachments: [],
          },
        });
      }

      return ticket;
    });

    const tickets = await this.getTickets(userId);
    const ticket = tickets.find((item) => item.id === created.id);
    if (!ticket) {
      throw new NotFoundException(`Support ticket ${created.id} not found after creation.`);
    }
    return ticket;
  }

  private async ensureConversationForUser(userId: string) {
    let conversation = await this.prisma.supportConversation.findFirst({
      where: { userId },
      orderBy: [{ updatedAt: 'desc' }, { createdAt: 'desc' }],
    });

    if (conversation) {
      return conversation;
    }

    return this.prisma.supportConversation.create({
      data: {
        id: makeId('support_conversation'),
        userId,
        status: 'open',
        channel: 'in_app',
      },
    });
  }

  private async touchConversation(conversationId: string) {
    await this.prisma.supportConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });
  }

  private emptyChat() {
    return {
      threadId: '',
      conversationId: '',
      status: 'open',
      channel: 'in_app',
      ticketId: null,
      messages: [] as Array<{
        id: string;
        sender: string;
        senderType: string;
        senderUserId: string | null;
        text: string;
        attachments: string[];
        createdAt: string;
      }>,
    };
  }

  private readStringArray(value: Prisma.JsonValue) {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
  }

  private readMetadataObject(value: Prisma.JsonValue) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private readMetadataString(value: Prisma.JsonValue, key: string) {
    const metadata = this.readMetadataObject(value);
    const item = metadata[key];
    return typeof item === 'string' && item.trim().length > 0 ? item : undefined;
  }

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }
}
