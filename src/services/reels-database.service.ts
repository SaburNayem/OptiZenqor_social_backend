import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { CreateReelDto, UpdateReelDto } from '../dto/api.dto';
import { makeId } from '../common/id.util';
import { CoreDatabaseService } from './core-database.service';
import { DatabaseService } from './database.service';

type ReelRow = QueryResultRow & {
  id: string;
  user_id: string;
  caption: string;
  audio_name: string;
  thumbnail_url: string;
  video_url: string;
  text_overlays: unknown;
  subtitle_enabled: boolean;
  trim_info: string | null;
  remix_enabled: boolean;
  is_draft: boolean;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string | Date;
  updated_at: string | Date;
};

type ReelCommentRow = QueryResultRow & {
  id: string;
  reel_id: string;
  user_id: string;
  comment: string;
  created_at: string | Date;
};

type ReelReactionRow = QueryResultRow & {
  reel_id: string;
  user_id: string;
  reaction: string;
  created_at: string | Date;
};

@Injectable()
export class ReelsDatabaseService implements OnModuleInit {
  private schemaEnsured = false;

  constructor(
    private readonly database: DatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  async onModuleInit() {
    await this.ensureSchema();
  }

  async getReels(userId?: string) {
    await this.ensureSchema();
    const result = userId?.trim()
      ? await this.database.query<ReelRow>(
          `select * from app_reels where user_id = $1 order by created_at desc`,
          [userId.trim()],
        )
      : await this.database.query<ReelRow>(
          `select * from app_reels order by created_at desc`,
        );
    return Promise.all(result.rows.map((row) => this.mapReel(row)));
  }

  async getReel(id: string) {
    await this.ensureSchema();
    const result = await this.database.query<ReelRow>(
      `select * from app_reels where id = $1 limit 1`,
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Reel ${id} not found`);
    }
    return this.mapReel(row);
  }

  async createReel(userId: string, dto: CreateReelDto) {
    await this.ensureSchema();
    const result = await this.database.query<ReelRow>(
      `
      insert into app_reels (
        id, user_id, caption, audio_name, thumbnail_url, video_url, text_overlays,
        subtitle_enabled, trim_info, remix_enabled, is_draft
      ) values (
        $1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11
      )
      returning *
      `,
      [
        makeId('reel'),
        userId,
        dto.caption,
        dto.audioName,
        dto.thumbnail,
        dto.videoUrl,
        JSON.stringify(dto.textOverlays ?? []),
        dto.subtitleEnabled ?? false,
        dto.trimInfo ?? null,
        dto.remixEnabled ?? false,
        dto.isDraft ?? false,
      ],
    );
    return this.mapReel(result.rows[0]);
  }

  async updateReel(id: string, patch: UpdateReelDto) {
    await this.ensureSchema();
    await this.getReel(id);
    const result = await this.database.query<ReelRow>(
      `
      update app_reels
      set caption = coalesce($2, caption),
          audio_name = coalesce($3, audio_name),
          thumbnail_url = coalesce($4, thumbnail_url),
          video_url = coalesce($5, video_url),
          text_overlays = coalesce($6::jsonb, text_overlays),
          subtitle_enabled = coalesce($7, subtitle_enabled),
          trim_info = coalesce($8, trim_info),
          remix_enabled = coalesce($9, remix_enabled),
          is_draft = coalesce($10, is_draft),
          updated_at = now()
      where id = $1
      returning *
      `,
      [
        id,
        patch.caption ?? null,
        patch.audioName ?? null,
        patch.thumbnail ?? null,
        patch.videoUrl ?? null,
        patch.textOverlays ? JSON.stringify(patch.textOverlays) : null,
        patch.subtitleEnabled ?? null,
        patch.trimInfo ?? null,
        patch.remixEnabled ?? null,
        patch.isDraft ?? null,
      ],
    );
    return this.mapReel(result.rows[0]);
  }

  async deleteReel(id: string) {
    await this.ensureSchema();
    const result = await this.database.query<ReelRow>(
      `delete from app_reels where id = $1 returning *`,
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Reel ${id} not found`);
    }
    return {
      success: true,
      message: 'Reel deleted successfully.',
      data: await this.mapReel(row),
      removed: await this.mapReel(row),
    };
  }

  async getReelComments(reelId: string) {
    await this.ensureSchema();
    await this.getReel(reelId);
    const result = await this.database.query<ReelCommentRow>(
      `select * from app_reel_comments where reel_id = $1 order by created_at asc`,
      [reelId],
    );
    return Promise.all(
      result.rows.map(async (row) => ({
        id: row.id,
        reelId: row.reel_id,
        userId: row.user_id,
        comment: row.comment,
        createdAt: this.iso(row.created_at),
        user: await this.coreDatabase.getUser(row.user_id),
      })),
    );
  }

