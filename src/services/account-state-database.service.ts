import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { makeId } from '../common/id.util';
import { DatabaseService } from './database.service';
import { CoreDatabaseService } from './core-database.service';
import { ReelsDatabaseService } from './reels-database.service';
import { StoriesDatabaseService } from './stories-database.service';

type BookmarkRow = QueryResultRow & {
  id: string;
  user_id: string;
  entity_id: string;
  title: string | null;
  type: 'post' | 'reel' | 'product';
  metadata: Record<string, unknown> | null;
  created_at: string | Date;
};

type BlockRow = QueryResultRow & {
  actor_user_id: string;
  target_user_id: string;
  reason: string | null;
  created_at: string | Date;
};

type ReportRow = QueryResultRow & {
  id: string;
  reporter_user_id: string;
  target_user_id: string | null;
  target_entity_id: string | null;
  target_entity_type: string | null;
  reason: string;
  details: string | null;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
};

type SettingsRow = QueryResultRow & {
  user_id: string;
  settings: Record<string, unknown>;
  updated_at: string | Date;
};

type DraftRow = QueryResultRow & {
  id: string;
  user_id: string;
  title: string;
  type: string;
  payload: Record<string, unknown>;
  scheduled_at: string | Date | null;
  status: string;
  created_at: string | Date;
  updated_at: string | Date;
};

const DEFAULT_SETTINGS_STATE: Record<string, unknown> = {
  'privacy.profile_private': false,
  'privacy.activity_status': true,
  'privacy.allow_tagging': true,
  'privacy.allow_mentions': true,
  'privacy.allow_reposts': true,
  'privacy.allow_comments': true,
  'privacy.hide_sensitive': true,
  'privacy.hide_likes': false,
  'notifications.push_enabled': true,
  'notifications.email_enabled': true,
  'notifications.in_app_sounds': true,
  'notifications.marketing': false,
  'messages.message_requests': true,
  'messages.read_receipts': true,
  'messages.allow_calls': true,
  'messages.auto_download': true,
  'security.two_factor': false,
  'security.login_alerts': true,
  'feed.autoplay': true,
  'feed.data_saver': false,
  'creator.professional_dashboard': true,
  'creator.branded_content': true,
  'creator.tips': true,
};

@Injectable()
export class AccountStateDatabaseService implements OnModuleInit {
  private schemaEnsured = false;

  constructor(
    private readonly database: DatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly reelsDatabase: ReelsDatabaseService,
    private readonly storiesDatabase: StoriesDatabaseService,
  ) {}

  async onModuleInit() {
    await this.ensureSchema();
  }

  async getBookmarks(userId: string) {
    await this.ensureSchema();
    const result = await this.database.query<BookmarkRow>(
      `select * from app_bookmarks where user_id = $1 order by created_at desc`,
      [userId],
    );
    return result.rows.map((row) => this.mapBookmark(row));
  }

  async getBookmark(userId: string, entityId: string) {
    await this.ensureSchema();
    const result = await this.database.query<BookmarkRow>(
      `select * from app_bookmarks where user_id = $1 and entity_id = $2 limit 1`,
      [userId, entityId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Bookmark ${entityId} not found`);
    }
    return this.mapBookmark(row);
  }

  async addBookmark(
    userId: string,
    input: {
      entityId: string;
      title?: string;
      type?: 'post' | 'reel' | 'product';
      metadata?: Record<string, unknown>;
    },
  ) {
    await this.ensureSchema();
    const result = await this.database.query<BookmarkRow>(
      `
      insert into app_bookmarks (id, user_id, entity_id, title, type, metadata)
      values ($1,$2,$3,$4,$5,$6::jsonb)
      on conflict (user_id, entity_id)
      do update set
        title = excluded.title,
        type = excluded.type,
        metadata = excluded.metadata
      returning *
      `,
      [
        makeId('bookmark'),
        userId,
        input.entityId,
        input.title ?? null,
        input.type ?? 'post',
        JSON.stringify(input.metadata ?? {}),
      ],
    );
    return this.mapBookmark(result.rows[0]);
  }

  async removeBookmark(userId: string, entityId: string) {
    await this.ensureSchema();
    const result = await this.database.query<BookmarkRow>(
      `delete from app_bookmarks where user_id = $1 and entity_id = $2 returning *`,
      [userId, entityId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Bookmark ${entityId} not found`);
    }
    return {
      success: true,
      message: 'Bookmark removed successfully.',
      removed: this.mapBookmark(row),
    };
  }

