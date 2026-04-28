import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { QueryResultRow } from 'pg';
import { CreateStoryDto, UpdateStoryDto } from '../dto/api.dto';
import { makeId } from '../common/id.util';
import { CoreDatabaseService } from './core-database.service';
import { DatabaseService } from './database.service';

type StoryRow = QueryResultRow & {
  id: string;
  user_id: string;
  media: string;
  media_items: unknown;
  is_local_file: boolean;
  text: string;
  music: string | null;
  background_colors: unknown;
  text_color_value: string | number;
  sticker: string | null;
  effect_name: string | null;
  mention_username: string | null;
  mention_usernames: unknown;
  link_label: string | null;
  link_url: string | null;
  privacy: string;
  location: string | null;
  collage_layout: string | null;
  text_offset_dx: string | number;
  text_offset_dy: string | number;
  text_scale: string | number;
  media_transforms: unknown;
  seen: boolean;
  created_at: Date | string;
  updated_at: Date | string;
  expires_at: Date | string;
};

type StoryCommentRow = QueryResultRow & {
  id: string;
  story_id: string;
  user_id: string;
  comment: string;
  created_at: string | Date;
};

type StoryReactionRow = QueryResultRow & {
  story_id: string;
  user_id: string;
  reaction: string;
  created_at: string | Date;
};

type StoryViewRow = QueryResultRow & {
  story_id: string;
  user_id: string;
  viewed_at: string | Date;
};

@Injectable()
export class StoriesDatabaseService implements OnModuleInit {
  private schemaEnsured = false;

  constructor(
    private readonly database: DatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  async onModuleInit() {
    await this.ensureSchema();
  }

  async getActiveStories(userId?: string) {
    await this.ensureSchema();
    const normalizedUserId = userId?.trim();
    const result = normalizedUserId
      ? await this.database.query<StoryRow>(
          `
          select *
          from app_stories
          where expires_at > now()
            and user_id = $1
          order by created_at desc
          `,
          [normalizedUserId],
        )
      : await this.database.query<StoryRow>(
          `
          select *
          from app_stories
          where expires_at > now()
          order by created_at desc
          `,
        );

    return result.rows.map((row) => this.mapStory(row));
  }

  async getStory(id: string) {
    await this.ensureSchema();
    const result = await this.database.query<StoryRow>(
      `
      select *
      from app_stories
      where id = $1
        and expires_at > now()
      limit 1
      `,
      [id],
    );
    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException(`Story ${id} not found`);
    }
    return this.mapStory(row);
  }

  async createStory(userId: string, dto: CreateStoryDto) {
    await this.ensureSchema();
    const normalizedUserId = userId?.trim();
    if (!normalizedUserId) {
      throw new BadRequestException('userId is required.');
    }

    const mediaItems = this.normalizeMediaItems(dto.media, dto.mediaItems);
    const mentionUsernames = this.normalizeMentions(
      dto.mentionUsernames,
      dto.mentionUsername,
    );
    const result = await this.database.query<StoryRow>(
      `
      insert into app_stories (
        id,
        user_id,
        media,
        media_items,
        is_local_file,
        text,
        music,
        background_colors,
        text_color_value,
        sticker,
        effect_name,
        mention_username,
        mention_usernames,
        link_label,
        link_url,
        privacy,
        location,
        collage_layout,
        text_offset_dx,
        text_offset_dy,
        text_scale,
        media_transforms,
        seen,
        expires_at
      )
      values (
        $1,$2,$3,$4::jsonb,$5,
        $6,$7,$8::jsonb,$9,
        $10,$11,$12,$13::jsonb,
        $14,$15,$16,$17,$18,
        $19,$20,$21,$22::jsonb,
        false,
        now() + interval '24 hours'
      )
      returning *
      `,
      [
        makeId('story'),
        normalizedUserId,
        dto.media?.trim() || mediaItems[0] || '',
        JSON.stringify(mediaItems),
        dto.isLocalFile ?? false,
        dto.text?.trim() ?? '',
        dto.music?.trim() || null,
        JSON.stringify(dto.backgroundColors ?? []),
        dto.textColorValue ?? 4294967295,
        dto.sticker?.trim() || null,
        dto.effectName?.trim() || null,
        mentionUsernames[0] ?? dto.mentionUsername?.trim() ?? null,
        JSON.stringify(mentionUsernames),
        dto.linkLabel?.trim() || null,
        dto.linkUrl?.trim() || null,
        this.normalizePrivacy(dto.privacy),
        dto.location?.trim() || null,
        dto.collageLayout?.trim() || null,
        dto.textOffsetDx ?? 0,
        dto.textOffsetDy ?? 0,
        dto.textScale ?? 1,
        JSON.stringify(dto.mediaTransforms ?? []),
      ],
    );

    return this.mapStory(result.rows[0]);
  }