  async createReelComment(reelId: string, userId: string, comment: string) {
    await this.ensureSchema();
    await Promise.all([this.getReel(reelId), this.coreDatabase.getUser(userId)]);
    const result = await this.database.query<ReelCommentRow>(
      `
      insert into app_reel_comments (id, reel_id, user_id, comment)
      values ($1,$2,$3,$4)
      returning *
      `,
      [makeId('comment'), reelId, userId, comment],
    );
    await this.database.query(
      `update app_reels set comments_count = comments_count + 1, updated_at = now() where id = $1`,
      [reelId],
    );
    return (await this.getReelComments(reelId)).find((item) => item.id === result.rows[0].id);
  }

  async getReelReactions(reelId: string) {
    await this.ensureSchema();
    await this.getReel(reelId);
    const result = await this.database.query<ReelReactionRow>(
      `select * from app_reel_reactions where reel_id = $1 order by created_at desc`,
      [reelId],
    );
    return Promise.all(
      result.rows.map(async (row) => ({
        reelId: row.reel_id,
        userId: row.user_id,
        reaction: row.reaction,
        createdAt: this.iso(row.created_at),
        user: await this.coreDatabase.getUser(row.user_id),
      })),
    );
  }

  async reactToReel(reelId: string, userId: string, reaction: string) {
    await this.ensureSchema();
    await Promise.all([this.getReel(reelId), this.coreDatabase.getUser(userId)]);
    const existing = await this.database.query<ReelReactionRow>(
      `select * from app_reel_reactions where reel_id = $1 and user_id = $2 limit 1`,
      [reelId, userId],
    );
    const hadReaction = Boolean(existing.rows[0]);
    await this.database.query(
      `
      insert into app_reel_reactions (reel_id, user_id, reaction, created_at)
      values ($1,$2,$3,now())
      on conflict (reel_id, user_id)
      do update set reaction = excluded.reaction, created_at = excluded.created_at
      `,
      [reelId, userId, reaction],
    );
    if (!hadReaction) {
      await this.database.query(
        `update app_reels set likes_count = likes_count + 1, updated_at = now() where id = $1`,
        [reelId],
      );
    }
    return this.getReelReactions(reelId);
  }

  private async ensureSchema() {
    if (this.schemaEnsured || !this.database.getHealth().enabled) {
      return;
    }
    await this.database.query(`
      create table if not exists app_reels (
        id text primary key,
        user_id text not null references app_users(id) on delete cascade,
        caption text not null default '',
        audio_name text not null default '',
        thumbnail_url text not null default '',
        video_url text not null default '',
        text_overlays jsonb not null default '[]'::jsonb,
        subtitle_enabled boolean not null default false,
        trim_info text null,
        remix_enabled boolean not null default false,
        is_draft boolean not null default false,
        likes_count integer not null default 0,
        comments_count integer not null default 0,
        shares_count integer not null default 0,
        views_count integer not null default 0,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        constraint app_reels_id_format check (id ~ '^reel_[a-zA-Z0-9]+$')
      );
    `);
    await this.database.query(`
      create table if not exists app_reel_comments (
        id text primary key,
        reel_id text not null references app_reels(id) on delete cascade,
        user_id text not null references app_users(id) on delete cascade,
        comment text not null,
        created_at timestamptz not null default now(),
        constraint app_reel_comments_id_format check (id ~ '^comment_[a-zA-Z0-9]+$')
      );
    `);
    await this.database.query(`
      create table if not exists app_reel_reactions (
        reel_id text not null references app_reels(id) on delete cascade,
        user_id text not null references app_users(id) on delete cascade,
        reaction text not null,
        created_at timestamptz not null default now(),
        primary key (reel_id, user_id)
      );
    `);
    this.schemaEnsured = true;
  }

  private async mapReel(row: ReelRow) {
    return {
      id: row.id,
      authorId: row.user_id,
      caption: row.caption,
      audioName: row.audio_name,
      thumbnail: row.thumbnail_url,
      videoUrl: row.video_url,
      likes: row.likes_count ?? 0,
      comments: row.comments_count ?? 0,
      shares: row.shares_count ?? 0,
      viewCount: row.views_count ?? 0,
      textOverlays: Array.isArray(row.text_overlays) ? row.text_overlays : [],
      subtitleEnabled: row.subtitle_enabled,
      trimInfo: row.trim_info,
      remixEnabled: row.remix_enabled,
      isDraft: row.is_draft,
      createdAt: this.iso(row.created_at),
      updatedAt: this.iso(row.updated_at),
      author: await this.coreDatabase.getUser(row.user_id),
    };
  }

  private iso(value: string | Date) {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