  async getBlockedUsers(actorUserId: string) {
    await this.ensureSchema();
    const result = await this.database.query<BlockRow>(
      `select * from app_user_blocks where actor_user_id = $1 order by created_at desc`,
      [actorUserId],
    );
    return Promise.all(
      result.rows.map(async (row) => ({
        id: row.target_user_id,
        reason: row.reason,
        blockedAt: this.iso(row.created_at),
        user: await this.coreDatabase.getUser(row.target_user_id),
      })),
    );
  }

  async getBlockedUser(actorUserId: string, targetUserId: string) {
    const users = await this.getBlockedUsers(actorUserId);
    const item = users.find((entry) => entry.id === targetUserId);
    if (!item) {
      throw new NotFoundException(`Blocked user ${targetUserId} not found`);
    }
    return item;
  }

  async blockUser(actorUserId: string, targetUserId: string, reason?: string) {
    await this.ensureSchema();
    await Promise.all([
      this.coreDatabase.getUser(actorUserId),
      this.coreDatabase.getUser(targetUserId),
    ]);
    await this.database.query(
      `
      insert into app_user_blocks (actor_user_id, target_user_id, reason)
      values ($1,$2,$3)
      on conflict (actor_user_id, target_user_id)
      do update set reason = excluded.reason, created_at = now()
      `,
      [actorUserId, targetUserId, reason ?? null],
    );
    return {
      success: true,
      message: 'User blocked successfully.',
      data: await this.getBlockedUser(actorUserId, targetUserId),
    };
  }

