import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { makeId } from '../common/id.util';
import { CoreDatabaseService } from './core-database.service';
import { PrismaService } from './prisma.service';
import { ReelsDatabaseService } from './reels-database.service';
import { StoriesDatabaseService } from './stories-database.service';

@Injectable()
export class AccountStateDatabaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly reelsDatabase: ReelsDatabaseService,
    private readonly storiesDatabase: StoriesDatabaseService,
  ) {}

  async getBookmarks(userId: string) {
    const bookmarks = await this.prisma.bookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return bookmarks.map((row) => this.mapBookmark(row));
  }

  async getCollections(userId: string) {
    const collections = await this.prisma.collection.findMany({
      where: { userId },
      include: {
        items: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return collections.map((row) => this.mapCollection(row));
  }

  async getCollection(userId: string, id: string) {
    const collection = await this.prisma.collection.findFirst({
      where: { id, userId },
      include: {
        items: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!collection) {
      throw new NotFoundException(`Collection ${id} not found`);
    }
    return this.mapCollection(collection);
  }

  async createCollection(
    userId: string,
    input: { name: string; privacy?: string; itemIds?: string[] },
  ) {
    const collection = await this.prisma.collection.create({
      data: {
        id: makeId('collection'),
        userId,
        title: input.name,
        visibility: this.normalizeCollectionVisibility(input.privacy),
      },
    });

    if (input.itemIds?.length) {
      await this.addItemsToCollection(userId, collection.id, input.itemIds);
    }

    return this.getCollection(userId, collection.id);
  }

  async syncCollections(
    userId: string,
    items: Array<{ id?: string; name: string; itemIds?: string[]; privacy?: string }>,
  ) {
    const existing = await this.prisma.collection.findMany({
      where: { userId },
      select: { id: true },
    });
    const keepIds = new Set(items.map((item) => item.id?.trim()).filter(Boolean));
    const removeIds = existing
      .map((item) => item.id)
      .filter((id) => !keepIds.has(id));

    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const id = item.id?.trim() || makeId('collection');
        await tx.collection.upsert({
          where: { id },
          create: {
            id,
            userId,
            title: item.name,
            visibility: this.normalizeCollectionVisibility(item.privacy),
          },
          update: {
            title: item.name,
            visibility: this.normalizeCollectionVisibility(item.privacy),
            updatedAt: new Date(),
          },
        });

        await tx.collectionItem.deleteMany({ where: { collectionId: id } });
        for (const entityId of [...new Set(item.itemIds ?? [])].filter(Boolean)) {
          await tx.collectionItem.create({
            data: this.buildCollectionItemCreateInput(id, entityId),
          });
        }
      }

      if (removeIds.length > 0) {
        await tx.collection.deleteMany({
          where: {
            userId,
            id: { in: removeIds },
          },
        });
      }
    });

    return this.getCollections(userId);
  }

  async addItemsToCollection(userId: string, collectionId: string, itemIds: string[]) {
    await this.getCollection(userId, collectionId);
    for (const entityId of [...new Set(itemIds)].filter(Boolean)) {
      await this.prisma.collectionItem.upsert({
        where: {
          collectionId_entityId: {
            collectionId,
            entityId,
          },
        },
        create: this.buildCollectionItemCreateInput(collectionId, entityId),
        update: {},
      });
    }
    await this.prisma.collection.update({
      where: { id: collectionId },
      data: { updatedAt: new Date() },
    });
    return this.getCollection(userId, collectionId);
  }

  async updateCollection(
    userId: string,
    id: string,
    patch: { name?: string; privacy?: string; itemId?: string; itemIds?: string[] },
  ) {
    await this.getCollection(userId, id);
    await this.prisma.collection.update({
      where: { id },
      data: {
        title: patch.name?.trim() || undefined,
        visibility: patch.privacy ? this.normalizeCollectionVisibility(patch.privacy) : undefined,
        updatedAt: new Date(),
      },
    });

    const itemIds = [
      ...(patch.itemIds ?? []),
      ...(patch.itemId?.trim() ? [patch.itemId.trim()] : []),
    ];
    if (itemIds.length > 0) {
      await this.addItemsToCollection(userId, id, itemIds);
    }

    return this.getCollection(userId, id);
  }

  async deleteCollection(userId: string, id: string) {
    const collection = await this.getCollection(userId, id);
    await this.prisma.collection.delete({
      where: { id },
    });
    return {
      success: true,
      removed: collection,
    };
  }

  async getBookmark(userId: string, entityId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_entityId: {
          userId,
          entityId,
        },
      },
    });
    if (!bookmark) {
      throw new NotFoundException(`Bookmark ${entityId} not found`);
    }
    return this.mapBookmark(bookmark);
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
    const data: Prisma.BookmarkUncheckedCreateInput = {
      id: makeId('bookmark'),
      userId,
      entityId: input.entityId,
      title: input.title ?? null,
      type: input.type ?? 'post',
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
    };

    if ((input.type ?? 'post') === 'post') {
      data.postId = input.entityId;
    } else if (input.type === 'reel') {
      data.reelId = input.entityId;
    } else if (input.type === 'product') {
      data.productId = input.entityId;
    }

    const bookmark = await this.prisma.bookmark.upsert({
      where: {
        userId_entityId: {
          userId,
          entityId: input.entityId,
        },
      },
      create: data,
      update: {
        title: input.title ?? null,
        type: input.type ?? 'post',
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
        postId: data.postId ?? null,
        reelId: data.reelId ?? null,
        productId: data.productId ?? null,
      },
    });

    return this.mapBookmark(bookmark);
  }

  async removeBookmark(userId: string, entityId: string) {
    const bookmark = await this.prisma.bookmark.findUnique({
      where: {
        userId_entityId: {
          userId,
          entityId,
        },
      },
    });
    if (!bookmark) {
      throw new NotFoundException(`Bookmark ${entityId} not found`);
    }

    await this.prisma.bookmark.delete({
      where: { id: bookmark.id },
    });

    return {
      success: true,
      message: 'Bookmark removed successfully.',
      removed: this.mapBookmark(bookmark),
    };
  }

  async getBlockedUsers(actorUserId: string) {
    const blocks = await this.prisma.userBlock.findMany({
      where: { actorUserId },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(
      blocks.map(async (row) => ({
        id: row.targetUserId,
        reason: row.reason,
        blockedAt: row.createdAt.toISOString(),
        user: await this.coreDatabase.getUser(row.targetUserId),
      })),
    );
  }

  async getBlockedUser(actorUserId: string, targetUserId: string) {
    const item = (await this.getBlockedUsers(actorUserId)).find(
      (entry) => entry.id === targetUserId,
    );
    if (!item) {
      throw new NotFoundException(`Blocked user ${targetUserId} not found`);
    }
    return item;
  }

  async blockUser(actorUserId: string, targetUserId: string, reason?: string) {
    await Promise.all([
      this.coreDatabase.getUser(actorUserId),
      this.coreDatabase.getUser(targetUserId),
    ]);

    await this.prisma.userBlock.upsert({
      where: {
        actorUserId_targetUserId: {
          actorUserId,
          targetUserId,
        },
      },
      create: {
        actorUserId,
        targetUserId,
        reason: reason ?? null,
      },
      update: {
        reason: reason ?? null,
        createdAt: new Date(),
      },
    });

    return {
      success: true,
      message: 'User blocked successfully.',
      data: await this.getBlockedUser(actorUserId, targetUserId),
    };
  }

  async unblockUser(actorUserId: string, targetUserId: string) {
    const block = await this.prisma.userBlock.findUnique({
      where: {
        actorUserId_targetUserId: {
          actorUserId,
          targetUserId,
        },
      },
    });
    if (!block) {
      throw new NotFoundException(`Blocked user ${targetUserId} not found`);
    }

    await this.prisma.userBlock.delete({
      where: {
        actorUserId_targetUserId: {
          actorUserId,
          targetUserId,
        },
      },
    });

    return {
      success: true,
      message: 'User unblocked successfully.',
      removed: {
        actorUserId: block.actorUserId,
        targetUserId: block.targetUserId,
        reason: block.reason,
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
    const report = await this.prisma.userReport.create({
      data: {
        id: makeId('report'),
        reporterUserId: input.reporterUserId,
        targetUserId: input.targetUserId ?? null,
        targetEntityId: input.targetEntityId ?? null,
        targetEntityType: input.targetEntityType ?? null,
        reason: input.reason,
        details: input.details ?? null,
        status: 'submitted',
        postId: input.targetEntityType === 'post' ? input.targetEntityId ?? null : null,
      },
    });
    return this.mapReport(report);
  }

  async getReportCenter(userId: string) {
    const reports = await this.prisma.userReport.findMany({
      where: { reporterUserId: userId },
      orderBy: { createdAt: 'desc' },
    });
    const mapped = reports.map((row) => this.mapReport(row));
    return {
      success: true,
      summary: {
        total: mapped.length,
        openReports: mapped.filter((item) => item.status !== 'resolved').length,
        resolvedReports: mapped.filter((item) => item.status === 'resolved').length,
      },
      reports: mapped,
      data: {
        reports: mapped,
      },
    };
  }

  async getSettingsState(userId: string) {
    const [settingsRow, privacyRow] = await Promise.all([
      this.prisma.userSettings.findUnique({ where: { userId } }),
      this.prisma.userPrivacy.findUnique({ where: { userId } }),
    ]);

    return {
      ...(this.toObject(settingsRow?.settings ?? {}) as Record<string, unknown>),
      ...this.privacyRowToSettings(privacyRow),
    };
  }

  async updateSettingsState(userId: string, patch: Record<string, unknown>) {
    const current = await this.getSettingsState(userId);
    const next = {
      ...current,
      ...patch,
    };

    await this.prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        settings: next as Prisma.InputJsonValue,
      },
      update: {
        settings: next as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    await this.syncPrivacyFromSettings(userId, next);
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
    const drafts = await this.prisma.postDraft.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return drafts.map((row) => this.mapDraft(row));
  }

  async getDraft(userId: string, id: string) {
    const draft = await this.prisma.postDraft.findFirst({
      where: {
        id,
        userId,
      },
    });
    if (!draft) {
      throw new NotFoundException(`Draft ${id} not found`);
    }
    return this.mapDraft(draft);
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
    const draft = await this.prisma.postDraft.create({
      data: {
        id: makeId('draft'),
        userId,
        title: input.title,
        type: input.type,
        payload: (input.payload ?? {}) as Prisma.InputJsonValue,
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
        status: input.scheduledAt ? 'scheduled' : 'draft',
      },
    });

    if (input.scheduledAt) {
      await this.upsertScheduledPost(userId, draft.id, input.scheduledAt);
    }

    return this.mapDraft(draft);
  }

  async updateDraft(userId: string, id: string, patch: Record<string, unknown>) {
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

    const draft = await this.prisma.postDraft.update({
      where: { id },
      data: {
        title: typeof patch.title === 'string' ? patch.title : current.title,
        type: typeof patch.type === 'string' ? patch.type : current.type,
        payload: nextPayload as Prisma.InputJsonValue,
        scheduledAt: nextScheduledAt ? new Date(nextScheduledAt) : null,
        status: nextScheduledAt ? 'scheduled' : 'draft',
        updatedAt: new Date(),
      },
    });

    if (nextScheduledAt) {
      await this.upsertScheduledPost(userId, id, nextScheduledAt);
    } else {
      await this.prisma.scheduledPost.deleteMany({
        where: { draftId: id },
      });
    }

    return this.mapDraft(draft);
  }

  async deleteDraft(userId: string, id: string) {
    const draft = await this.prisma.postDraft.findFirst({
      where: {
        id,
        userId,
      },
    });
    if (!draft) {
      throw new NotFoundException(`Draft ${id} not found`);
    }

    await this.prisma.$transaction([
      this.prisma.scheduledPost.deleteMany({ where: { draftId: id } }),
      this.prisma.postDraft.delete({ where: { id } }),
    ]);

    return {
      success: true,
      removed: this.mapDraft(draft),
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

  private async upsertScheduledPost(userId: string, draftId: string, scheduledAt: string) {
    const existing = await this.prisma.scheduledPost.findFirst({
      where: { draftId },
    });

    if (existing) {
      await this.prisma.scheduledPost.update({
        where: { id: existing.id },
        data: {
          scheduledFor: new Date(scheduledAt),
          status: 'pending',
          updatedAt: new Date(),
          lastError: null,
        },
      });
      return;
    }

    await this.prisma.scheduledPost.create({
      data: {
        id: makeId('scheduled'),
        userId,
        draftId,
        scheduledFor: new Date(scheduledAt),
        status: 'pending',
      },
    });
  }

  private async syncPrivacyFromSettings(userId: string, settings: Record<string, unknown>) {
    await this.prisma.userPrivacy.upsert({
      where: { userId },
      create: {
        userId,
        profilePrivate: Boolean(settings['privacy.profile_private']),
        activityStatus: Boolean(settings['privacy.activity_status']),
        allowTagging: Boolean(settings['privacy.allow_tagging']),
        allowMentions: Boolean(settings['privacy.allow_mentions']),
        allowReposts: Boolean(settings['privacy.allow_reposts']),
        allowComments: Boolean(settings['privacy.allow_comments']),
        hideSensitive: Boolean(settings['privacy.hide_sensitive']),
        hideLikes: Boolean(settings['privacy.hide_likes']),
      },
      update: {
        profilePrivate: Boolean(settings['privacy.profile_private']),
        activityStatus: Boolean(settings['privacy.activity_status']),
        allowTagging: Boolean(settings['privacy.allow_tagging']),
        allowMentions: Boolean(settings['privacy.allow_mentions']),
        allowReposts: Boolean(settings['privacy.allow_reposts']),
        allowComments: Boolean(settings['privacy.allow_comments']),
        hideSensitive: Boolean(settings['privacy.hide_sensitive']),
        hideLikes: Boolean(settings['privacy.hide_likes']),
        updatedAt: new Date(),
      },
    });
  }

  private privacyRowToSettings(
    privacy:
      | {
          profilePrivate: boolean;
          activityStatus: boolean;
          allowTagging: boolean;
          allowMentions: boolean;
          allowReposts: boolean;
          allowComments: boolean;
          hideSensitive: boolean;
          hideLikes: boolean;
        }
      | null,
  ) {
    if (!privacy) {
      return {};
    }

    return {
      'privacy.profile_private': privacy.profilePrivate,
      'privacy.activity_status': privacy.activityStatus,
      'privacy.allow_tagging': privacy.allowTagging,
      'privacy.allow_mentions': privacy.allowMentions,
      'privacy.allow_reposts': privacy.allowReposts,
      'privacy.allow_comments': privacy.allowComments,
      'privacy.hide_sensitive': privacy.hideSensitive,
      'privacy.hide_likes': privacy.hideLikes,
    };
  }

  private mapBookmark(row: {
    id: string;
    userId: string;
    entityId: string;
    title: string | null;
    type: string;
    metadata: Prisma.JsonValue;
    createdAt: Date;
  }) {
    return {
      id: row.entityId,
      bookmarkId: row.id,
      userId: row.userId,
      title: row.title ?? row.entityId,
      type: row.type,
      metadata: this.toObject(row.metadata),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private mapCollection(row: {
    id: string;
    userId: string;
    title: string;
    description: string | null;
    visibility: string;
    createdAt: Date;
    updatedAt: Date;
    items?: Array<{
      id: string;
      entityId: string;
      entityType: string;
      createdAt: Date;
    }>;
  }) {
    const items = row.items ?? [];
    return {
      id: row.id,
      userId: row.userId,
      name: row.title,
      title: row.title,
      description: row.description ?? '',
      privacy: row.visibility,
      visibility: row.visibility,
      itemIds: items.map((item) => item.entityId),
      items: items.map((item) => ({
        id: item.id,
        itemId: item.entityId,
        entityId: item.entityId,
        type: item.entityType,
        createdAt: item.createdAt.toISOString(),
      })),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapReport(row: {
    id: string;
    reporterUserId: string;
    targetUserId: string | null;
    targetEntityId: string | null;
    targetEntityType: string | null;
    reason: string;
    details: string | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      reporterUserId: row.reporterUserId,
      targetUserId: row.targetUserId,
      targetEntityId: row.targetEntityId,
      targetEntityType: row.targetEntityType,
      reason: row.reason,
      details: row.details,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private mapDraft(row: {
    id: string;
    userId: string;
    title: string;
    type: string;
    payload: Prisma.JsonValue;
    scheduledAt: Date | null;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      userId: row.userId,
      title: row.title,
      type: row.type,
      payload: this.toObject(row.payload),
      scheduledAt: row.scheduledAt ? row.scheduledAt.toISOString() : null,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private toObject(value: Prisma.JsonValue) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private normalizeCollectionVisibility(value?: string) {
    const normalized = value?.trim().toLowerCase();
    if (normalized === 'public' || normalized === 'shared') {
      return 'public';
    }
    return 'private';
  }

  private buildCollectionItemCreateInput(collectionId: string, entityId: string) {
    const normalizedId = entityId.trim();
    const lower = normalizedId.toLowerCase();
    const entityType = lower.startsWith('reel')
      ? 'reel'
      : lower.startsWith('product') || lower.startsWith('market')
        ? 'product'
        : 'post';

    return {
      id: makeId('collection_item'),
      collectionId,
      entityId: normalizedId,
      entityType,
      postId: entityType === 'post' ? normalizedId : null,
      reelId: entityType === 'reel' ? normalizedId : null,
      productId: entityType === 'product' ? normalizedId : null,
    };
  }
}
