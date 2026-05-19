import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  buildReportOptionsPayload,
  getReportReasonOption,
  getReportStatusOption,
  getReportTargetOption,
  inferReportTargetTypeFromId,
  normalizeReportReason,
  normalizeReportTargetType,
} from '../common/report-options';
import { PrismaService } from './prisma.service';

type ReportSubmissionInput = {
  reporterUserId: string;
  reason: string;
  details?: string;
  targetType?: string;
  targetId?: string;
  targetUserId?: string;
  targetEntityId?: string;
  targetEntityType?: string;
};

type ReportRecord = {
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
  reporter?: {
    id: string;
    name: string;
    username?: string | null;
    avatar?: string | null;
    email?: string | null;
  };
  targetUser?: {
    id: string;
    name: string;
    username?: string | null;
    avatar?: string | null;
    email?: string | null;
  } | null;
};

export type ReportTargetPreview = {
  id: string | null;
  type: string;
  typeLabel: string;
  label: string;
  subtitle: string | null;
  ownerUserId: string | null;
  ownerName: string | null;
  ownerUsername: string | null;
  status: string | null;
  imageUrl: string | null;
  routeName: string;
  adminSection: string;
  actionLabel: string;
  exists: boolean;
};

@Injectable()
export class ReportPresentationService {
  constructor(private readonly prisma: PrismaService) {}

  getReportOptions() {
    return buildReportOptionsPayload();
  }

  normalizeTargetType(value?: string | null) {
    return normalizeReportTargetType(value);
  }

  normalizeReason(value?: string | null) {
    return normalizeReportReason(value);
  }

  async prepareSubmission(input: ReportSubmissionInput) {
    const targetId = this.firstTrimmed(
      input.targetEntityId,
      input.targetId,
      input.targetUserId,
    );
    const targetType =
      normalizeReportTargetType(input.targetEntityType ?? input.targetType) ||
      inferReportTargetTypeFromId(targetId) ||
      (input.targetUserId ? 'user' : '');
    const reason = normalizeReportReason(input.reason);

    if (!reason) {
      throw new BadRequestException('Report reason is required.');
    }
    if (!targetType || !targetId) {
      throw new BadRequestException(
        'Report target is required. Send targetType plus targetId, or targetUserId for a person.',
      );
    }

    const targetUserId =
      targetType === 'user'
        ? this.firstTrimmed(input.targetUserId, input.targetId, input.targetEntityId)
        : this.firstTrimmed(input.targetUserId);
    const targetEntityId = targetType === 'user' ? null : targetId;

    if (targetType === 'user' && targetUserId === input.reporterUserId) {
      throw new BadRequestException('You cannot report your own account.');
    }

    const targetPreview = await this.resolveTargetPreview({
      targetEntityType: targetType,
      targetEntityId,
      targetUserId,
    });
    if (!targetPreview.exists) {
      throw new NotFoundException(`Reported ${targetPreview.typeLabel.toLowerCase()} ${targetId} was not found.`);
    }

    return {
      targetEntityType: targetType,
      targetEntityId,
      targetUserId: targetUserId ?? targetPreview.ownerUserId,
      reason: getReportReasonOption(reason).key,
      details: this.firstTrimmed(input.details) ?? null,
      targetPreview,
    };
  }

