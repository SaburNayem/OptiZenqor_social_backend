import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateStoryDto, UpdateStoryDto } from '../dto/api.dto';
import { makeId } from '../common/id.util';
import { CoreDatabaseService } from './core-database.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class StoriesDatabaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  async getActiveStories(userId?: string) {
    const stories = await this.prisma.story.findMany({
      where: {
        userId: userId?.trim() || undefined,
        expiresAt: { gt: new Date() },
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });

    return stories.map((row) => this.mapStory(row));
  }

  async getStory(id: string) {
    const story = await this.prisma.story.findFirst({
      where: {
        id,
        expiresAt: { gt: new Date() },
        deletedAt: null,
      },
    });
    if (!story) {
      throw new NotFoundException(`Story ${id} not found`);
    }
    return this.mapStory(story);
  }

  async createStory(userId: string, dto: CreateStoryDto) {
    const normalizedUserId = userId?.trim();
    if (!normalizedUserId) {
      throw new BadRequestException('userId is required.');
    }

    const mediaItems = this.normalizeMediaItems(dto.media, dto.mediaItems);
    const mentionUsernames = this.normalizeMentions(
      dto.mentionUsernames,
      dto.mentionUsername,
    );

    const story = await this.prisma.story.create({
      data: {
        id: makeId('story'),
        userId: normalizedUserId,
        media: dto.media?.trim() || mediaItems[0] || '',
        mediaItems: mediaItems as Prisma.InputJsonValue,
        isLocalFile: dto.isLocalFile ?? false,
        text: dto.text?.trim() ?? '',
        music: dto.music?.trim() || null,
        backgroundColors: (dto.backgroundColors ?? []) as Prisma.InputJsonValue,
        textColorValue: BigInt(Math.trunc(dto.textColorValue ?? 4294967295)),
        sticker: dto.sticker?.trim() || null,
        effectName: dto.effectName?.trim() || null,
        mentionUsername: mentionUsernames[0] ?? dto.mentionUsername?.trim() ?? null,
        mentionUsernames: mentionUsernames as Prisma.InputJsonValue,
        linkLabel: dto.linkLabel?.trim() || null,
        linkUrl: dto.linkUrl?.trim() || null,
        privacy: this.normalizePrivacy(dto.privacy),
        location: dto.location?.trim() || null,
        collageLayout: dto.collageLayout?.trim() || null,
        textOffsetDx: dto.textOffsetDx ?? 0,
        textOffsetDy: dto.textOffsetDy ?? 0,
        textScale: dto.textScale ?? 1,
        mediaTransforms: (dto.mediaTransforms ?? []) as unknown as Prisma.InputJsonValue,
        seen: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    return this.mapStory(story);
  }

  async updateStory(id: string, patch: UpdateStoryDto) {
    const existing = await this.prisma.story.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Story ${id} not found`);
    }

    const current = this.mapStory(existing);
    const mediaItems = this.normalizeMediaItems(
      patch.media ?? current.media,
      patch.mediaItems ?? current.mediaItems,
    );
    const mentionUsernames = this.normalizeMentions(
      patch.mentionUsernames ?? current.mentionUsernames,
      patch.mentionUsername ?? current.mentionUsername ?? undefined,
    );

    const story = await this.prisma.story.update({
      where: { id },
      data: {
        media: (patch.media ?? current.media)?.trim() || mediaItems[0] || '',
        mediaItems: mediaItems as Prisma.InputJsonValue,
        isLocalFile: patch.isLocalFile ?? current.isLocalFile ?? false,
        text: patch.text?.trim() ?? current.text ?? '',
        music: patch.music?.trim() ?? current.music ?? null,
        backgroundColors: (patch.backgroundColors ?? current.backgroundColors ?? []) as Prisma.InputJsonValue,
        textColorValue: BigInt(
          Math.trunc(patch.textColorValue ?? current.textColorValue ?? 4294967295),
        ),
        sticker: patch.sticker?.trim() ?? current.sticker ?? null,
        effectName: patch.effectName?.trim() ?? current.effectName ?? null,
        mentionUsername: mentionUsernames[0] ?? null,
        mentionUsernames: mentionUsernames as Prisma.InputJsonValue,
        linkLabel: patch.linkLabel?.trim() ?? current.linkLabel ?? null,
        linkUrl: patch.linkUrl?.trim() ?? current.linkUrl ?? null,
        privacy: this.normalizePrivacy(patch.privacy ?? current.privacy),
        location: patch.location?.trim() ?? current.location ?? null,
        collageLayout: patch.collageLayout?.trim() ?? current.collageLayout ?? null,
        textOffsetDx: patch.textOffsetDx ?? current.textOffsetDx ?? 0,
        textOffsetDy: patch.textOffsetDy ?? current.textOffsetDy ?? 0,
        textScale: patch.textScale ?? current.textScale ?? 1,
        mediaTransforms: (patch.mediaTransforms ?? current.mediaTransforms ?? []) as unknown as Prisma.InputJsonValue,
        seen: patch.seen ?? current.seen ?? false,
        updatedAt: new Date(),
      },
    });

    return this.mapStory(story);
  }

  async deleteStory(storyId: string, userId?: string) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story.deletedAt || (userId?.trim() && story.userId !== userId.trim())) {
      throw new NotFoundException('Story not found.');
    }

    const updated = await this.prisma.story.update({
      where: { id: storyId },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const mapped = this.mapStory(updated);
    return {
      success: true,
      message: 'Story deleted successfully.',
      data: mapped,
      removed: mapped,
    };
  }

  async getStoryComments(storyId: string) {
    await this.getStory(storyId);
    const comments = await this.prisma.storyComment.findMany({
      where: { storyId },
      orderBy: { createdAt: 'asc' },
    });

    return Promise.all(
      comments.map(async (row) => ({
        id: row.id,
        storyId: row.storyId,
        userId: row.userId,
        comment: row.comment,
        createdAt: row.createdAt.toISOString(),
        author: await this.coreDatabase.getUser(row.userId),
      })),
    );
  }

  async createStoryComment(storyId: string, userId: string, comment: string) {
    await Promise.all([this.getStory(storyId), this.coreDatabase.getUser(userId)]);
    const created = await this.prisma.storyComment.create({
      data: {
        id: makeId('comment'),
        storyId,
        userId,
        comment,
      },
    });
    return (await this.getStoryComments(storyId)).find((item) => item.id === created.id);
  }

  async getStoryReactions(storyId: string) {
    await this.getStory(storyId);
    const reactions = await this.prisma.storyReaction.findMany({
      where: { storyId },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      reactions.map(async (row) => ({
        storyId: row.storyId,
        userId: row.userId,
        reaction: row.reaction,
        createdAt: row.createdAt.toISOString(),
        user: await this.coreDatabase.getUser(row.userId),
      })),
    );
  }

  async reactToStory(storyId: string, userId: string, reaction: string) {
    await Promise.all([this.getStory(storyId), this.coreDatabase.getUser(userId)]);
    await this.prisma.storyReaction.upsert({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
      create: {
        storyId,
        userId,
        reaction,
      },
      update: {
        reaction,
        createdAt: new Date(),
      },
    });
    return this.getStoryReactions(storyId);
  }

  async getStoryViewers(storyId: string) {
    await this.getStory(storyId);
    const viewers = await this.prisma.storyView.findMany({
      where: { storyId },
      orderBy: { viewedAt: 'desc' },
    });

    return Promise.all(
      viewers.map(async (row) => {
        const user = await this.coreDatabase.getUser(row.userId);
        return {
          id: user.id,
          name: user.name,
          username: user.username,
          avatar: user.avatar,
          avatarUrl: user.avatar,
          viewedAt: row.viewedAt.toISOString(),
        };
      }),
    );
  }

  async recordStoryView(storyId: string, userId: string) {
    await Promise.all([this.getStory(storyId), this.coreDatabase.getUser(userId)]);
    await this.prisma.storyView.upsert({
      where: {
        storyId_userId: {
          storyId,
          userId,
        },
      },
      create: {
        storyId,
        userId,
      },
      update: {
        viewedAt: new Date(),
      },
    });
    const viewers = await this.getStoryViewers(storyId);
    return {
      success: true,
      storyId,
      userId,
      viewerCount: viewers.length,
      viewedAt:
        viewers.find((item) => item.id === userId)?.viewedAt ?? new Date().toISOString(),
    };
  }

  private mapStory(row: {
    id: string;
    userId: string;
    media: string;
    mediaItems: Prisma.JsonValue;
    isLocalFile: boolean;
    text: string;
    music: string | null;
    backgroundColors: Prisma.JsonValue;
    textColorValue: bigint;
    sticker: string | null;
    effectName: string | null;
    mentionUsername: string | null;
    mentionUsernames: Prisma.JsonValue;
    linkLabel: string | null;
    linkUrl: string | null;
    privacy: string;
    location: string | null;
    collageLayout: string | null;
    textOffsetDx: number;
    textOffsetDy: number;
    textScale: number;
    mediaTransforms: Prisma.JsonValue;
    seen: boolean;
    createdAt: Date;
    updatedAt: Date;
    expiresAt: Date;
  }) {
    return {
      id: row.id,
      userId: row.userId,
      media: row.media,
      mediaItems: this.toStringArray(row.mediaItems),
      isLocalFile: row.isLocalFile,
      text: row.text ?? '',
      music: row.music,
      backgroundColors: this.toNumberArray(row.backgroundColors),
      textColorValue: Number(row.textColorValue ?? BigInt(4294967295)),
      sticker: row.sticker,
      effectName: row.effectName,
      mentionUsername: row.mentionUsername,
      mentionUsernames: this.toStringArray(row.mentionUsernames),
      linkLabel: row.linkLabel,
      linkUrl: row.linkUrl,
      privacy: row.privacy ?? 'public',
      location: row.location,
      collageLayout: row.collageLayout,
      textOffsetDx: row.textOffsetDx ?? 0,
      textOffsetDy: row.textOffsetDy ?? 0,
      textScale: row.textScale ?? 1,
      mediaTransforms: this.toObjectArray(row.mediaTransforms),
      seen: row.seen ?? false,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
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

  private toStringArray(value: Prisma.JsonValue) {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string')
      : [];
  }

  private toNumberArray(value: Prisma.JsonValue) {
    return Array.isArray(value)
      ? value.map((item) => Number(item)).filter((item) => Number.isFinite(item))
      : [];
  }

  private toObjectArray(value: Prisma.JsonValue) {
    return Array.isArray(value)
      ? value.filter((item) => !!item && typeof item === 'object')
      : [];
  }
}