  async updateStory(id: string, patch: UpdateStoryDto) {
    await this.ensureSchema();
    const existing = await this.getStory(id);
    const mediaItems = this.normalizeMediaItems(
      patch.media ?? existing.media,
      patch.mediaItems ?? existing.mediaItems,
    );
    const mentionUsernames = this.normalizeMentions(
      patch.mentionUsernames ?? existing.mentionUsernames,
      patch.mentionUsername ?? existing.mentionUsername ?? undefined,
    );

    const result = await this.database.query<StoryRow>(
      `
      update app_stories
      set media = $2,
          media_items = $3::jsonb,
          is_local_file = $4,
          text = $5,
          music = $6,
          background_colors = $7::jsonb,
          text_color_value = $8,
          sticker = $9,
          effect_name = $10,
          mention_username = $11,
          mention_usernames = $12::jsonb,
          link_label = $13,
          link_url = $14,
          privacy = $15,
          location = $16,
          collage_layout = $17,
          text_offset_dx = $18,
          text_offset_dy = $19,
          text_scale = $20,
          media_transforms = $21::jsonb,
          seen = $22,
          updated_at = now()
      where id = $1
      returning *
      `,
      [
        id,
        (patch.media ?? existing.media)?.trim() || mediaItems[0] || '',
        JSON.stringify(mediaItems),
        patch.isLocalFile ?? existing.isLocalFile ?? false,
        patch.text?.trim() ?? existing.text ?? '',
        patch.music?.trim() ?? existing.music ?? null,
        JSON.stringify(patch.backgroundColors ?? existing.backgroundColors ?? []),
        patch.textColorValue ?? existing.textColorValue ?? 4294967295,
        patch.sticker?.trim() ?? existing.sticker ?? null,
        patch.effectName?.trim() ?? existing.effectName ?? null,
        mentionUsernames[0] ?? null,
        JSON.stringify(mentionUsernames),
        patch.linkLabel?.trim() ?? existing.linkLabel ?? null,
        patch.linkUrl?.trim() ?? existing.linkUrl ?? null,
        this.normalizePrivacy(patch.privacy ?? existing.privacy),
        patch.location?.trim() ?? existing.location ?? null,
        patch.collageLayout?.trim() ?? existing.collageLayout ?? null,
        patch.textOffsetDx ?? existing.textOffsetDx ?? 0,
        patch.textOffsetDy ?? existing.textOffsetDy ?? 0,
        patch.textScale ?? existing.textScale ?? 1,
        JSON.stringify(patch.mediaTransforms ?? existing.mediaTransforms ?? []),
        patch.seen ?? existing.seen ?? false,
      ],
    );

    return this.mapStory(result.rows[0]);
  }

  async deleteStory(storyId: string, userId?: string) {
    await this.ensureSchema();
    const normalizedUserId = userId?.trim();
    const result = normalizedUserId
      ? await this.database.query<StoryRow>(
          `delete from app_stories where id = $1 and user_id = $2 returning *`,
          [storyId, normalizedUserId],
        )
      : await this.database.query<StoryRow>(
          `delete from app_stories where id = $1 returning *`,
          [storyId],
        );

    const row = result.rows[0];
    if (!row) {
      throw new NotFoundException('Story not found.');
    }

    return {
      success: true,
      message: 'Story deleted successfully.',
      data: this.mapStory(row),
      removed: this.mapStory(row),
    };
  }

