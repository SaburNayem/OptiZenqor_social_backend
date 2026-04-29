import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateReelDto, UpdateReelDto } from '../dto/api.dto';
import { makeId } from '../common/id.util';
import { CoreDatabaseService } from './core-database.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class ReelsDatabaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  async getReels(userId?: string) {
    const reels = await this.prisma.reel.findMany({
      where: {
        userId: userId?.trim() || undefined,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(reels.map((row) => this.mapReel(row)));
  }

  async getReel(id: string) {
    const reel = await this.prisma.reel.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
    if (!reel) {
      throw new NotFoundException(`Reel ${id} not found`);
    }
    return this.mapReel(reel);
  }

  async createReel(userId: string, dto: CreateReelDto) {
    const reel = await this.prisma.reel.create({
      data: {
        id: makeId('reel'),
        userId,
        caption: dto.caption,
        audioName: dto.audioName,
        thumbnailUrl: dto.thumbnail,
        videoUrl: dto.videoUrl,
        textOverlays: (dto.textOverlays ?? []) as Prisma.InputJsonValue,
        subtitleEnabled: dto.subtitleEnabled ?? false,
        trimInfo: dto.trimInfo ?? null,
        remixEnabled: dto.remixEnabled ?? false,
        isDraft: dto.isDraft ?? false,
      },
    });
    return this.mapReel(reel);
  }

  async updateReel(id: string, patch: UpdateReelDto) {
    const existing = await this.prisma.reel.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Reel ${id} not found`);
    }

    const reel = await this.prisma.reel.update({
      where: { id },
      data: {
        caption: patch.caption ?? undefined,
        audioName: patch.audioName ?? undefined,
        thumbnailUrl: patch.thumbnail ?? undefined,
        videoUrl: patch.videoUrl ?? undefined,
        textOverlays: patch.textOverlays
          ? (patch.textOverlays as Prisma.InputJsonValue)
          : undefined,
        subtitleEnabled: patch.subtitleEnabled ?? undefined,
        trimInfo: patch.trimInfo ?? undefined,
        remixEnabled: patch.remixEnabled ?? undefined,
        isDraft: patch.isDraft ?? undefined,
        updatedAt: new Date(),
      },
    });
    return this.mapReel(reel);
  }

  async deleteReel(id: string) {
    const existing = await this.prisma.reel.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException(`Reel ${id} not found`);
    }

    const reel = await this.prisma.reel.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
    });
    const mapped = await this.mapReel(reel);
    return {
      success: true,
      message: 'Reel deleted successfully.',
      data: mapped,
      removed: mapped,
    };
  }

  async getReelComments(reelId: string) {
    await this.getReel(reelId);
    const comments = await this.prisma.reelComment.findMany({
      where: { reelId },
      orderBy: { createdAt: 'asc' },
    });
    return Promise.all(
      comments.map(async (row) => ({
        id: row.id,
        reelId: row.reelId,
        userId: row.userId,
        comment: row.comment,
        createdAt: row.createdAt.toISOString(),
        user: await this.coreDatabase.getUser(row.userId),
      })),
    );
  }

  async createReelComment(reelId: string, userId: string, comment: string) {
    await Promise.all([this.getReel(reelId), this.coreDatabase.getUser(userId)]);
    const created = await this.prisma.$transaction(async (tx) => {
      const row = await tx.reelComment.create({
        data: {
          id: makeId('comment'),
          reelId,
          userId,
          comment,
        },
      });
      await tx.reel.update({
        where: { id: reelId },
        data: {
          commentsCount: { increment: 1 },
          updatedAt: new Date(),
        },
      });
      return row;
    });
    return (await this.getReelComments(reelId)).find((item) => item.id === created.id);
  }

  async getReelReactions(reelId: string) {
    await this.getReel(reelId);
    const reactions = await this.prisma.reelReaction.findMany({
      where: { reelId },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(
      reactions.map(async (row) => ({
        reelId: row.reelId,
        userId: row.userId,
        reaction: row.reaction,
        createdAt: row.createdAt.toISOString(),
        user: await this.coreDatabase.getUser(row.userId),
      })),
    );
  }

  async reactToReel(reelId: string, userId: string, reaction: string) {
    await Promise.all([this.getReel(reelId), this.coreDatabase.getUser(userId)]);
    const existing = await this.prisma.reelReaction.findUnique({
      where: {
        reelId_userId: {
          reelId,
          userId,
        },
      },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.reelReaction.upsert({
        where: {
          reelId_userId: {
            reelId,
            userId,
          },
        },
        create: {
          reelId,
          userId,
          reaction,
        },
        update: {
          reaction,
          createdAt: new Date(),
        },
      });

      if (!existing) {
        await tx.reel.update({
          where: { id: reelId },
          data: {
            likesCount: { increment: 1 },
            updatedAt: new Date(),
          },
        });
      }
    });

    return this.getReelReactions(reelId);
  }

  private async mapReel(row: {
    id: string;
    userId: string;
    caption: string;
    audioName: string;
    thumbnailUrl: string;
    videoUrl: string;
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
    viewsCount: number;
    textOverlays: Prisma.JsonValue;
    subtitleEnabled: boolean;
    trimInfo: string | null;
    remixEnabled: boolean;
    isDraft: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: row.id,
      authorId: row.userId,
      caption: row.caption,
      audioName: row.audioName,
      thumbnail: row.thumbnailUrl,
      videoUrl: row.videoUrl,
      likes: row.likesCount ?? 0,
      comments: row.commentsCount ?? 0,
      shares: row.sharesCount ?? 0,
      viewCount: row.viewsCount ?? 0,
      textOverlays: Array.isArray(row.textOverlays) ? row.textOverlays : [],
      subtitleEnabled: row.subtitleEnabled,
      trimInfo: row.trimInfo,
      remixEnabled: row.remixEnabled,
      isDraft: row.isDraft,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      author: await this.coreDatabase.getUser(row.userId),
    };
  }
}
