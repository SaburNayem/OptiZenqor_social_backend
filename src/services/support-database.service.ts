import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Injectable()
export class SupportDatabaseService implements OnModuleInit {
  constructor(private readonly database: DatabaseService) {}

  private readonly faqs = [
    {
      question: 'How do I reset my password?',
      answer:
        'Open forgot password, request an OTP, verify it, then save a new password.',
    },
    {
      question: 'How can I report abusive content?',
      answer:
        'Use the report action on posts, reels, comments, chats, or profiles.',
    },
  ];

  async onModuleInit() {
    if (!this.database.getHealth().enabled) {
      return;
    }

    await this.database.query(`
      create table if not exists support_tickets (
        id text primary key,
        user_id text null,
        subject text not null,
        category text not null,
        status text not null default 'open',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        metadata jsonb not null default '{}'::jsonb
      )
    `);
  }

  getFaqs() {
    return this.faqs;
  }

  getSupportMail() {
    return {
      contactEmail: process.env.SUPPORT_CONTACT_EMAIL?.trim() || 'support@optizenqor.app',
      escalationEmail: process.env.SUPPORT_ESCALATION_EMAIL?.trim() || 'trust@optizenqor.app',
      responseTime: process.env.SUPPORT_RESPONSE_TIME?.trim() || 'Usually within 24 hours',
    };
  }

  getSupportChat(userId?: string | null) {
    return {
      threadId: userId ? `support_${userId}` : '',
      messages: [] as Array<{ id: string; sender: string; text: string; createdAt: string }>,
    };
  }

  async getTickets(userId?: string | null) {
    const { rows } = userId?.trim()
      ? await this.database.query<{
          id: string;
          user_id: string | null;
          subject: string;
          category: string;
          status: string;
          created_at: Date | string;
          updated_at: Date | string;
        }>(
          `select id, user_id, subject, category, status, created_at, updated_at
           from support_tickets
           where user_id = $1
           order by created_at desc`,
          [userId.trim()],
        )
      : await this.database.query<{
          id: string;
          user_id: string | null;
          subject: string;
          category: string;
          status: string;
          created_at: Date | string;
          updated_at: Date | string;
        }>(
          `select id, user_id, subject, category, status, created_at, updated_at
           from support_tickets
           order by created_at desc`,
        );

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      subject: row.subject,
      category: row.category,
      status: row.status,
      createdAt: new Date(row.created_at).toISOString(),
      updatedAt: new Date(row.updated_at).toISOString(),
    }));
  }

  async createTicket(input: { subject: string; category: string; userId?: string | null }) {
    const id = `ticket_${Date.now()}`;
    await this.database.query(
      `insert into support_tickets (id, user_id, subject, category, status, created_at, updated_at)
       values ($1, $2, $3, $4, 'open', now(), now())`,
      [id, input.userId?.trim() || null, input.subject.trim(), input.category.trim()],
    );
    const tickets = await this.getTickets(input.userId ?? null);
    const created = tickets.find((ticket) => ticket.id === id);
    if (!created) {
      throw new NotFoundException(`Support ticket ${id} not found after creation.`);
    }
    return created;
  }
}