  async getStoryComments(storyId: string) {
    await this.ensureSchema();
    await this.getStory(storyId);
    const result = await this.database.query<StoryCommentRow>(
      `select * from app_story_comments where story_id = $1 order by created_at asc`,
      [storyId],
    );
    return Promise.all(
      result.rows.map(async (row) => ({
        id: row.id,
        storyId: row.story_id,
        userId: row.user_id,
        comment: row.comment,
        createdAt: this.iso(row.created_at),
        author: await this.coreDatabase.getUser(row.user_id),
      })),
    );
  }

  async createStoryComment(storyId: string, userId: string, comment: string) {
    await this.ensureSchema();
    await Promise.all([this.getStory(storyId), this.coreDatabase.getUser(userId)]);
    const result = await this.database.query<StoryCommentRow>(
      `insert into app_story_comments (id, story_id, user_id, comment)
       values ($1,$2,$3,$4)
       returning *`,
      [makeId('comment'), storyId, userId, comment],
    );
    return (await this.getStoryComments(storyId)).find((item) => item.id === result.rows[0].id);
  }

  async getStoryReactions(storyId: string) {
    await this.ensureSchema();
    await this.getStory(storyId);
    const result = await this.database.query<StoryReactionRow>(
      `select * from app_story_reactions where story_id = $1 order by created_at desc`,
      [storyId],
    );
    return Promise.all(
      result.rows.map(async (row) => ({
        storyId: row.story_id,
        userId: row.user_id,
        reaction: row.reaction,
        createdAt: this.iso(row.created_at),
        user: await this.coreDatabase.getUser(row.user_id),
      })),
    );
  }

  async reactToStory(storyId: string, userId: string, reaction: string) {
    await this.ensureSchema();
    await Promise.all([this.getStory(storyId), this.coreDatabase.getUser(userId)]);
    await this.database.query(
      `
      insert into app_story_reactions (story_id, user_id, reaction, created_at)
      values ($1,$2,$3,now())
      on conflict (story_id, user_id)
      do update set reaction = excluded.reaction, created_at = excluded.created_at
      `,
      [storyId, userId, reaction],
    );
    return this.getStoryReactions(storyId);
  }

  async getStoryViewers(storyId: string) {
    await this.ensureSchema();
    await this.getStory(storyId);
    const result = await this.database.query<StoryViewRow>(
      `select * from app_story_views where story_id = $1 order by viewed_at desc`,
      [storyId],
    );
    return Promise.all(
      result.rows.map(async (row) => {
        const user = await this.coreDatabase.getUser(row.user_id);
        return {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          avatarUrl: user.avatar,
          viewedAt: this.iso(row.viewed_at),
        };
      }),
    );
  }

  async recordStoryView(storyId: string, userId: string) {
    await this.ensureSchema();
    await Promise.all([this.getStory(storyId), this.coreDatabase.getUser(userId)]);
    await this.database.query(
      `
      insert into app_story_views (story_id, user_id, viewed_at)
      values ($1,$2,now())
      on conflict (story_id, user_id)
      do update set viewed_at = excluded.viewed_at
      `,
      [storyId, userId],
    );
    const viewers = await this.getStoryViewers(storyId);
    return {
      success: true,
      storyId,
      userId,
      viewerCount: viewers.length,
      viewedAt: viewers.find((item) => item.id === userId)?.viewedAt ?? new Date().toISOString(),
    };
  }

