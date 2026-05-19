import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { NotificationCampaign, Prisma } from '@prisma/client';
import { makeId } from '../common/id.util';
import { FirebasePushResult, FirebasePushService } from './firebase-push.service';
import { PrismaService } from './prisma.service';

export type NotificationCampaignDeliveryResult = {
  campaignId: string;
  skipped: boolean;
  reason?: string;
  audience: string;
  recipientCount: number;
  inAppCreated: number;
  pushDeviceCount: number;
  firebase: FirebasePushResult;
  deliveredAt: string;
};

@Injectable()
export class NotificationDeliveryService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationDeliveryService.name);
  private readonly activeCampaigns = new Set<string>();
  private dueCampaignTimer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebasePush: FirebasePushService,
  ) {}

  onModuleInit() {
    if (!this.isSchedulerEnabled()) {
      return;
    }

    const intervalMs = this.resolveSchedulerIntervalMs();
    this.dueCampaignTimer = setInterval(() => {
      void this.dispatchDueCampaigns().catch((error) => {
        this.logger.warn(
          error instanceof Error ? error.message : 'Unable to dispatch due notification campaigns.',
        );
      });
    }, intervalMs);

    void this.dispatchDueCampaigns().catch((error) => {
      this.logger.warn(
        error instanceof Error ? error.message : 'Unable to dispatch due notification campaigns.',
      );
    });
  }

  onModuleDestroy() {
    if (this.dueCampaignTimer) {
      clearInterval(this.dueCampaignTimer);
    }
  }

  async dispatchDueCampaigns() {
    const now = new Date();
    const campaigns = await this.prisma.notificationCampaign.findMany({
      where: {
        status: 'scheduled',
        schedule: {
          lte: now.toISOString(),
        },
      },
      orderBy: { createdAt: 'asc' },
      take: 25,
    });

    const dueCampaigns = campaigns.filter((campaign) => {
      const scheduledAt = new Date(campaign.schedule);
      return !Number.isNaN(scheduledAt.getTime()) && scheduledAt <= now;
    });

    for (const campaign of dueCampaigns) {
      await this.deliverCampaign(campaign.id, {
        note: 'Automatically sent because the scheduled time arrived.',
      });
    }

    return {
      checked: campaigns.length,
      dispatched: dueCampaigns.length,
    };
  }

  async deliverCampaign(
    campaignId: string,
    options: { actorAdminId?: string; note?: string; force?: boolean } = {},
  ): Promise<NotificationCampaignDeliveryResult> {
    if (this.activeCampaigns.has(campaignId)) {
      return this.buildSkippedResult(campaignId, 'Campaign delivery is already running.');
    }

    this.activeCampaigns.add(campaignId);
    try {
      const campaign = await this.prisma.notificationCampaign.findUnique({
        where: { id: campaignId },
      });
      if (!campaign) {
        throw new NotFoundException(`Notification campaign ${campaignId} not found.`);
      }

      const previousSend = await this.prisma.notificationCampaignActionHistory.findFirst({
        where: {
          campaignId,
          action: 'send',
        },
        orderBy: { createdAt: 'desc' },
      });
      if (previousSend && !options.force) {
        return this.buildSkippedResult(campaignId, 'Campaign was already sent.', campaign);
      }

      await this.prisma.notificationCampaign.update({
        where: { id: campaign.id },
        data: {
          status: 'sending',
          updatedAt: new Date(),
        },
      });

      const users = await this.resolveCampaignRecipients(campaign.audience);
      const deliveredAt = new Date();
      const title = this.resolveCampaignTitle(campaign);
      const body = this.resolveCampaignBody(campaign);
      const notificationMetadata = {
        campaignId: campaign.id,
        campaignName: campaign.name,
        audience: campaign.audience,
        source: 'admin_dashboard',
      };

      let inAppCreated = 0;
      if (users.length > 0) {
        const inAppResult = await this.prisma.appNotification.createMany({
          data: users.map((user) => ({
            id: makeId('notification'),
            recipientId: user.id,
            title,
            body,
            createdAt: deliveredAt,
            read: false,
            type: 'system',
            routeName: '/notifications',
            entityId: campaign.id,
            metadata: notificationMetadata as Prisma.InputJsonValue,
          })),
        });
        inAppCreated = inAppResult.count;
      }

      const devices =
        users.length > 0
          ? await this.prisma.pushDeviceToken.findMany({
              where: {
                userId: { in: users.map((user) => user.id) },
                isActive: true,
              },
              select: {
                token: true,
                userId: true,
              },
            })
          : [];

      const firebase = await this.firebasePush.sendToTokens(
        devices.map((device) => device.token),
        { title, body },
        {
          campaignId: campaign.id,
          routeName: '/notifications',
          entityId: campaign.id,
          type: 'system',
          audience: campaign.audience,
        },
      );

      if (firebase.invalidTokens.length > 0) {
        await this.prisma.pushDeviceToken.updateMany({
          where: { token: { in: firebase.invalidTokens } },
          data: {
            isActive: false,
            updatedAt: new Date(),
          },
        });
      }

      const deliveryResult: NotificationCampaignDeliveryResult = {
        campaignId: campaign.id,
        skipped: false,
        audience: campaign.audience,
        recipientCount: users.length,
        inAppCreated,
        pushDeviceCount: devices.length,
        firebase,
        deliveredAt: deliveredAt.toISOString(),
      };

      await this.prisma.notificationCampaign.update({
        where: { id: campaign.id },
        data: {
          status: 'sent',
          updatedAt: new Date(),
        },
      });

      await this.prisma.notificationCampaignActionHistory.create({
        data: {
          id: makeId('campaign_action'),
          campaignId: campaign.id,
          actorAdminId: options.actorAdminId ?? null,
          action: 'send',
          note: options.note?.trim() || null,
          payload: deliveryResult as unknown as Prisma.InputJsonValue,
        },
      });

      return deliveryResult;
    } finally {
      this.activeCampaigns.delete(campaignId);
    }
  }

  private async resolveCampaignRecipients(audience: string) {
    const where = this.buildAudienceWhere(audience);
    return this.prisma.appUser.findMany({
      where,
      select: { id: true },
    });
  }

  private buildAudienceWhere(audience: string): Prisma.AppUserWhereInput {
    const normalized = audience.trim().toLowerCase();
    const baseWhere: Prisma.AppUserWhereInput = {
      blocked: false,
    };

    switch (normalized) {
      case 'verified':
      case 'verified_users':
      case 'verified users':
        return {
          ...baseWhere,
          emailVerified: true,
        };
      case 'premium':
      case 'premium_users':
      case 'premium subscribers':
        return {
          ...baseWhere,
          subscriptions: {
            some: {
              status: 'active',
            },
          },
        };
      case 'creator':
      case 'creators':
        return {
          ...baseWhere,
          OR: [
            { role: { equals: 'Creator', mode: 'insensitive' } },
            { profileType: { equals: 'creator', mode: 'insensitive' } },
          ],
        };
      case 'all':
      case 'all_users':
      case 'all users':
      default:
        return baseWhere;
    }
  }

  private buildSkippedResult(
    campaignId: string,
    reason: string,
    campaign?: NotificationCampaign,
  ): NotificationCampaignDeliveryResult {
    return {
      campaignId,
      skipped: true,
      reason,
      audience: campaign?.audience ?? '',
      recipientCount: 0,
      inAppCreated: 0,
      pushDeviceCount: 0,
      firebase: {
        configured: this.firebasePush.isConfigured(),
        attempted: 0,
        successCount: 0,
        failureCount: 0,
        invalidTokens: [],
        errors: [],
      },
      deliveredAt: new Date().toISOString(),
    };
  }

  private resolveCampaignTitle(campaign: NotificationCampaign) {
    return campaign.name.trim() || 'New notification';
  }

  private resolveCampaignBody(_campaign: NotificationCampaign) {
    return 'Open the app to view this update.';
  }

  private isSchedulerEnabled() {
    const configured = process.env.NOTIFICATION_SCHEDULER_ENABLED?.trim().toLowerCase();
    if (configured === 'false' || configured === '0' || configured === 'off') {
      return false;
    }
    if (configured === 'true' || configured === '1' || configured === 'on') {
      return true;
    }
    return !process.env.VERCEL;
  }

  private resolveSchedulerIntervalMs() {
    const configured = Number(process.env.NOTIFICATION_CAMPAIGN_POLL_MS ?? 60_000);
    return Number.isFinite(configured) && configured >= 10_000 ? configured : 60_000;
  }
}
