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
    const normalized = await this.readNormalizedSupportMail();
    if (normalized) {
      return normalized;
    }

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

  private async readNormalizedSupportMail() {
    const rows = await this.prisma.$queryRaw<
      Array<{
        key: string;
        value: Prisma.JsonValue;
        is_public: boolean;
      }>
    >`select key, value, is_public from app_support_config_entries where is_public = true`;

    if (rows.length === 0) {
      return null;
    }

    const readEntry = (key: string) => {
      const row = rows.find((item) => item.key === key);
      if (!row) {
        return null;
      }
      const value = row.value;
      if (typeof value === 'string' && value.trim().length > 0) {
        return value.trim();
      }
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        const nested = (value as Record<string, unknown>).value;
        return typeof nested === 'string' && nested.trim().length > 0 ? nested.trim() : null;
      }
      return null;
    };

    return {
      contactEmail: readEntry('support.contact_email'),
      escalationEmail: readEntry('support.escalation_email'),
      responseTime: readEntry('support.response_time'),
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
      ...this.mapTicketSummary(ticket),
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

  async getTicketDetail(id: string, userId?: string | null) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: {
        id,
        ...(userId?.trim() ? { userId: userId.trim() } : {}),
      },
      include: {
        user: true,
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
              include: { senderUser: true },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Support ticket ${id} not found.`);
    }

    const metadata = this.readMetadataObject(ticket.metadata);
    const messages =
      ticket.conversation?.messages.map((message) => ({
        id: message.id,
        senderType: message.senderType,
        senderUserId: message.senderUserId,
        senderLabel:
          message.senderType === 'agent'
            ? 'Support'
            : message.senderUser?.name?.trim() || 'You',
        text: message.body,
        body: message.body,
        attachments: this.readStringArray(message.attachments),
        createdAt: message.createdAt.toISOString(),
      })) ?? [];

    return {
      ...this.mapTicketSummary(ticket),
      conversationId: ticket.conversation?.id ?? null,
      conversationStatus: ticket.conversation?.status ?? null,
      channel: ticket.conversation?.channel ?? 'in_app',
      userLabel:
        ticket.user?.name?.trim() ||
        ticket.user?.username?.trim() ||
        ticket.user?.email?.trim() ||
        null,
      adminNotes: this.readStringArray(metadata.adminNotes),
      assignedAdminId:
        typeof metadata.assignedAdminId === 'string' ? metadata.assignedAdminId : null,
      slaHours: typeof metadata.slaHours === 'number' ? metadata.slaHours : null,
      slaDueAt: this.readMetadataString(ticket.metadata, 'slaDueAt') ?? null,
      messages,
    };
  }

  async createTicketMessage(input: {
    ticketId: string;
    userId: string;
    message: string;
    attachments?: string[];
  }) {
    const userId = input.userId.trim();
    const ticket = await this.prisma.supportTicket.findFirst({
      where: {
        id: input.ticketId.trim(),
        userId,
      },
      include: {
        conversation: true,
      },
    });
    if (!ticket) {
      throw new NotFoundException(`Support ticket ${input.ticketId} not found.`);
    }

    const conversation =
      ticket.conversation ??
      (await this.prisma.supportConversation.create({
        data: {
          id: makeId('support_conversation'),
          ticketId: ticket.id,
          userId,
          status: 'open',
          channel: 'in_app',
        },
      }));

    await this.prisma.$transaction(async (tx) => {
      await tx.supportMessage.create({
        data: {
          id: makeId('support_message'),
          conversationId: conversation.id,
          senderType: 'user',
          senderUserId: userId,
          body: input.message.trim(),
          attachments: input.attachments?.filter((item) => item.trim().length > 0) ?? [],
        },
      });
      await tx.supportTicket.update({
        where: { id: ticket.id },
        data: {
          status: ticket.status === 'closed' ? 'open' : ticket.status,
          updatedAt: new Date(),
          metadata: {
            ...this.readMetadataObject(ticket.metadata),
            latestMessage: input.message.trim(),
          } as Prisma.InputJsonValue,
        },
      });
      await tx.supportConversation.update({
        where: { id: conversation.id },
        data: {
          status: 'open',
          updatedAt: new Date(),
        },
      });
    });

    return this.getTicketDetail(ticket.id, userId);
  }

  async updateTicket(
    id: string,
    userId: string,
    patch: {
      subject?: string;
      category?: string;
      status?: string;
      priority?: string;
    },
  ) {
    const ticket = await this.prisma.supportTicket.findFirst({
      where: {
        id,
        userId: userId.trim(),
      },
      include: {
        conversation: true,
      },
    });
    if (!ticket) {
      throw new NotFoundException(`Support ticket ${id} not found.`);
    }

    const nextStatus = patch.status?.trim().toLowerCase();
    const updated = await this.prisma.$transaction(async (tx) => {
      const updatedTicket = await tx.supportTicket.update({
        where: { id: ticket.id },
        data: {
          subject: patch.subject?.trim() || undefined,
          category: patch.category?.trim() || undefined,
          priority: patch.priority?.trim().toLowerCase() || undefined,
          status: nextStatus || undefined,
          updatedAt: new Date(),
        },
      });

      if (ticket.conversation?.id && nextStatus) {
        await tx.supportConversation.update({
          where: { id: ticket.conversation.id },
          data: {
            status:
              nextStatus === 'resolved' || nextStatus === 'closed'
                ? 'closed'
                : nextStatus === 'reviewing'
                  ? 'reviewing'
                  : 'open',
            updatedAt: new Date(),
          },
        });
      }

      return updatedTicket;
    });

    return this.getTicketDetail(updated.id, userId);
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

  private readStringArray(value: unknown) {
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

  private mapTicketSummary(ticket: {
    id: string;
    userId: string | null;
    subject: string;
    category: string;
    status: string;
    priority: string;
    createdAt: Date;
    updatedAt: Date;
    metadata: Prisma.JsonValue;
    conversation?: {
      id: string;
      status: string;
      channel: string;
      messages?: Array<{ body: string }>;
    } | null;
  }) {
    return {
      id: ticket.id,
      userId: ticket.userId,
      subject: ticket.subject,
      category: ticket.category,
      status: ticket.status,
      priority: ticket.priority,
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      conversationId: ticket.conversation?.id ?? null,
      conversationStatus: ticket.conversation?.status ?? null,
      channel: ticket.conversation?.channel ?? 'in_app',
      latestMessage:
        ticket.conversation?.messages?.[0]?.body?.trim() ||
        this.readMetadataString(ticket.metadata, 'latestMessage'),
      metadata: this.readMetadataObject(ticket.metadata),
    };
  }
}
