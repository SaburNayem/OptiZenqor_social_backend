import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { makeId } from '../common/id.util';
import { PaginationQueryDto } from '../dto/api.dto';
import { CoreDatabaseService } from './core-database.service';
import { PrismaService } from './prisma.service';
import { ReelsDatabaseService } from './reels-database.service';
import { StoriesDatabaseService } from './stories-database.service';

type TargetType = 'post' | 'story' | 'reel' | 'comment';
type ArchiveTargetType =
  | 'post'
  | 'story'
  | 'reel'
  | 'product'
  | 'event'
  | 'job'
  | 'community'
  | 'page';

@Injectable()
export class SocialStateDatabaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly storiesDatabase: StoriesDatabaseService,
    private readonly reelsDatabase: ReelsDatabaseService,
  ) {}

  private readonly defaultNotificationPreferences = {
    directMessages: true,
    groupMessages: true,
    mentions: true,
    reactions: true,
    messagePreview: true,
  };

  private readonly defaultSafetyConfig = {
    readReceipts: true,
    allowUnknownMessages: true,
    filterOffensiveContent: true,
    restrictedAccountsOnly: false,
  };

  private readonly defaultChatPreferences = {
    inboxFilter: 'all',
    sound: 'default',
    enterToSend: true,
    linkPreviews: true,
  };

  async getChatPreferences(userId: string) {
    await this.coreDatabase.getUser(userId);
    const [globalPreference, threadPreferences] = await Promise.all([
      this.prisma.chatUserPreference.findUnique({
        where: { userId },
      }),
      this.prisma.chatThreadPreference.findMany({
        where: { userId },
        include: {
          thread: true,
        },
        orderBy: [{ pinned: 'desc' }, { updatedAt: 'desc' }],
      }),
    ]);

    const notificationPreferences = this.mergeObjects(
      this.defaultNotificationPreferences,
      this.readObject(globalPreference?.notificationPreferences),
    );
    const safetyConfig = this.mergeObjects(
      this.defaultSafetyConfig,
      this.readObject(globalPreference?.safetyConfig),
    );
    const preferences = this.mergeObjects(
      this.defaultChatPreferences,
      this.readObject(globalPreference?.preferences),
    );

    return {
      conversationPreferences: threadPreferences.map((item) =>
        this.mapThreadPreference(item),
      ),
      notificationPreferences,
      safetyConfig,
      preferences,
    };
  }

  async updateChatPreferences(userId: string, patch: Record<string, unknown>) {
    await this.coreDatabase.getUser(userId);
    const existing = await this.prisma.chatUserPreference.findUnique({
      where: { userId },
    });
    const nextNotificationPreferences = this.mergeObjects(
      existing ? this.readObject(existing.notificationPreferences) : {},
      this.readObject(patch.notificationPreferences),
    );
    const nextSafetyConfig = this.mergeObjects(
      existing ? this.readObject(existing.safetyConfig) : {},
      this.readObject(patch.safetyConfig),
    );

    const topLevelPreferences = { ...patch };
    delete topLevelPreferences.notificationPreferences;
    delete topLevelPreferences.safetyConfig;
    const nextPreferences = this.mergeObjects(
      existing ? this.readObject(existing.preferences) : {},
      topLevelPreferences,
    );

    await this.prisma.chatUserPreference.upsert({
      where: { userId },
      create: {
        userId,
        notificationPreferences:
          nextNotificationPreferences as Prisma.InputJsonValue,
        safetyConfig: nextSafetyConfig as Prisma.InputJsonValue,
        preferences: nextPreferences as Prisma.InputJsonValue,
      },
      update: {
        notificationPreferences:
          nextNotificationPreferences as Prisma.InputJsonValue,
        safetyConfig: nextSafetyConfig as Prisma.InputJsonValue,
        preferences: nextPreferences as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });

    return this.getChatPreferences(userId);
  }

  async updateThreadPreference(
    userId: string,
    threadId: string,
    patch: Partial<{
      archived: boolean;
      muted: boolean;
      pinned: boolean;
      unread: boolean;
      clearedAt: Date | null;
    }>,
  ) {
    await this.assertThreadParticipant(threadId, userId);
    const saved = await this.prisma.chatThreadPreference.upsert({
      where: {
        userId_threadId: {
          userId,
          threadId,
        },
      },
      create: {
        id: makeId('chat_pref'),
        userId,
        threadId,
        archived: patch.archived ?? false,
        muted: patch.muted ?? false,
        pinned: patch.pinned ?? false,
        unread: patch.unread ?? false,
        clearedAt: patch.clearedAt ?? null,
      },
      update: {
        ...(patch.archived === undefined ? {} : { archived: patch.archived }),
        ...(patch.muted === undefined ? {} : { muted: patch.muted }),
        ...(patch.pinned === undefined ? {} : { pinned: patch.pinned }),
        ...(patch.unread === undefined ? {} : { unread: patch.unread }),
        ...(patch.clearedAt === undefined ? {} : { clearedAt: patch.clearedAt }),
        updatedAt: new Date(),
      },
      include: {
        thread: true,
      },
    });

    return this.mapThreadPreference(saved);
  }

  async listArchivedEntities(
    userId: string,
    targetType: ArchiveTargetType,
    query: PaginationQueryDto,
  ) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;

    const [total, rows] = await Promise.all([
      this.prisma.userArchivedEntity.count({
        where: {
          userId,
          targetType,
        },
      }),
      this.prisma.userArchivedEntity.findMany({
        where: {
          userId,
          targetType,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const items = (await Promise.all(
      rows.map((row) => this.resolveArchivedEntity(row.targetType, row.targetId)),
    )).filter((item) => item != null);

    return this.wrapPaginated(items, page, limit, total);
  }

  async archiveEntity(
    userId: string,
    targetType: ArchiveTargetType,
    targetId: string,
  ) {
    await this.assertArchivedEntityExists(targetType, targetId);
    const row = await this.prisma.userArchivedEntity.upsert({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId,
          targetType,
        },
      },
      create: {
        id: makeId('archive'),
        userId,
        targetId,
        targetType,
      },
      update: {
        createdAt: new Date(),
      },
    });

    return {
      id: row.id,
      userId: row.userId,
      targetId: row.targetId,
      targetType: row.targetType,
      archived: true,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async unarchiveEntity(
    userId: string,
    targetId: string,
    targetType?: ArchiveTargetType,
  ) {
    const deleted = await this.prisma.userArchivedEntity.deleteMany({
      where: {
        userId,
        targetId,
        ...(targetType ? { targetType } : {}),
      },
    });
    return {
      targetId,
      targetType: targetType ?? 'post',
      archived: false,
      removedCount: deleted.count,
    };
  }

  async listHiddenEntities(
    userId: string,
    targetType: TargetType | undefined,
    query: PaginationQueryDto,
  ) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where = {
      userId,
      ...(targetType ? { targetType } : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.userHiddenEntity.count({ where }),
      this.prisma.userHiddenEntity.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const items = (
      await Promise.all(
        rows.map(async (row) => ({
          id: row.id,
          targetId: row.targetId,
          targetType: row.targetType,
          reason: row.reason ?? '',
          createdAt: row.createdAt.toISOString(),
          entity: await this.resolveHiddenEntity(row.targetType, row.targetId),
        })),
      )
    ).filter((item) => item.entity != null);

    return this.wrapPaginated(items, page, limit, total);
  }

  async getHiddenEntity(userId: string, targetId: string, targetType?: TargetType) {
    const row = await this.prisma.userHiddenEntity.findFirst({
      where: {
        userId,
        targetId,
        ...(targetType ? { targetType } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!row) {
      throw new NotFoundException(`Hidden item ${targetId} not found.`);
    }

    return {
      id: row.id,
      targetId: row.targetId,
      targetType: row.targetType,
      reason: row.reason ?? '',
      createdAt: row.createdAt.toISOString(),
      entity: await this.resolveHiddenEntity(row.targetType, row.targetId),
    };
  }

  async hideEntity(
    userId: string,
    targetType: TargetType,
    targetId: string,
    reason?: string,
  ) {
    await this.assertEntityExists(targetType, targetId);
    const row = await this.prisma.userHiddenEntity.upsert({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId,
          targetType,
        },
      },
      create: {
        id: makeId('hidden'),
        userId,
        targetId,
        targetType,
        reason: reason?.trim() || null,
      },
      update: {
        reason: reason?.trim() || null,
        createdAt: new Date(),
      },
    });

    return {
      id: row.id,
      userId: row.userId,
      targetId: row.targetId,
      targetType: row.targetType,
      reason: row.reason ?? '',
      hidden: true,
      createdAt: row.createdAt.toISOString(),
    };
  }

  async unhideEntity(userId: string, targetId: string, targetType?: TargetType) {
    const deleted = await this.prisma.userHiddenEntity.deleteMany({
      where: {
        userId,
        targetId,
        ...(targetType ? { targetType } : {}),
      },
    });
    return {
      targetId,
      targetType: targetType ?? 'post',
      hidden: false,
      removedCount: deleted.count,
    };
  }

  async listLiveStreams(query: PaginationQueryDto & { status?: string; userId?: string }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const order = query.order === 'asc' ? 'asc' : 'desc';
    const sortField = query.sort === 'viewerCount' ? 'viewerCount' : 'createdAt';

    const where: Prisma.LiveStreamSessionWhereInput = {
      ...(query.status?.trim() ? { status: query.status.trim() } : {}),
      ...(query.userId?.trim() ? { hostId: query.userId.trim() } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { title: { contains: query.search.trim(), mode: 'insensitive' } },
              {
                description: {
                  contains: query.search.trim(),
                  mode: 'insensitive',
                },
              },
              { category: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.prisma.liveStreamSession.count({ where }),
      this.prisma.liveStreamSession.findMany({
        where,
        include: {
          host: true,
          _count: {
            select: {
              comments: true,
              reactions: true,
            },
          },
        },
        orderBy: { [sortField]: order },
        skip,
        take: limit,
      }),
    ]);

    const items = rows.map((row) => this.mapLiveStream(row));
    return this.wrapPaginated(items, page, limit, total);
  }

  async getLiveStream(streamId: string) {
    const stream = await this.prisma.liveStreamSession.findUnique({
      where: { id: streamId },
      include: {
        host: true,
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        reactions: {
          orderBy: { createdAt: 'desc' },
          take: 100,
        },
      },
    });
    if (!stream) {
      throw new NotFoundException(`Live stream ${streamId} not found.`);
    }

    return {
      ...this.mapLiveStream(stream),
      comments: stream.comments.map((item) => this.mapLiveComment(item)),
      reactions: stream.reactions.map((item) => this.mapLiveReaction(item)),
    };
  }

  async getLiveStreamSetup(userId: string) {
    const user = await this.coreDatabase.getUser(userId);
    const latest = await this.prisma.liveStreamSession.findFirst({
      where: { hostId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        comments: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    return {
      id: latest?.id ?? '',
      host: user.name,
      username: user.username,
      avatarUrl: user.avatar,
      title: latest?.title ?? 'Go live',
      description: latest?.description ?? '',
      category: latest?.category ?? 'Live',
      location: latest?.location ?? '',
      audience: latest?.audience ?? 'public',
      status: latest?.status ?? 'scheduled',
      audienceCount: latest?.viewerCount ?? 0,
      quickOptions:
        this.readArrayObjects(latest?.quickOptions).length > 0
          ? this.readArrayObjects(latest?.quickOptions)
          : this.defaultLiveQuickOptions(),
      comments: (latest?.comments ?? []).map((item) => this.mapLiveComment(item)),
    };
  }

  async getLiveStreamStudio(userId: string) {
    const latest = await this.prisma.liveStreamSession.findFirst({
      where: { hostId: userId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    const setup = await this.getLiveStreamSetup(userId);
    return {
      ...setup,
      streamId: latest?.id ?? '',
      metadata: this.readObject(latest?.metadata),
      startedAt: latest?.startedAt?.toISOString() ?? null,
      endedAt: latest?.endedAt?.toISOString() ?? null,
    };
  }

  async updateLiveStreamStudio(
    userId: string,
    patch: {
      title?: string;
      description?: string;
      category?: string;
      location?: string;
      audience?: string;
      quickOptions?: Record<string, unknown>[];
      metadata?: Record<string, unknown>;
      previewImageUrl?: string;
    },
  ) {
    const latest = await this.prisma.liveStreamSession.findFirst({
      where: { hostId: userId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    if (!latest) {
      throw new NotFoundException('No live stream studio session found for this host.');
    }

    await this.prisma.liveStreamSession.update({
      where: { id: latest.id },
      data: {
        title: patch.title?.trim() || undefined,
        description: patch.description?.trim() || undefined,
        category: patch.category?.trim() || undefined,
        location: patch.location?.trim() || undefined,
        audience: patch.audience?.trim() || undefined,
        previewImageUrl: patch.previewImageUrl?.trim() || undefined,
        quickOptions: Array.isArray(patch.quickOptions)
          ? (patch.quickOptions as Prisma.InputJsonValue)
          : undefined,
        metadata: patch.metadata
          ? (this.mergeObjects(
              this.readObject(latest.metadata),
              patch.metadata,
            ) as Prisma.InputJsonValue)
          : undefined,
        updatedAt: new Date(),
      },
    });

    return this.getLiveStreamStudio(userId);
  }

  async createLiveStream(
    userId: string,
    input: {
      title: string;
      description?: string;
      category?: string;
      location?: string;
      audience?: string;
      quickOptions?: unknown[];
      previewImageUrl?: string;
    },
  ) {
    await this.coreDatabase.getUser(userId);
    const stream = await this.prisma.liveStreamSession.create({
      data: {
        id: makeId('live_stream'),
        hostId: userId,
        title: input.title.trim() || 'Go live',
        description: input.description?.trim() || '',
        category: input.category?.trim() || 'Live',
        location: input.location?.trim() || null,
        audience: input.audience?.trim() || 'public',
        status: 'scheduled',
        quickOptions: (Array.isArray(input.quickOptions)
          ? input.quickOptions
          : this.defaultLiveQuickOptions()) as Prisma.InputJsonValue,
        previewImageUrl: input.previewImageUrl?.trim() || null,
      },
      include: {
        host: true,
        _count: {
          select: {
            comments: true,
            reactions: true,
          },
        },
      },
    });
    await this.recordLiveLifecycleSnapshot(stream.id, userId, 'scheduled', {
      category: stream.category,
      audience: stream.audience,
    });
    return this.mapLiveStream(stream);
  }

  async startLiveStream(streamId: string, userId: string) {
    const stream = await this.prisma.liveStreamSession.findUnique({
      where: { id: streamId },
      select: { id: true, hostId: true },
    });
    if (!stream) {
      throw new NotFoundException(`Live stream ${streamId} not found.`);
    }
    if (stream.hostId !== userId) {
      throw new ForbiddenException('Only the host can start this live stream.');
    }
    await this.prisma.liveStreamSession.update({
      where: { id: streamId },
      data: {
        status: 'live',
        startedAt: new Date(),
        endedAt: null,
        updatedAt: new Date(),
      },
    });
    await this.recordLiveLifecycleSnapshot(streamId, userId, 'live', {});
    return this.getLiveStream(streamId);
  }

  async endLiveStream(streamId: string, userId: string) {
    const stream = await this.prisma.liveStreamSession.findUnique({
      where: { id: streamId },
      select: { id: true, hostId: true },
    });
    if (!stream) {
      throw new NotFoundException(`Live stream ${streamId} not found.`);
    }
    if (stream.hostId !== userId) {
      throw new ForbiddenException('Only the host can end this live stream.');
    }
    await this.prisma.liveStreamSession.update({
      where: { id: streamId },
      data: {
        status: 'ended',
        endedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    await this.recordLiveLifecycleSnapshot(streamId, userId, 'ended', {}, 'host_ended');
    return this.getLiveStream(streamId);
  }

  async updateLiveStreamModeration(
    streamId: string,
    userId: string,
    patch: { commentsEnabled?: boolean; slowModeSeconds?: number; note?: string },
  ) {
    const stream = await this.prisma.liveStreamSession.findUnique({
      where: { id: streamId },
    });
    if (!stream) {
      throw new NotFoundException(`Live stream ${streamId} not found.`);
    }
    if (stream.hostId !== userId) {
      throw new ForbiddenException('Only the host can update live stream moderation.');
    }

    const metadata = this.readObject(stream.metadata);
    await this.prisma.liveStreamSession.update({
      where: { id: streamId },
      data: {
        metadata: {
          ...metadata,
          moderation: {
            ...(this.readObject(metadata.moderation)),
            ...(patch.commentsEnabled === undefined
              ? {}
              : { commentsEnabled: patch.commentsEnabled }),
            ...(patch.slowModeSeconds === undefined
              ? {}
              : { slowModeSeconds: patch.slowModeSeconds }),
            ...(patch.note?.trim() ? { note: patch.note.trim() } : {}),
          },
        } as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
    await this.recordLiveLifecycleSnapshot(streamId, userId, 'moderation_updated', patch);

    return this.getLiveStream(streamId);
  }

  async createLiveStreamComment(streamId: string, userId: string, message: string) {
    const stream = await this.prisma.liveStreamSession.findUnique({
      where: { id: streamId },
    });
    if (!stream) {
      throw new NotFoundException(`Live stream ${streamId} not found.`);
    }
    const user = await this.coreDatabase.getUser(userId);
    const comment = await this.prisma.liveStreamComment.create({
      data: {
        id: makeId('live_comment'),
        streamId,
        userId,
        username: user.username,
        avatarUrl: user.avatar,
        message: message.trim(),
      },
    });
    return this.mapLiveComment(comment);
  }

  async listLiveStreamComments(streamId: string, query: PaginationQueryDto) {
    await this.ensureLiveStreamExists(streamId);
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const [total, rows] = await Promise.all([
      this.prisma.liveStreamComment.count({ where: { streamId } }),
      this.prisma.liveStreamComment.findMany({
        where: { streamId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const items = rows.map((item) => this.mapLiveComment(item));
    return this.wrapPaginated(items, page, limit, total);
  }

  async createLiveStreamReaction(streamId: string, userId: string, type: string) {
    await this.ensureLiveStreamExists(streamId);
    await this.coreDatabase.getUser(userId);
    const reaction = await this.prisma.liveStreamReaction.create({
      data: {
        id: makeId('live_reaction'),
        streamId,
        userId,
        type,
      },
    });
    const summary = await this.getLiveReactionSummary(streamId);
    return {
      reaction: this.mapLiveReaction(reaction),
      summary,
    };
  }

  async listLiveStreamReactions(streamId: string, query: PaginationQueryDto) {
    await this.ensureLiveStreamExists(streamId);
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const [total, rows, summary] = await Promise.all([
      this.prisma.liveStreamReaction.count({ where: { streamId } }),
      this.prisma.liveStreamReaction.findMany({
        where: { streamId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.getLiveReactionSummary(streamId),
    ]);
    const items = rows.map((item) => this.mapLiveReaction(item));
    return {
      ...this.wrapPaginated(items, page, limit, total),
      summary,
    };
  }

  private async getLiveReactionSummary(streamId: string) {
    const rows = await this.prisma.liveStreamReaction.groupBy({
      by: ['type'],
      where: { streamId },
      _count: {
        type: true,
      },
    });
    return rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.type] = row._count.type;
      return acc;
    }, {});
  }

  private async ensureLiveStreamExists(streamId: string) {
    const stream = await this.prisma.liveStreamSession.findUnique({
      where: { id: streamId },
      select: { id: true },
    });
    if (!stream) {
      throw new NotFoundException(`Live stream ${streamId} not found.`);
    }
  }

  private async assertThreadParticipant(threadId: string, userId: string) {
    const participant = await this.prisma.chatThreadParticipant.findUnique({
      where: {
        threadId_userId: {
          threadId,
          userId,
        },
      },
    });
    if (!participant) {
      throw new ForbiddenException('You are not a participant in this thread.');
    }
  }

  private async assertEntityExists(targetType: TargetType, targetId: string) {
    switch (targetType) {
      case 'post':
        await this.coreDatabase.getPost(targetId);
        return;
      case 'story':
        await this.storiesDatabase.getStory(targetId);
        return;
      case 'reel':
        await this.reelsDatabase.getReel(targetId);
        return;
      case 'comment':
        throw new NotFoundException('Comment hiding is not yet supported by durable storage.');
      default:
        throw new NotFoundException(`Unsupported target type ${targetType}.`);
    }
  }

  private async assertArchivedEntityExists(
    targetType: ArchiveTargetType,
    targetId: string,
  ) {
    switch (targetType) {
      case 'post':
        await this.coreDatabase.getPost(targetId);
        return;
      case 'story':
        await this.storiesDatabase.getStory(targetId);
        return;
      case 'reel':
        await this.reelsDatabase.getReel(targetId);
        return;
      case 'product': {
        const product = await this.prisma.marketplaceProduct.findFirst({
          where: { id: targetId, deletedAt: null },
        });
        if (!product) {
          throw new NotFoundException(`Marketplace product ${targetId} not found.`);
        }
        return;
      }
      case 'event': {
        const event = await this.prisma.event.findFirst({
          where: { id: targetId, deletedAt: null },
        });
        if (!event) {
          throw new NotFoundException(`Event ${targetId} not found.`);
        }
        return;
      }
      case 'job': {
        const job = await this.prisma.job.findFirst({
          where: { id: targetId, deletedAt: null },
        });
        if (!job) {
          throw new NotFoundException(`Job ${targetId} not found.`);
        }
        return;
      }
      case 'community': {
        const community = await this.prisma.community.findFirst({
          where: { id: targetId, deletedAt: null },
        });
        if (!community) {
          throw new NotFoundException(`Community ${targetId} not found.`);
        }
        return;
      }
      case 'page': {
        const page = await this.prisma.page.findFirst({
          where: { id: targetId, deletedAt: null },
        });
        if (!page) {
          throw new NotFoundException(`Page ${targetId} not found.`);
        }
        return;
      }
      default:
        throw new NotFoundException(`Unsupported archive target type ${targetType}.`);
    }
  }

  private async resolveArchivedEntity(targetType: string, targetId: string) {
    switch (targetType) {
      case 'post':
        return this.coreDatabase.getPost(targetId).catch(() => null);
      case 'story':
        return this.storiesDatabase.getStory(targetId).catch(() => null);
      case 'reel':
        return this.reelsDatabase.getReel(targetId).catch(() => null);
      case 'product':
        return this.prisma.marketplaceProduct
          .findFirst({ where: { id: targetId, deletedAt: null } })
          .catch(() => null);
      case 'event':
        return this.prisma.event
          .findFirst({ where: { id: targetId, deletedAt: null } })
          .catch(() => null);
      case 'job':
        return this.prisma.job
          .findFirst({ where: { id: targetId, deletedAt: null } })
          .catch(() => null);
      case 'community':
        return this.prisma.community
          .findFirst({ where: { id: targetId, deletedAt: null } })
          .catch(() => null);
      case 'page':
        return this.prisma.page
          .findFirst({ where: { id: targetId, deletedAt: null } })
          .catch(() => null);
      default:
        return null;
    }
  }

  private async resolveHiddenEntity(targetType: string, targetId: string) {
    switch (targetType) {
      case 'post':
        return this.coreDatabase.getPost(targetId).catch(() => null);
      case 'story':
        return this.storiesDatabase.getStory(targetId).catch(() => null);
      case 'reel':
        return this.reelsDatabase.getReel(targetId).catch(() => null);
      default:
        return null;
    }
  }

  private mapThreadPreference(item: {
    threadId: string;
    archived: boolean;
    muted: boolean;
    pinned: boolean;
    unread: boolean;
    clearedAt: Date | null;
    updatedAt: Date;
    thread?: { title: string | null } | null;
  }) {
    return {
      threadId: item.threadId,
      title: item.thread?.title ?? '',
      archived: item.archived,
      muted: item.muted,
      pinned: item.pinned,
      unread: item.unread,
      clearedAt: item.clearedAt?.toISOString() ?? null,
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private mapLiveStream(item: {
    id: string;
    hostId: string;
    title: string;
    description: string;
    category: string;
    location: string | null;
    audience: string;
    status: string;
    viewerCount: number;
    quickOptions: Prisma.JsonValue;
    previewImageUrl: string | null;
    metadata?: Prisma.JsonValue;
    startedAt: Date | null;
    endedAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    host?: { id: string; name: string; username: string; avatar: string } | null;
    comments?: Array<{ id: string }>;
    reactions?: Array<{ id: string }>;
    _count?: { comments: number; reactions: number };
  }) {
    const host = item.host;
    return {
      id: item.id,
      hostId: item.hostId,
      host: host?.name ?? '',
      username: host?.username ?? '',
      avatarUrl: host?.avatar ?? '',
      title: item.title,
      description: item.description,
      category: item.category,
      location: item.location ?? '',
      audience: item.audience,
      status: item.status,
      audienceCount: item.viewerCount,
      viewerCount: item.viewerCount,
      quickOptions:
        this.readArrayObjects(item.quickOptions).length > 0
          ? this.readArrayObjects(item.quickOptions)
          : this.defaultLiveQuickOptions(),
      previewImageUrl: item.previewImageUrl ?? '',
      metadata: this.readObject(item.metadata),
      startedAt: item.startedAt?.toISOString() ?? null,
      endedAt: item.endedAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      commentCount: item._count?.comments ?? item.comments?.length ?? 0,
      reactionCount: item._count?.reactions ?? item.reactions?.length ?? 0,
    };
  }

  private mapLiveComment(item: {
    id: string;
    streamId: string;
    userId: string;
    username: string;
    avatarUrl: string | null;
    message: string;
    createdAt: Date;
  }) {
    return {
      id: item.id,
      streamId: item.streamId,
      userId: item.userId,
      username: item.username,
      avatarUrl: item.avatarUrl ?? '',
      message: item.message,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private mapLiveReaction(item: {
    id: string;
    streamId: string;
    userId: string;
    type: string;
    createdAt: Date;
  }) {
    return {
      id: item.id,
      streamId: item.streamId,
      userId: item.userId,
      type: item.type,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private wrapPaginated(items: unknown[], page: number, limit: number, total: number) {
    return {
      data: items,
      items,
      results: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
      count: items.length,
      total,
    };
  }

  private resolvePage(value?: number) {
    return value && value > 0 ? value : 1;
  }

  private resolveLimit(value?: number) {
    if (!value || value < 1) {
      return 20;
    }
    return Math.min(value, 100);
  }

  private readObject(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {} as Record<string, unknown>;
    }
    return value as Record<string, unknown>;
  }

  private readArrayObjects(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter(
      (item) => Boolean(item) && typeof item === 'object' && !Array.isArray(item),
    );
  }

  private mergeObjects(
    base: Record<string, unknown>,
    patch: Record<string, unknown>,
  ) {
    return {
      ...base,
      ...patch,
    };
  }

  private defaultLiveQuickOptions() {
    return [
      { id: 'live', label: 'Live video', selected: true },
      { id: 'event', label: 'Event', selected: false },
      { id: 'qa', label: 'Q&A', selected: false },
      { id: 'products', label: 'Products', selected: false },
    ];
  }

  private async recordLiveLifecycleSnapshot(
    streamId: string,
    actorUserId: string | null,
    status: string,
    payload: Record<string, unknown>,
    reason?: string,
  ) {
    await this.prisma.$executeRaw`
      insert into app_live_lifecycle_snapshots (
        id, stream_id, actor_user_id, status, reason, payload, captured_at
      ) values (
        ${makeId('live_lifecycle')},
        ${streamId},
        ${actorUserId},
        ${status},
        ${reason ?? null},
        ${payload as Prisma.InputJsonValue},
        ${new Date()}
      )
    `;
  }
}
