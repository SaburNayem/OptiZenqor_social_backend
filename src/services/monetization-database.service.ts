import { Injectable } from '@nestjs/common';
import { Prisma, Subscription } from '@prisma/client';
import { makeId } from '../common/id.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class MonetizationDatabaseService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateWalletAccount(userId: string) {
    return this.prisma.walletAccount.upsert({
      where: { userId },
      create: {
        id: makeId('wallet'),
        userId,
      },
      update: {},
    });
  }

  async getWallet(userId: string) {
    const account = await this.getOrCreateWalletAccount(userId);
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      id: account.id,
      userId: account.userId,
      balance: Number(account.balance),
      currency: account.currency,
      status: account.status,
      transactions: transactions.map((item) => this.mapTransaction(item)),
      summary: {
        totalTransactions: transactions.length,
        completedTransactions: transactions.filter((item) => item.status === 'completed').length,
      },
    };
  }

  async getWalletTransactions(userId?: string) {
    const transactions = await this.prisma.walletTransaction.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return transactions.map((item) => this.mapTransaction(item));
  }

  async getPremiumPlans() {
    const plans = await this.prisma.premiumPlan.findMany({
      where: { isActive: true },
      orderBy: [{ price: 'asc' }, { createdAt: 'asc' }],
    });
    return plans.map((item) => this.mapPlan(item));
  }

  async getSubscriptions(userId?: string) {
    const subscriptions = await this.prisma.subscription.findMany({
      where: userId ? { userId } : undefined,
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
    return subscriptions.map((item) => this.mapSubscription(item));
  }

  async changeSubscriptionPlan(userId: string, planId: string) {
    const plan = await this.prisma.premiumPlan.findFirstOrThrow({
      where: { id: planId, isActive: true },
    });

    await this.prisma.subscription.updateMany({
      where: {
        userId,
        status: { in: ['active', 'trialing', 'current'] },
      },
      data: {
        status: 'changed',
        autoRenew: false,
        updatedAt: new Date(),
      },
    });

    const subscription = await this.prisma.subscription.create({
      data: {
        id: makeId('subscription'),
        userId,
        planId: plan.id,
        planCode: plan.code,
        provider: 'internal',
        providerRef: `manual_${Date.now()}`,
        status: 'active',
        autoRenew: true,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        metadata: {
          source: 'app_change_plan',
        },
      },
      include: { plan: true },
    });

    return this.mapSubscription(subscription);
  }

  async cancelSubscription(userId: string, subscriptionId?: string) {
    const subscription = await this.findUserSubscription(userId, subscriptionId);
    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'cancelled',
        autoRenew: false,
        updatedAt: new Date(),
      },
      include: { plan: true },
    });
    return this.mapSubscription(updated);
  }

  async renewSubscription(userId: string, subscriptionId?: string) {
    const subscription = await this.findUserSubscription(userId, subscriptionId);
    const updated = await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'active',
        autoRenew: true,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(),
      },
      include: { plan: true },
    });
    return this.mapSubscription(updated);
  }

  async getNotificationCampaigns() {
    const campaigns = await this.prisma.notificationCampaign.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return campaigns.map((item) => ({
      id: item.id,
      name: item.name,
      audience: item.audience,
      schedule: item.schedule,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  async createNotificationCampaign(input: {
    name: string;
    audience: string;
    schedule: string;
  }) {
    const campaign = await this.prisma.notificationCampaign.create({
      data: {
        id: makeId('campaign'),
        name: input.name,
        audience: input.audience,
        schedule: input.schedule,
        status: 'scheduled',
      },
    });

    return {
      id: campaign.id,
      name: campaign.name,
      audience: campaign.audience,
      schedule: campaign.schedule,
      status: campaign.status,
      createdAt: campaign.createdAt.toISOString(),
      updatedAt: campaign.updatedAt.toISOString(),
    };
  }

  private mapPlan(item: {
    id: string;
    code: string;
    name: string;
    description: string | null;
    price: Prisma.Decimal;
    currency: string;
    billingInterval: string;
    features: Prisma.JsonValue;
    isActive: boolean;
  }) {
    return {
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      currency: item.currency,
      billingInterval: item.billingInterval,
      features: Array.isArray(item.features) ? item.features : [],
      isActive: item.isActive,
    };
  }

  private mapSubscription(item: Subscription & { plan: any | null }) {
    return {
      id: item.id,
      userId: item.userId,
      planId: item.planId,
      planCode: item.planCode,
      provider: item.provider,
      providerRef: item.providerRef,
      status: item.status,
      currentPeriodEnd: item.currentPeriodEnd?.toISOString() ?? null,
      autoRenew: item.autoRenew,
      metadata:
        item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
          ? item.metadata
          : {},
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
      plan: item.plan ? this.mapPlan(item.plan) : null,
    };
  }

  private mapTransaction(item: {
    id: string;
    walletAccountId: string;
    userId: string;
    type: string;
    amount: Prisma.Decimal;
    currency: string;
    status: string;
    description: string | null;
    metadata: Prisma.JsonValue;
    createdAt: Date;
  }) {
    return {
      id: item.id,
      walletAccountId: item.walletAccountId,
      userId: item.userId,
      type: item.type,
      amount: Number(item.amount),
      currency: item.currency,
      status: item.status,
      description: item.description,
      metadata:
        item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
          ? item.metadata
          : {},
      createdAt: item.createdAt.toISOString(),
    };
  }

  private async findUserSubscription(userId: string, subscriptionId?: string) {
    return this.prisma.subscription.findFirstOrThrow({
      where: subscriptionId
        ? {
            id: subscriptionId,
            userId,
          }
        : {
            userId,
            status: { not: 'changed' },
          },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