  async describeReport(row: ReportRecord) {
    const targetType = this.resolveReportTargetType(row);
    const targetId = this.resolveReportTargetId(row, targetType);
    const targetPreview = await this.resolveTargetPreview({
      targetEntityType: targetType,
      targetEntityId: row.targetEntityId,
      targetUserId: row.targetUserId,
    });
    const targetOption = getReportTargetOption(targetType);
    const reasonOption = getReportReasonOption(row.reason);
    const statusOption = getReportStatusOption(row.status);
    const targetLabel = targetPreview.label || targetId || row.id;
    const targetModule = targetOption?.adminSection ?? 'reports';

    return {
      targetType,
      targetTypeLabel: targetPreview.typeLabel,
      targetId,
      targetLabel,
      targetSummary: targetPreview.subtitle,
      targetOwnerUserId: targetPreview.ownerUserId ?? row.targetUserId,
      targetOwnerName: targetPreview.ownerName ?? row.targetUser?.name ?? null,
      targetOwnerUsername: targetPreview.ownerUsername ?? row.targetUser?.username ?? null,
      targetModule,
      targetSearch: targetId ?? row.id,
      targetActionLabel: targetOption?.actionLabel ?? 'Use target ID',
      actionLocation: targetOption
        ? `Take action in ${this.formatAdminSection(targetOption.adminSection)}.`
        : 'Use the target ID in the matching admin section.',
      routeName: targetOption?.routeName ?? '/admin/reports',
      reasonKey: reasonOption.key,
      reasonLabel: reasonOption.label,
      reasonDescription: reasonOption.description,
      severity: reasonOption.severity,
      statusLabel: statusOption.label,
      statusDescription: statusOption.description,
      displayTitle: `${reasonOption.label} on ${targetPreview.typeLabel}`,
      targetPreview,
    };
  }

  async resolveTargetPreview(input: {
    targetEntityType?: string | null;
    targetEntityId?: string | null;
    targetUserId?: string | null;
  }): Promise<ReportTargetPreview> {
    const targetId = this.resolveTargetId(input);
    const targetType =
      normalizeReportTargetType(input.targetEntityType) ||
      inferReportTargetTypeFromId(targetId) ||
      (input.targetUserId ? 'user' : 'unknown');

    switch (targetType) {
      case 'user':
        return this.resolveUserPreview(input.targetUserId ?? targetId, targetType);
      case 'post':
        return this.resolvePostPreview(targetId, targetType);
      case 'reel':
        return this.resolveReelPreview(targetId, targetType);
      case 'story':
        return this.resolveStoryPreview(targetId, targetType);
      case 'comment':
        return this.resolveCommentPreview(targetId, targetType);
      case 'marketplace':
        return this.resolveMarketplacePreview(targetId, targetType);
      case 'job':
        return this.resolveJobPreview(targetId, targetType);
      case 'event':
        return this.resolveEventPreview(targetId, targetType);
      case 'community':
        return this.resolveCommunityPreview(targetId, targetType);
      case 'page':
        return this.resolvePagePreview(targetId, targetType);
      case 'chat':
        return this.resolveChatPreview(targetId, targetType);
      case 'live':
        return this.resolveLivePreview(targetId, targetType);
      default:
        return this.fallbackPreview(targetType, targetId);
    }
  }