  async unblockUser(actorUserId: string, targetUserId: string) {
    await this.ensureSchema();
    const result = await this.database.query<BlockRow>(
      `
      delete from app_user_blocks
      where actor_user_id = $1 and target_user_id = $2
      returning *
      `,
      [actorUserId, targetUserId],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Blocked user ${targetUserId} not found`);
    }
    return {
      success: true,
      message: 'User unblocked successfully.',
      removed: {
        actorUserId: row.actor_user_id,
        targetUserId: row.target_user_id,
        reason: row.reason,
      },
    };
  }

  async submitReport(input: {
    reporterUserId: string;
    reason: string;
    details?: string;
    targetUserId?: string;
    targetEntityId?: string;
    targetEntityType?: string;
  }) {
    await this.ensureSchema();
    const result = await this.database.query<ReportRow>(
      `
      insert into app_user_reports (
        id, reporter_user_id, target_user_id, target_entity_id, target_entity_type,
        reason, details, status
      ) values (
        $1,$2,$3,$4,$5,$6,$7,$8
      )
      returning *
      `,
      [
        makeId('report'),
        input.reporterUserId,
        input.targetUserId ?? null,
        input.targetEntityId ?? null,
        input.targetEntityType ?? null,
        input.reason,
        input.details ?? null,
        'submitted',
      ],
    );
    return this.mapReport(result.rows[0]);
  }

  async getReportCenter(userId: string) {
    await this.ensureSchema();
    const result = await this.database.query<ReportRow>(
      `select * from app_user_reports where reporter_user_id = $1 order by created_at desc`,
      [userId],
    );
    const reports = result.rows.map((row) => this.mapReport(row));
    return {
      success: true,
      summary: {
        total: reports.length,
        openReports: reports.filter((item) => item.status !== 'resolved').length,
        resolvedReports: reports.filter((item) => item.status === 'resolved').length,
      },
      reports,
      data: {
        reports,
      },
    };
  }

  async getSettingsState(userId: string) {
    await this.ensureSchema();
    const result = await this.database.query<SettingsRow>(
      `select * from app_user_settings where user_id = $1 limit 1`,
      [userId],
    );
    return {
      ...DEFAULT_SETTINGS_STATE,
      ...(result.rows[0]?.settings ?? {}),
    };
  }

  async updateSettingsState(userId: string, patch: Record<string, unknown>) {
    await this.ensureSchema();
    const current = await this.getSettingsState(userId);
    const next = {
      ...current,
      ...patch,
    };
    await this.database.query(
      `
      insert into app_user_settings (user_id, settings)
      values ($1,$2::jsonb)
      on conflict (user_id)
      do update set settings = excluded.settings, updated_at = now()
      `,
      [userId, JSON.stringify(next)],
    );
    return next;
  }

  async getPrivacySnapshot(userId: string) {
    const state = await this.getSettingsState(userId);
    return {
      profilePrivate: Boolean(state['privacy.profile_private']),
      activityStatus: Boolean(state['privacy.activity_status']),
      allowTagging: Boolean(state['privacy.allow_tagging']),
      allowMentions: Boolean(state['privacy.allow_mentions']),
      allowReposts: Boolean(state['privacy.allow_reposts']),
      allowComments: Boolean(state['privacy.allow_comments']),
      hideSensitive: Boolean(state['privacy.hide_sensitive']),
      hideLikes: Boolean(state['privacy.hide_likes']),
    };
  }

  async getDrafts(userId: string) {
    await this.ensureSchema();
    const result = await this.database.query<DraftRow>(
      `select * from app_post_drafts where user_id = $1 order by updated_at desc`,
      [userId],
    );
    return result.rows.map((row) => this.mapDraft(row));
  }

  async getDraft(userId: string, id: string) {
    await this.ensureSchema();
    const result = await this.database.query<DraftRow>(
      `select * from app_post_drafts where user_id = $1 and id = $2 limit 1`,
      [userId, id],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Draft ${id} not found`);
    }
    return this.mapDraft(row);
  }

  async createDraft(
    userId: string,
    input: {
      title: string;
      type: string;
      payload?: Record<string, unknown>;
      scheduledAt?: string | null;
    },
  ) {
    await this.ensureSchema();
    const result = await this.database.query<DraftRow>(
      `
      insert into app_post_drafts (id, user_id, title, type, payload, scheduled_at, status)
      values ($1,$2,$3,$4,$5::jsonb,$6,$7)
      returning *
      `,
      [
        makeId('draft'),
        userId,
        input.title,
        input.type,
        JSON.stringify(input.payload ?? {}),
        input.scheduledAt ?? null,
        input.scheduledAt ? 'scheduled' : 'draft',
      ],
    );
    return this.mapDraft(result.rows[0]);
  }

  async updateDraft(userId: string, id: string, patch: Record<string, unknown>) {
    await this.ensureSchema();
    const current = await this.getDraft(userId, id);
    const nextPayload =
      patch.payload && typeof patch.payload === 'object'
        ? (patch.payload as Record<string, unknown>)
        : current.payload;
    const nextScheduledAt =
      typeof patch.scheduledAt === 'string'
        ? patch.scheduledAt
        : patch.scheduledAt === null
          ? null
          : current.scheduledAt;
    const result = await this.database.query<DraftRow>(
      `
      update app_post_drafts
      set title = $3,
          type = $4,
          payload = $5::jsonb,
          scheduled_at = $6,
          status = $7,
          updated_at = now()
      where user_id = $1 and id = $2
      returning *
      `,
      [
        userId,
        id,
        typeof patch.title === 'string' ? patch.title : current.title,
        typeof patch.type === 'string' ? patch.type : current.type,
        JSON.stringify(nextPayload),
        nextScheduledAt,
        nextScheduledAt ? 'scheduled' : 'draft',
      ],
    );
    return this.mapDraft(result.rows[0]);
  }

  async deleteDraft(userId: string, id: string) {
    await this.ensureSchema();
    const result = await this.database.query<DraftRow>(
      `delete from app_post_drafts where user_id = $1 and id = $2 returning *`,
      [userId, id],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Draft ${id} not found`);
    }
    return {
      success: true,
      removed: this.mapDraft(row),
    };
  }

  async getScheduledDrafts(userId: string) {
    return (await this.getDrafts(userId)).filter((item) => Boolean(item.scheduledAt));
  }

  async getCreatorAnalytics(userId: string) {
    const [posts, reels, stories, bookmarks, drafts] = await Promise.all([
      this.coreDatabase.getPosts(userId),
      this.reelsDatabase.getReels(userId),
      this.storiesDatabase.getActiveStories(userId),
      this.getBookmarks(userId),
      this.getDrafts(userId),
    ]);

    const engagement = posts.reduce(
      (acc, item) => {
        acc.likes += item.likes;
        acc.comments += item.comments;
        acc.shares += item.shares;
        acc.views += item.views;
        return acc;
      },
      { likes: 0, comments: 0, shares: 0, views: 0 },
    );

    return {
      userId,
      totals: {
        posts: posts.length,
        reels: reels.length,
        stories: stories.length,
        bookmarks: bookmarks.length,
        drafts: drafts.length,
        scheduledDrafts: drafts.filter((item) => item.scheduledAt).length,
      },
      engagement,
      reelViews: reels.reduce((total, item) => total + (item.viewCount ?? 0), 0),
      recentDrafts: drafts.slice(0, 5),
    };
  }

  private async ensureSchema() {
    if (this.schemaEnsured || !this.database.getHealth().enabled) {
      return;
    }

    await this.database.query(`
      create table if not exists app_bookmarks (
        id text primary key,
        user_id text not null references app_users(id) on delete cascade,
        entity_id text not null,
        title text null,
        type text not null default 'post',
        metadata jsonb not null default '{}'::jsonb,
        created_at timestamptz not null default now(),
        unique (user_id, entity_id)
      );
    `);
    await this.database.query(`
      create table if not exists app_user_blocks (
        actor_user_id text not null references app_users(id) on delete cascade,
        target_user_id text not null references app_users(id) on delete cascade,
        reason text null,
        created_at timestamptz not null default now(),
        primary key (actor_user_id, target_user_id)
      );
    `);
    await this.database.query(`
      create table if not exists app_user_reports (
        id text primary key,
        reporter_user_id text not null references app_users(id) on delete cascade,
        target_user_id text null references app_users(id) on delete set null,
        target_entity_id text null,
        target_entity_type text null,
        reason text not null,
        details text null,
        status text not null default 'submitted',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `);
    await this.database.query(`
      create table if not exists app_user_settings (
        user_id text primary key references app_users(id) on delete cascade,
        settings jsonb not null default '{}'::jsonb,
        updated_at timestamptz not null default now()
      );
    `);
    await this.database.query(`
      create table if not exists app_post_drafts (
        id text primary key,
        user_id text not null references app_users(id) on delete cascade,
        title text not null,
        type text not null,
        payload jsonb not null default '{}'::jsonb,
        scheduled_at timestamptz null,
        status text not null default 'draft',
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now()
      );
    `);
    this.schemaEnsured = true;
  }

  private mapBookmark(row: BookmarkRow) {
    return {
      id: row.entity_id,
      bookmarkId: row.id,
      userId: row.user_id,
      title: row.title ?? row.entity_id,
      type: row.type,
      metadata: row.metadata ?? {},
      createdAt: this.iso(row.created_at),
    };
  }

  private mapReport(row: ReportRow) {
    return {
      id: row.id,
      reporterUserId: row.reporter_user_id,
      targetUserId: row.target_user_id,
      targetEntityId: row.target_entity_id,
      targetEntityType: row.target_entity_type,
      reason: row.reason,
      details: row.details,
      status: row.status,
      createdAt: this.iso(row.created_at),
      updatedAt: this.iso(row.updated_at),
    };
  }

  private mapDraft(row: DraftRow) {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      type: row.type,
      payload: row.payload ?? {},
      scheduledAt: row.scheduled_at ? this.iso(row.scheduled_at) : null,
      status: row.status,
      createdAt: this.iso(row.created_at),
      updatedAt: this.iso(row.updated_at),
    };
  }

  private iso(value: string | Date) {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
