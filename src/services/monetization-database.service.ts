import { Injectable, OnModuleInit } from '@nestjs/common';
import { Prisma, Subscription } from '@prisma/client';
import { makeId } from '../common/id.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class MonetizationDatabaseService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit() {
    if ((process.env.CORE_DB_SEED ?? 'false') === 'true') {
      await this.ensureDevelopmentSeed();
    }
  }

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

  async ensureDevelopmentSeed() {
    const [planCount, transactionCount] = await Promise.all([
      this.prisma.premiumPlan.count(),
      this.prisma.walletTransaction.count(),
    ]);

    if (planCount === 0) {
      await this.prisma.premiumPlan.createMany({
        data: [
          {
            id: 'plan_monthly',
            code: 'monthly',
            name: 'Monthly Premium',
            description: 'Monthly access to premium features.',
            price: new Prisma.Decimal(299),
            currency: 'BDT',
            billingInterval: 'monthly',
            features: ['ad-light feed', 'creator tools', 'priority support'] as unknown as Prisma.InputJsonValue,
            isActive: true,
          },
          {
            id: 'plan_yearly',
            code: 'yearly',
            name: 'Yearly Premium',
            description: 'Yearly access to premium features.',
            price: new Prisma.Decimal(2999),
            currency: 'BDT',
            billingInterval: 'yearly',
            features: ['ad-light feed', 'creator tools', 'priority support'] as unknown as Prisma.InputJsonValue,
            isActive: true,
          },
        ],
      });
    }

    if (transactionCount === 0) {
      const firstUser = await this.prisma.appUser.findFirst({
        orderBy: { createdAt: 'asc' },
      });

      if (firstUser) {
        const wallet = await this.getOrCreateWalletAccount(firstUser.id);
        await this.prisma.walletTransaction.create({
          data: {
            id: makeId('txn'),
            walletAccountId: wallet.id,
            userId: firstUser.id,
            type: 'credit',
            amount: new Prisma.Decimal(500),
            currency: 'BDT',
            status: 'completed',
            description: 'Welcome wallet credit',
            metadata: { source: 'development_seed' },
          },
        });
        await this.prisma.walletAccount.update({
          where: { id: wallet.id },
          data: { balance: new Prisma.Decimal(500) },
        });
      }
    }
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
}