  private async resolveUserPreview(id: string | null, targetType: string) {
    if (!id) {
      return this.fallbackPreview(targetType, id);
    }
    const user = await this.prisma.appUser.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        avatar: true,
        status: true,
        verification: true,
        blocked: true,
      },
    });
    if (!user) {
      return this.fallbackPreview(targetType, id);
    }
    return this.preview({
      type: targetType,
      id: user.id,
      label: user.name,
      subtitle: `@${user.username}`,
      ownerUserId: user.id,
      ownerName: user.name,
      ownerUsername: user.username,
      status: user.blocked ? 'blocked' : user.status,
      imageUrl: user.avatar,
    });
  }

  private async resolvePostPreview(id: string | null, targetType: string) {
    if (!id) {
      return this.fallbackPreview(targetType, id);
    }
    const post = await this.prisma.appPost.findUnique({
      where: { id },
      select: {
        id: true,
        caption: true,
        media: true,
        status: true,
        type: true,
        authorId: true,
        author: { select: { name: true, username: true, avatar: true } },
      },
    });
    if (!post) {
      return this.fallbackPreview(targetType, id);
    }
    return this.preview({
      type: targetType,
      id: post.id,
      label: this.truncate(post.caption || post.type || post.id),
      subtitle: `Post by ${post.author.name}`,
      ownerUserId: post.authorId,
      ownerName: post.author.name,
      ownerUsername: post.author.username,
      status: post.status,
      imageUrl: this.extractFirstMediaUrl(post.media) ?? post.author.avatar,
    });
  }

  private async resolveReelPreview(id: string | null, targetType: string) {
    if (!id) {
      return this.fallbackPreview(targetType, id);
    }
    const reel = await this.prisma.reel.findUnique({
      where: { id },
      select: {
        id: true,
        caption: true,
        thumbnailUrl: true,
        videoUrl: true,
        isDraft: true,
        userId: true,
        user: { select: { name: true, username: true, avatar: true } },
      },
    });
    if (!reel) {
      return this.fallbackPreview(targetType, id);
    }
    return this.preview({
      type: targetType,
      id: reel.id,
      label: this.truncate(reel.caption || reel.id),
      subtitle: `Reel by ${reel.user.name}`,
      ownerUserId: reel.userId,
      ownerName: reel.user.name,
      ownerUsername: reel.user.username,
      status: reel.isDraft ? 'draft' : 'published',
      imageUrl: reel.thumbnailUrl || reel.videoUrl || reel.user.avatar,
    });
  }

  private async resolveStoryPreview(id: string | null, targetType: string) {
    if (!id) {
      return this.fallbackPreview(targetType, id);
    }
    const story = await this.prisma.story.findUnique({
      where: { id },
      select: {
        id: true,
        text: true,
        media: true,
        mediaItems: true,
        privacy: true,
        userId: true,
        user: { select: { name: true, username: true, avatar: true } },
      },
    });
    if (!story) {
      return this.fallbackPreview(targetType, id);
    }
    return this.preview({
      type: targetType,
      id: story.id,
      label: this.truncate(story.text || story.id),
      subtitle: `Story by ${story.user.name}`,
      ownerUserId: story.userId,
      ownerName: story.user.name,
      ownerUsername: story.user.username,
      status: story.privacy,
      imageUrl: story.media || this.extractFirstMediaUrl(story.mediaItems) || story.user.avatar,
    });
  }

  private async resolveCommentPreview(id: string | null, targetType: string) {
    if (!id) {
      return this.fallbackPreview(targetType, id);
    }
    const [postComment, reelComment, storyComment, liveComment] = await Promise.all([
      this.prisma.appPostComment.findUnique({
        where: { id },
        select: {
          id: true,
          message: true,
          postId: true,
          authorId: true,
          authorName: true,
          isReported: true,
          author: { select: { name: true, username: true, avatar: true } },
        },
      }),
      this.prisma.reelComment.findUnique({
        where: { id },
        select: {
          id: true,
          comment: true,
          reelId: true,
          userId: true,
          user: { select: { name: true, username: true, avatar: true } },
        },
      }),
      this.prisma.storyComment.findUnique({
        where: { id },
        select: {
          id: true,
          comment: true,
          storyId: true,
          userId: true,
          user: { select: { name: true, username: true, avatar: true } },
        },
      }),
      this.prisma.liveStreamComment.findUnique({
        where: { id },
        select: {
          id: true,
          message: true,
          streamId: true,
          userId: true,
          username: true,
          avatarUrl: true,
          user: { select: { name: true, username: true, avatar: true } },
        },
      }),
    ]);

    if (postComment) {
      return this.preview({
        type: targetType,
        id: postComment.id,
        label: this.truncate(postComment.message),
        subtitle: `Post comment on ${postComment.postId}`,
        ownerUserId: postComment.authorId,
        ownerName: postComment.author?.name ?? postComment.authorName,
        ownerUsername: postComment.author?.username ?? null,
        status: postComment.isReported ? 'reported' : 'visible',
        imageUrl: postComment.author?.avatar ?? null,
      });
    }
    if (reelComment) {
      return this.preview({
        type: targetType,
        id: reelComment.id,
        label: this.truncate(reelComment.comment),
        subtitle: `Reel comment on ${reelComment.reelId}`,
        ownerUserId: reelComment.userId,
        ownerName: reelComment.user.name,
        ownerUsername: reelComment.user.username,
        status: 'visible',
        imageUrl: reelComment.user.avatar,
      });
    }
    if (storyComment) {
      return this.preview({
        type: targetType,
        id: storyComment.id,
        label: this.truncate(storyComment.comment),
        subtitle: `Story comment on ${storyComment.storyId}`,
        ownerUserId: storyComment.userId,
        ownerName: storyComment.user.name,
        ownerUsername: storyComment.user.username,
        status: 'visible',
        imageUrl: storyComment.user.avatar,
      });
    }
    if (liveComment) {
      return this.preview({
        type: targetType,
        id: liveComment.id,
        label: this.truncate(liveComment.message),
        subtitle: `Live comment on ${liveComment.streamId}`,
        ownerUserId: liveComment.userId,
        ownerName: liveComment.user?.name ?? liveComment.username,
        ownerUsername: liveComment.user?.username ?? liveComment.username,
        status: 'visible',
        imageUrl: liveComment.avatarUrl ?? liveComment.user?.avatar ?? null,
      });
    }
    return this.fallbackPreview(targetType, id);
  }

  private async resolveMarketplacePreview(id: string | null, targetType: string) {
    if (!id) {
      return this.fallbackPreview(targetType, id);
    }
    const product = await this.prisma.marketplaceProduct.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        category: true,
        price: true,
        currency: true,
        images: true,
        status: true,
        sellerId: true,
        seller: { select: { name: true, username: true, avatar: true } },
      },
    });
    if (!product) {
      return this.fallbackPreview(targetType, id);
    }
    return this.preview({
      type: targetType,
      id: product.id,
      label: product.title,
      subtitle: `${product.category} - ${product.currency} ${product.price}`,
      ownerUserId: product.sellerId,
      ownerName: product.seller.name,
      ownerUsername: product.seller.username,
      status: product.status,
      imageUrl: this.extractFirstMediaUrl(product.images) ?? product.seller.avatar,
    });
  }

  private async resolveJobPreview(id: string | null, targetType: string) {
    if (!id) {
      return this.fallbackPreview(targetType, id);
    }
    const job = await this.prisma.job.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        company: true,
        status: true,
        recruiterId: true,
        recruiter: { select: { name: true, username: true, avatar: true } },
      },
    });
    if (!job) {
      return this.fallbackPreview(targetType, id);
    }
    return this.preview({
      type: targetType,
      id: job.id,
      label: job.title,
      subtitle: job.company,
      ownerUserId: job.recruiterId,
      ownerName: job.recruiter.name,
      ownerUsername: job.recruiter.username,
      status: job.status,
      imageUrl: job.recruiter.avatar,
    });
  }

  private async resolveEventPreview(id: string | null, targetType: string) {
    if (!id) {
      return this.fallbackPreview(targetType, id);
    }
    const event = await this.prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        organizerName: true,
        organizerId: true,
        date: true,
        status: true,
        organizer: { select: { name: true, username: true, avatar: true } },
      },
    });
    if (!event) {
      return this.fallbackPreview(targetType, id);
    }
    return this.preview({
      type: targetType,
      id: event.id,
      label: event.title,
      subtitle: `${event.organizerName} - ${event.date}`,
      ownerUserId: event.organizerId,
      ownerName: event.organizer.name,
      ownerUsername: event.organizer.username,
      status: event.status,
      imageUrl: event.organizer.avatar,
    });
  }

  private async resolveCommunityPreview(id: string | null, targetType: string) {
    if (!id) {
      return this.fallbackPreview(targetType, id);
    }
    const community = await this.prisma.community.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        privacy: true,
        ownerId: true,
        ownerName: true,
        owner: { select: { name: true, username: true, avatar: true } },
      },
    });
    if (!community) {
      return this.fallbackPreview(targetType, id);
    }
    return this.preview({
      type: targetType,
      id: community.id,
      label: community.name,
      subtitle: this.truncate(community.description),
      ownerUserId: community.ownerId,
      ownerName: community.owner?.name ?? community.ownerName,
      ownerUsername: community.owner?.username ?? null,
      status: community.privacy,
      imageUrl: community.owner?.avatar ?? null,
    });
  }

  private async resolvePagePreview(id: string | null, targetType: string) {
    if (!id) {
      return this.fallbackPreview(targetType, id);
    }
    const page = await this.prisma.page.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        about: true,
        category: true,
        ownerId: true,
        owner: { select: { name: true, username: true, avatar: true } },
      },
    });
    if (!page) {
      return this.fallbackPreview(targetType, id);
    }
    return this.preview({
      type: targetType,
      id: page.id,
      label: page.name,
      subtitle: page.category || this.truncate(page.about),
      ownerUserId: page.ownerId,
      ownerName: page.owner.name,
      ownerUsername: page.owner.username,
      status: page.category,
      imageUrl: page.owner.avatar,
    });
  }

  private async resolveChatPreview(id: string | null, targetType: string) {
    if (!id) {
      return this.fallbackPreview(targetType, id);
    }
    const [thread, message, marketplaceConversation] = await Promise.all([
      this.prisma.chatThread.findUnique({
        where: { id },
        select: { id: true, title: true, summary: true, flag: true, participantsLabel: true },
      }),
      this.prisma.chatMessage.findUnique({
        where: { id },
        select: {
          id: true,
          text: true,
          threadId: true,
          senderId: true,
          sender: { select: { name: true, username: true, avatar: true } },
        },
      }),
      this.prisma.marketplaceConversation.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          sellerId: true,
          buyer: { select: { name: true, username: true, avatar: true } },
          seller: { select: { name: true, username: true, avatar: true } },
          product: { select: { title: true, images: true } },
        },
      }),
    ]);
    if (thread) {
      return this.preview({
        type: targetType,
        id: thread.id,
        label: thread.title,
        subtitle: thread.summary || thread.participantsLabel,
        ownerUserId: null,
        ownerName: null,
        ownerUsername: null,
        status: thread.flag,
        imageUrl: null,
      });
    }
    if (message) {
      return this.preview({
        type: targetType,
        id: message.id,
        label: this.truncate(message.text),
        subtitle: `Message in ${message.threadId}`,
        ownerUserId: message.senderId,
        ownerName: message.sender.name,
        ownerUsername: message.sender.username,
        status: 'sent',
        imageUrl: message.sender.avatar,
      });
    }
    if (marketplaceConversation) {
      return this.preview({
        type: targetType,
        id: marketplaceConversation.id,
        label: `Marketplace chat: ${marketplaceConversation.product.title}`,
        subtitle: `${marketplaceConversation.buyer.name} and ${marketplaceConversation.seller.name}`,
        ownerUserId: marketplaceConversation.sellerId,
        ownerName: marketplaceConversation.seller.name,
        ownerUsername: marketplaceConversation.seller.username,
        status: marketplaceConversation.status,
        imageUrl:
          this.extractFirstMediaUrl(marketplaceConversation.product.images) ??
          marketplaceConversation.seller.avatar,
      });
    }
    return this.fallbackPreview(targetType, id);
  }

  private async resolveLivePreview(id: string | null, targetType: string) {
    if (!id) {
      return this.fallbackPreview(targetType, id);
    }
    const stream = await this.prisma.liveStreamSession.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        category: true,
        status: true,
        previewImageUrl: true,
        hostId: true,
        host: { select: { name: true, username: true, avatar: true } },
      },
    });
    if (!stream) {
      return this.fallbackPreview(targetType, id);
    }
    return this.preview({
      type: targetType,
      id: stream.id,
      label: stream.title,
      subtitle: stream.category,
      ownerUserId: stream.hostId,
      ownerName: stream.host.name,
      ownerUsername: stream.host.username,
      status: stream.status,
      imageUrl: stream.previewImageUrl ?? stream.host.avatar,
    });
  }

  private resolveReportTargetType(row: ReportRecord) {
    return (
      normalizeReportTargetType(row.targetEntityType) ||
      inferReportTargetTypeFromId(row.targetEntityId) ||
      (row.targetUserId ? 'user' : 'unknown')
    );
  }

  private resolveReportTargetId(row: ReportRecord, targetType: string) {
    if (targetType === 'user') {
      return row.targetUserId ?? row.targetEntityId ?? row.id;
    }
    return row.targetEntityId ?? row.targetUserId ?? row.id;
  }

  private resolveTargetId(input: {
    targetEntityId?: string | null;
    targetUserId?: string | null;
    targetEntityType?: string | null;
  }) {
    const targetType = normalizeReportTargetType(input.targetEntityType);
    if (targetType === 'user') {
      return input.targetUserId ?? input.targetEntityId ?? null;
    }
    return input.targetEntityId ?? input.targetUserId ?? null;
  }

  private preview(input: {
    type: string;
    id: string;
    label: string;
    subtitle?: string | null;
    ownerUserId?: string | null;
    ownerName?: string | null;
    ownerUsername?: string | null;
    status?: string | null;
    imageUrl?: string | null;
  }): ReportTargetPreview {
    const option = getReportTargetOption(input.type);
    return {
      id: input.id,
      type: normalizeReportTargetType(input.type) || input.type,
      typeLabel: option?.label ?? this.labelize(input.type),
      label: input.label || input.id,
      subtitle: input.subtitle ?? null,
      ownerUserId: input.ownerUserId ?? null,
      ownerName: input.ownerName ?? null,
      ownerUsername: input.ownerUsername ?? null,
      status: input.status ?? null,
      imageUrl: input.imageUrl ?? null,
      routeName: option?.routeName ?? '/admin/reports',
      adminSection: option?.adminSection ?? 'reports',
      actionLabel: option?.actionLabel ?? 'Use target ID',
      exists: true,
    };
  }

  private fallbackPreview(type: string, id: string | null): ReportTargetPreview {
    const normalizedType = normalizeReportTargetType(type) || type || 'unknown';
    const option = getReportTargetOption(normalizedType);
    return {
      id,
      type: normalizedType,
      typeLabel: option?.label ?? this.labelize(normalizedType),
      label: id ? `${option?.label ?? this.labelize(normalizedType)} ${id}` : 'Missing report target',
      subtitle: 'Target details were not found.',
      ownerUserId: null,
      ownerName: null,
      ownerUsername: null,
      status: null,
      imageUrl: null,
      routeName: option?.routeName ?? '/admin/reports',
      adminSection: option?.adminSection ?? 'reports',
      actionLabel: option?.actionLabel ?? 'Use target ID',
      exists: false,
    };
  }

  private firstTrimmed(...values: Array<string | undefined | null>) {
    for (const value of values) {
      const trimmed = value?.trim();
      if (trimmed) {
        return trimmed;
      }
    }
    return undefined;
  }

  private extractFirstMediaUrl(value: unknown): string | null {
    if (typeof value === 'string') {
      return value.trim() || null;
    }
    if (!Array.isArray(value)) {
      return null;
    }
    for (const item of value) {
      if (typeof item === 'string' && item.trim()) {
        return item.trim();
      }
      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        const candidate =
          record.secureUrl ??
          record.secure_url ??
          record.url ??
          record.imageUrl ??
          record.image_url ??
          record.thumbnailUrl ??
          record.thumbnail_url ??
          record.path;
        if (typeof candidate === 'string' && candidate.trim()) {
          return candidate.trim();
        }
      }
    }
    return null;
  }

  private truncate(value: string, maxLength = 96) {
    const trimmed = value.trim();
    if (trimmed.length <= maxLength) {
      return trimmed;
    }
    return `${trimmed.slice(0, maxLength - 3).trim()}...`;
  }

  private labelize(value: string) {
    return value
      .replace(/[-_]+/g, ' ')
      .trim()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private formatAdminSection(value: string) {
    return this.labelize(value).replace('Support Operations', 'Support Operations');
  }
}