  private async ensureSchema() {
    if (this.schemaEnsured || !this.database.getHealth().enabled) {
      return;
    }

    if (!this.database.getHealth().enabled) {
      return;
    }

    await this.database.query(`
      create table if not exists app_stories (
        id text primary key,
        user_id text not null,
        media text not null default '',
        media_items jsonb not null default '[]'::jsonb,
        is_local_file boolean not null default false,
        text text not null default '',
        music text,
        background_colors jsonb not null default '[]'::jsonb,
        text_color_value bigint not null default 4294967295,
        sticker text,
        effect_name text,
        mention_username text,
        mention_usernames jsonb not null default '[]'::jsonb,
        link_label text,
        link_url text,
        privacy text not null default 'public',
        location text,
        collage_layout text,
        text_offset_dx double precision not null default 0,
        text_offset_dy double precision not null default 0,
        text_scale double precision not null default 1,
        media_transforms jsonb not null default '[]'::jsonb,
        seen boolean not null default false,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        expires_at timestamptz not null default now() + interval '24 hours',
        constraint app_stories_id_format check (id ~ '^story_[a-zA-Z0-9]+$'),
        constraint app_stories_privacy_check check (privacy in ('public', 'followers', 'private'))
      );
    `);
    await this.database.query(`
      create table if not exists app_story_views (
        story_id text not null references app_stories(id) on delete cascade,
        user_id text not null references app_users(id) on delete cascade,
        viewed_at timestamptz not null default now(),
        primary key (story_id, user_id)
      );
    `);
    await this.database.query(`
      create table if not exists app_story_reactions (
        story_id text not null references app_stories(id) on delete cascade,
        user_id text not null references app_users(id) on delete cascade,
        reaction text not null,
        created_at timestamptz not null default now(),
        primary key (story_id, user_id)
      );
    `);
    await this.database.query(`
      create table if not exists app_story_comments (
        id text primary key,
        story_id text not null references app_stories(id) on delete cascade,
        user_id text not null references app_users(id) on delete cascade,
        comment text not null,
        created_at timestamptz not null default now(),
        constraint app_story_comments_id_format check (id ~ '^comment_[a-zA-Z0-9]+$')
      );
    `);
    await this.database.query(`
      create index if not exists app_stories_user_id_created_at_idx
      on app_stories (user_id, created_at desc);
    `);
    await this.database.query(`
      create index if not exists app_stories_expires_at_idx
      on app_stories (expires_at);
    `);
    this.schemaEnsured = true;
  }

  private mapStory(row: StoryRow) {
    return {
      id: row.id,
      userId: row.user_id,
      media: row.media,
      mediaItems: this.toStringArray(row.media_items),
      isLocalFile: row.is_local_file,
      text: row.text ?? '',
      music: row.music,
      backgroundColors: this.toNumberArray(row.background_colors),
      textColorValue: Number(row.text_color_value ?? 4294967295),
      sticker: row.sticker,
      effectName: row.effect_name,
      mentionUsername: row.mention_username,
      mentionUsernames: this.toStringArray(row.mention_usernames),
      linkLabel: row.link_label,
      linkUrl: row.link_url,
      privacy: row.privacy ?? 'public',
      location: row.location,
      collageLayout: row.collage_layout,
      textOffsetDx: Number(row.text_offset_dx ?? 0),
      textOffsetDy: Number(row.text_offset_dy ?? 0),
      textScale: Number(row.text_scale ?? 1),
      mediaTransforms: this.toObjectArray(row.media_transforms),
      seen: row.seen ?? false,
      createdAt: this.iso(row.created_at),
      updatedAt: this.iso(row.updated_at),
      expiresAt: this.iso(row.expires_at),
    };
  }

  private normalizeMediaItems(media?: string, mediaItems?: string[]) {
    const normalizedItems = (mediaItems ?? [])
      .map((item) => item?.trim())
      .filter((item): item is string => Boolean(item));
    const normalizedMedia = media?.trim();
    if (normalizedItems.length > 0) {
      return normalizedItems;
    }
    return normalizedMedia ? [normalizedMedia] : [];
  }

  private normalizeMentions(mentionUsernames?: string[], mentionUsername?: string) {
    return [...new Set([...(mentionUsernames ?? []), mentionUsername ?? ''])]
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private normalizePrivacy(privacy?: string) {
    switch ((privacy ?? '').trim().toLowerCase()) {
      case 'followers':
        return 'followers';
      case 'private':
      case 'only me':
      case 'only_me':
        return 'private';
      case 'public':
      case 'everyone':
      default:
        return 'public';
    }
  }

  private toStringArray(value: unknown) {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
  }

  private toNumberArray(value: unknown) {
    return Array.isArray(value)
      ? value
          .map((item) => Number(item))
          .filter((item) => Number.isFinite(item))
      : [];
  }

  private toObjectArray(value: unknown) {
    return Array.isArray(value)
      ? value.filter((item) => item && typeof item === 'object')
      : [];
  }

  private iso(value: string | Date) {
    return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
  }
}
