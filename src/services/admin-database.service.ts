import {
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { makeId } from '../common/id.util';
import { CoreDatabaseService } from './core-database.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class AdminDatabaseService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  async onModuleInit() {
    await this.ensureDefaultAdmin();
  }

  async loginAdmin(email: string, password: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: email.trim().toLowerCase() },
    });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    const valid = await argon2.verify(admin.passwordHash, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid admin password.');
    }

    const session = await this.prisma.adminSession.create({
      data: {
        id: makeId('session'),
        adminId: admin.id,
        accessToken: `admin_access_${randomUUID().replace(/-/g, '')}`,
        refreshToken: `admin_refresh_${randomUUID().replace(/-/g, '')}`,
        device: 'Dashboard session',
        ipAddress: '0.0.0.0',
        current: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });

    await this.createAuditLog({
      actorAdminId: admin.id,
      action: 'admin.login',
      entityType: 'admin_session',
      entityId: session.id,
      metadata: {
        email: admin.email,
      },
    });

    return {
      success: true,
      message: 'Admin login successful.',
      data: {
        token: session.accessToken,
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        session: this.mapAdminSession(session, admin),
      },
    };
  }

  async refreshAdminSession(refreshToken: string) {
    const session = await this.prisma.adminSession.findUnique({
      where: { refreshToken: refreshToken.trim() },
      include: { admin: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid or expired admin refresh token.');
    }

    const refreshed = await this.prisma.adminSession.update({
      where: { id: session.id },
      data: {
        accessToken: `admin_access_${randomUUID().replace(/-/g, '')}`,
        refreshToken: `admin_refresh_${randomUUID().replace(/-/g, '')}`,
        lastActive: new Date(),
        current: true,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
      include: { admin: true },
    });

    await this.createAuditLog({
      actorAdminId: refreshed.adminId,
      action: 'admin.session.refresh',
      entityType: 'admin_session',
      entityId: refreshed.id,
      metadata: {
        email: refreshed.admin.email,
      },
    });

    return {
      success: true,
      message: 'Admin session refreshed successfully.',
      data: {
        token: refreshed.accessToken,
        accessToken: refreshed.accessToken,
        refreshToken: refreshed.refreshToken,
        session: this.mapAdminSession(refreshed, refreshed.admin),
      },
    };
  }

  async logoutAdmin(accessToken?: string) {
    const session = await this.resolveAdminSession(accessToken);
    const revoked = await this.prisma.adminSession.update({
      where: { id: session.id },
      data: {
        current: false,
        revokedAt: new Date(),
        lastActive: new Date(),
      },
      include: { admin: true },
    });

    await this.createAuditLog({
      actorAdminId: revoked.adminId,
      action: 'admin.logout',
      entityType: 'admin_session',
      entityId: revoked.id,
      metadata: {
        email: revoked.admin.email,
      },
    });

    return {
      success: true,
      message: 'Admin logout successful.',
      data: {
        sessionId: revoked.id,
        loggedOut: true,
      },
    };
  }

  async getAdminMe(accessToken?: string) {
    const session = await this.resolveAdminSession(accessToken);
    return this.mapAdminSession(session, session.admin);
  }

  async getAuthenticatedAdmin(accessToken?: string) {
    const session = await this.resolveAdminSession(accessToken);
    return this.mapAdminSession(session, session.admin);
  }

  async getAdminSessions(actorAdminId: string) {
    const actor = await this.getAdminUserById(actorAdminId);
    const canViewAllSessions = this.hasAdminRole(actor.role, ['Super Admin', 'Operations Admin']);
    const sessions = await this.prisma.adminSession.findMany({
      where: canViewAllSessions ? undefined : { adminId: actorAdminId },
      include: { admin: true },
      orderBy: { createdAt: 'desc' },
    });
    return sessions.map((session) => this.mapAdminSession(session, session.admin));
  }

  async revokeAdminSession(id: string, actorAdminId?: string) {
    const existing = await this.prisma.adminSession.findUnique({
      where: { id },
      include: { admin: true },
    });
    if (!existing) {
      throw new NotFoundException(`Admin session ${id} not found`);
    }

    const session = await this.prisma.adminSession.update({
      where: { id },
      data: {
        current: false,
        revokedAt: new Date(),
        lastActive: new Date(),
      },
      include: { admin: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'admin.session.revoke',
      entityType: 'admin_session',
      entityId: session.id,
      metadata: {
        email: session.admin.email,
      },
    });

    return {
      success: true,
      message: 'Admin session revoked successfully.',
      data: this.mapAdminSession(session, session.admin),
    };
  }

  async getVerificationQueue() {
    const users = await this.prisma.appUser.findMany({
      where: {
        OR: [
          { verification: { in: ['pending', 'rejected', 'approved'] } },
          { role: { in: ['Creator', 'Business', 'Seller', 'Recruiter'] } },
        ],
      },
      include: { settings: true },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });

    return users.map((user) => {
      const settings = this.readObject(user.settings?.settings);
      const verification = this.readObject(settings.verificationRequest);
      const selectedDocuments = this.readStringArray(verification.selectedDocuments);
      const requiredDocuments = this.readStringArray(verification.requiredDocuments);
      const status = this.normalizeVerificationStatus(
        this.readString(verification.status) ?? user.verification,
      );

      return {
        id: user.id,
        userId: user.id,
        name: user.name,
        roleType: user.role,
        verificationState: status,
        documentType: selectedDocuments[0] ?? requiredDocuments[0] ?? 'Documents pending',
        submittedAt:
          this.readString(verification.submittedAt) ?? user.updatedAt.toISOString(),
        notes: this.readStringArray(verification.notes),
        history: [
          `Profile type: ${user.role}`,
          `Email verified: ${user.emailVerified ? 'yes' : 'no'}`,
        ],
        decision:
          status === 'approved'
            ? 'approved'
            : status === 'rejected'
              ? 'rejected'
              : null,
      };
    });
  }

  async decideVerification(
    userId: string,
    decision: 'approved' | 'rejected',
    note?: string,
    actorAdminId?: string,
  ) {
    const user = await this.prisma.appUser.findUnique({
      where: { id: userId },
      include: { settings: true },
    });
    if (!user) {
      throw new NotFoundException(`Verification ${userId} not found`);
    }

    const currentSettings = this.readObject(user.settings?.settings);
    const verification = this.readObject(currentSettings.verificationRequest);
    const nextVerification = {
      ...verification,
      status: decision,
      reason:
        decision === 'approved'
          ? 'Approved. Verification badge is ready to appear on your profile.'
          : note?.trim() || 'Rejected. Update your documents and try again.',
      reviewedAt: new Date().toISOString(),
      notes: [
        ...this.readStringArray(verification.notes),
        note?.trim() || `Decision applied: ${decision}`,
      ],
    };

    await this.prisma.$transaction([
      this.prisma.appUser.update({
        where: { id: userId },
        data: {
          verification: decision,
          updatedAt: new Date(),
        },
      }),
      this.prisma.userSettings.upsert({
        where: { userId },
        create: {
          userId,
          settings: {
            ...currentSettings,
            verificationRequest: nextVerification,
          } as Prisma.InputJsonValue,
        },
        update: {
          settings: {
            ...currentSettings,
            verificationRequest: nextVerification,
          } as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      }),
    ]);

    await this.createAuditLog({
      actorAdminId,
      action: 'verification.review',
      entityType: 'user',
      entityId: userId,
      metadata: { decision, note: note?.trim() || null },
    });

    return {
      id: userId,
      decision,
      verificationState: decision,
      note: note?.trim() || null,
    };
  }

  async getModerationCases(targetType?: string) {
    const items = await this.prisma.moderationCase.findMany({
      where: targetType ? { targetType } : undefined,
      include: { assignedAdmin: true },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
    return items.map((item) => this.mapModerationCase(item));
  }

  async updateModerationCase(id: string, action: string, actorAdminId?: string) {
    const existing = await this.prisma.moderationCase.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Moderation case ${id} not found`);
    }

    const history = this.readStringArray(existing.history);
    const enforcementActions = this.readStringArray(existing.enforcementActions);
    const status = action === 'close' ? 'resolved' : action === 'escalate' ? 'escalated' : 'updated';

    const updated = await this.prisma.moderationCase.update({
      where: { id },
      data: {
        status,
        history: [
          ...history,
          `Action applied: ${action} at ${new Date().toISOString()}`,
        ] as Prisma.InputJsonValue,
        enforcementActions: [...enforcementActions, action] as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
      include: { assignedAdmin: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'moderation.case.update',
      entityType: 'moderation_case',
      entityId: updated.id,
      metadata: { action },
    });

    return this.mapModerationCase(updated);
  }

  async updateChatModerationCase(
    id: string,
    patch: { freeze?: boolean; restrictParticipant?: string },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.moderationCase.findUnique({
      where: { id },
    });
    if (!existing || existing.targetType !== 'chat_thread') {
      throw new NotFoundException(`Chat moderation case ${id} not found`);
    }

    const metadata = this.readObject(existing.metadata);
    const restrictedParticipants = this.readStringArray(metadata.restrictedParticipants);
    const updated = await this.prisma.moderationCase.update({
      where: { id },
      data: {
        metadata: {
          ...metadata,
          frozen: typeof patch.freeze === 'boolean' ? patch.freeze : metadata.frozen ?? false,
          restrictedParticipants: patch.restrictParticipant
            ? [...new Set([...restrictedParticipants, patch.restrictParticipant])]
            : restrictedParticipants,
        } as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
      include: { assignedAdmin: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'moderation.chat.update',
      entityType: 'moderation_case',
      entityId: updated.id,
      metadata: patch,
    });

    return this.mapModerationCase(updated);
  }

  async getCampaigns() {
    const rows = await this.prisma.notificationCampaign.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      audience: row.audience,
      segmentId: row.audience,
      schedule: row.schedule,
      status: row.status,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    }));
  }

  async createCampaign(input: {
    name: string;
    audience: string;
    segmentId: string;
    schedule: string;
  }, actorAdminId?: string) {
    const item = await this.prisma.notificationCampaign.create({
      data: {
        id: makeId('campaign'),
        name: input.name.trim(),
        audience: input.segmentId?.trim() || input.audience.trim(),
        schedule: input.schedule.trim(),
        status: 'scheduled',
      },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'campaign.create',
      entityType: 'notification_campaign',
      entityId: item.id,
      metadata: input,
    });

    return {
      id: item.id,
      name: item.name,
      audience: input.audience,
      segmentId: item.audience,
      schedule: item.schedule,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
    };
  }

  async getAudienceSegments() {
    const [totalUsers, verifiedUsers, creators, businesses, premiumSubscribers] =
      await Promise.all([
        this.prisma.appUser.count(),
        this.prisma.appUser.count({ where: { emailVerified: true } }),
        this.prisma.appUser.count({ where: { role: 'Creator' } }),
        this.prisma.appUser.count({ where: { role: 'Business' } }),
        this.prisma.subscription.count({ where: { status: 'active' } }),
      ]);

    return [
      { id: 'all_users', name: 'All users', size: totalUsers },
      { id: 'verified_users', name: 'Verified users', size: verifiedUsers },
      { id: 'creators', name: 'Creators', size: creators },
      { id: 'businesses', name: 'Businesses', size: businesses },
      { id: 'premium', name: 'Premium subscribers', size: premiumSubscribers },
    ];
  }

  async getAnalyticsPipeline() {
    const [users, posts, reports, revenue, eventsRsvp] = await Promise.all([
      this.prisma.appUser.count(),
      this.prisma.appPost.count({ where: { deletedAt: null } }),
      this.prisma.userReport.count(),
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.eventRsvp.count({ where: { status: 'going' } }),
    ]);

    return {
      kpis: {
        userGrowth: String(users),
        contentOutput: String(posts),
        moderationLoad: String(reports),
        revenue: `$${Number(revenue._sum.amount ?? 0).toFixed(2)}`,
        eventsRsvp: String(eventsRsvp),
      },
      snapshots: [],
      leaderboards: [],
      exportJobs: [],
    };
  }

  getPermissionMatrix() {
    return {
      roles: [
        'Super Admin',
        'Operations Admin',
        'Content Moderator',
        'Finance Admin',
        'Support Admin',
        'Analytics Viewer',
      ],
      moduleScopes: {
        dashboard: ['view'],
        users: ['view', 'verify', 'suspend'],
        content: ['view', 'hide', 'feature'],
        reports: ['view', 'assign', 'resolve', 'escalate'],
        monetization: ['view', 'hold', 'approve'],
        settings: ['view', 'edit'],
        audit: ['view', 'export'],
      },
    };
  }

  async getOperationalSettings() {
    const items = await this.prisma.adminOperationalSetting.findMany({
      orderBy: { key: 'asc' },
    });
    if (items.length === 0) {
      return {};
    }
    return items.reduce<Record<string, unknown>>((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});
  }

  async updateOperationalSettings(patch: Record<string, unknown>, actorAdminId?: string) {
    const entries = Object.entries(patch);
    if (entries.length === 0) {
      throw new ConflictException('At least one operational setting is required.');
    }

    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.adminOperationalSetting.upsert({
          where: { key },
          create: {
            key,
            value: this.normalizeJsonValue(value),
          },
          update: {
            value: this.normalizeJsonValue(value),
            updatedAt: new Date(),
          },
        }),
      ),
    );

    await this.createAuditLog({
      actorAdminId,
      action: 'operational_settings.update',
      entityType: 'admin_operational_settings',
      metadata: patch,
    });

    return this.getOperationalSettings();
  }

  async getAuditLogs() {
    const rows = await this.prisma.adminAuditLog.findMany({
      include: { actorAdmin: true },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return rows.map((row) => ({
      id: row.id,
      actorAdminId: row.actorAdminId,
      actorName: row.actorAdmin?.name ?? null,
      action: row.action,
      entityType: row.entityType,
      entityId: row.entityId,
      metadata: this.readObject(row.metadata),
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async getContentOperations() {
    const [posts, reels, stories, comments] = await Promise.all([
      this.prisma.appPost.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.reel.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.story.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      this.prisma.appPostComment.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
    ]);

    return {
      posts,
      reels,
      stories,
      comments,
    };
  }

  async getCommerceRisk() {
    const [orders, offers] = await Promise.all([
      this.prisma.marketplaceOrder.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.marketplaceOffer.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return {
      disputes: orders.filter((item) => item.status !== 'completed'),
      payoutReviews: offers.filter((item) => item.status === 'pending'),
    };
  }

  async getSupportOperations() {
    const [tickets, actions] = await Promise.all([
      this.prisma.supportTicket.findMany({
        orderBy: { updatedAt: 'desc' },
        take: 100,
      }),
      this.prisma.adminAuditLog.findMany({
        where: { entityType: 'support_ticket' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    return {
      tickets,
      actions: actions.map((row) => ({
        id: row.id,
        action: row.action,
        entityId: row.entityId,
        metadata: this.readObject(row.metadata),
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async getDashboardOverview() {
    const [
      userCount,
      activeUserCount,
      postCount,
      reelCount,
      storyCount,
      reportCount,
      openReportCount,
      supportOpenCount,
      moderationOpenCount,
      activeSubscriptions,
      revenueAggregate,
    ] = await Promise.all([
      this.prisma.appUser.count(),
      this.prisma.appUser.count({ where: { blocked: false } }),
      this.prisma.appPost.count({ where: { deletedAt: null } }),
      this.prisma.reel.count({ where: { deletedAt: null } }),
      this.prisma.story.count({ where: { deletedAt: null } }),
      this.prisma.userReport.count(),
      this.prisma.userReport.count({ where: { status: { not: 'resolved' } } }),
      this.prisma.supportTicket.count({ where: { status: 'open' } }),
      this.prisma.moderationCase.count({ where: { status: { not: 'resolved' } } }),
      this.prisma.subscription.count({ where: { status: 'active' } }),
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
      }),
    ]);

    return {
      totals: {
        users: userCount,
        activeUsers: activeUserCount,
        posts: postCount,
        reels: reelCount,
        stories: storyCount,
        reports: reportCount,
        openReports: openReportCount,
        supportTickets: supportOpenCount,
        moderationCases: moderationOpenCount,
        activeSubscriptions,
        revenue: Number(revenueAggregate._sum.amount ?? 0),
      },
      health: {
        moderationQueue: moderationOpenCount,
        supportQueue: supportOpenCount,
        reportQueue: openReportCount,
      },
    };
  }

  async getDashboardUsers() {
    const [recentUsers, roleCounts, verificationCounts] = await Promise.all([
      this.prisma.appUser.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.appUser.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      this.prisma.appUser.groupBy({
        by: ['verification'],
        _count: { verification: true },
      }),
    ]);

    return {
      recentUsers: recentUsers.map((user) => this.mapAdminAppUser(user)),
      roleBreakdown: roleCounts.map((row) => ({
        role: row.role,
        count: row._count.role,
      })),
      verificationBreakdown: verificationCounts.map((row) => ({
        status: row.verification,
        count: row._count.verification,
      })),
    };
  }

  async getDashboardContent() {
    const [recentPosts, recentReels, recentStories] = await Promise.all([
      this.prisma.appPost.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.reel.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.story.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      recentPosts,
      recentReels,
      recentStories,
      totals: {
        posts: await this.prisma.appPost.count({ where: { deletedAt: null } }),
        reels: await this.prisma.reel.count({ where: { deletedAt: null } }),
        stories: await this.prisma.story.count({ where: { deletedAt: null } }),
      },
    };
  }

  async getDashboardReports() {
    const [reports, submittedCount, reviewingCount, resolvedCount] = await Promise.all([
      this.prisma.userReport.findMany({
        include: {
          reporter: true,
          targetUser: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 12,
      }),
      this.prisma.userReport.count({ where: { status: 'submitted' } }),
      this.prisma.userReport.count({ where: { status: 'reviewing' } }),
      this.prisma.userReport.count({ where: { status: 'resolved' } }),
    ]);

    return {
      recentReports: reports.map((report) => ({
        id: report.id,
        status: report.status,
        reason: report.reason,
        reporterName: report.reporter.name,
        targetUserName: report.targetUser?.name ?? null,
        targetEntityId: report.targetEntityId,
        targetEntityType: report.targetEntityType,
        createdAt: report.createdAt.toISOString(),
      })),
      totals: {
        submitted: submittedCount,
        reviewing: reviewingCount,
        resolved: resolvedCount,
      },
    };
  }

  async getDashboardRevenue() {
    const [wallet, subscriptions, plans, revenueAggregate, completedTransactions, activeSubscriptions] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.prisma.premiumPlan.findMany({
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.walletTransaction.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.walletTransaction.count({ where: { status: 'completed' } }),
      this.prisma.subscription.count({ where: { status: 'active' } }),
    ]);

    return {
      totalRevenue: Number(revenueAggregate._sum.amount ?? 0),
      completedTransactions,
      activeSubscriptions,
      recentTransactions: wallet,
      subscriptions,
      plans,
    };
  }

  async getDashboardModeration() {
    const [cases, verificationQueue] = await Promise.all([
      this.prisma.moderationCase.findMany({
        include: { assignedAdmin: true },
        orderBy: { updatedAt: 'desc' },
        take: 12,
      }),
      this.getVerificationQueue(),
    ]);

    return {
      moderationCases: cases.map((item) => this.mapModerationCase(item)),
      verificationQueue: verificationQueue.slice(0, 12),
    };
  }

  async getDashboardSummary() {
    const [
      users,
      posts,
      reports,
      activeSubscriptions,
      openSupportTickets,
      moderationCases,
    ] = await Promise.all([
      this.prisma.appUser.count(),
      this.prisma.appPost.count({ where: { deletedAt: null } }),
      this.prisma.userReport.count(),
      this.prisma.subscription.count({ where: { status: 'active' } }),
      this.prisma.supportTicket.count({ where: { status: 'open' } }),
      this.prisma.moderationCase.count({ where: { status: { not: 'resolved' } } }),
    ]);

    return {
      users,
      posts,
      reports,
      activeSubscriptions,
      openSupportTickets,
      moderationCases,
    };
  }

  async queryAdminUsers(query: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const order = query.order === 'asc' ? 'asc' : 'desc';
    const sortField = this.resolveAdminUserSortField(query.sort);
    const where: Prisma.AppUserWhereInput = {
      ...(query.role?.trim() ? { role: query.role.trim() } : {}),
      ...(query.status?.trim() ? { status: query.status.trim() } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { name: { contains: query.search.trim(), mode: 'insensitive' } },
              { username: { contains: query.search.trim(), mode: 'insensitive' } },
              { email: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.appUser.count({ where }),
      this.prisma.appUser.findMany({
        where,
        orderBy: { [sortField]: order },
        skip,
        take: limit,
      }),
    ]);

    return this.wrapPaginated(
      items.map((user) => this.mapAdminAppUser(user)),
      page,
      limit,
      total,
    );
  }

  async updateAdminUser(
    userId: string,
    patch: {
      role?: string;
      status?: string;
      verification?: string;
      blocked?: boolean;
      note?: string;
    },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.appUser.findUnique({
      where: { id: userId },
    });
    if (!existing) {
      throw new NotFoundException(`User ${userId} not found.`);
    }

    const updated = await this.prisma.appUser.update({
      where: { id: userId },
      data: {
        role: patch.role?.trim() || undefined,
        status: patch.status?.trim() || undefined,
        verification: patch.verification?.trim() || undefined,
        blocked: patch.blocked ?? undefined,
        note: patch.note?.trim() || undefined,
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'admin.user.update',
      entityType: 'user',
      entityId: userId,
      metadata: patch,
    });

    return this.mapAdminAppUser(updated);
  }

  async queryAdminContent(query: {
    page?: number;
    limit?: number;
    targetType?: 'post' | 'reel' | 'story';
    status?: string;
    search?: string;
  }) {
    const targetType = query.targetType?.trim().toLowerCase() as
      | 'post'
      | 'reel'
      | 'story'
      | undefined;
    if (targetType === 'reel') {
      return this.queryReels(query);
    }
    if (targetType === 'story') {
      return this.queryStories(query);
    }
    return this.queryPosts(query);
  }

  async moderateContent(
    targetType: 'post' | 'reel' | 'story',
    id: string,
    patch: { status?: string; remove?: boolean; note?: string },
    actorAdminId?: string,
  ) {
    const normalizedType = targetType.trim().toLowerCase() as 'post' | 'reel' | 'story';
    const status = patch.remove ? 'Removed' : patch.status?.trim() || undefined;
    const deletedAt = patch.remove ? new Date() : undefined;

    if (normalizedType === 'post') {
      await this.prisma.appPost.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(deletedAt ? { deletedAt } : {}),
        },
      });
    } else if (normalizedType === 'reel') {
      await this.prisma.reel.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(deletedAt ? { deletedAt } : {}),
        },
      });
    } else {
      await this.prisma.story.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(deletedAt ? { deletedAt } : {}),
        },
      });
    }

    await this.createAuditLog({
      actorAdminId,
      action: 'admin.content.moderate',
      entityType: normalizedType,
      entityId: id,
      metadata: patch,
    });

    return this.queryAdminContent({
      page: 1,
      limit: 1,
      targetType: normalizedType,
      search: id,
    });
  }

  async queryReports(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.UserReportWhereInput = {
      ...(query.status?.trim() ? { status: query.status.trim() } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { reason: { contains: query.search.trim(), mode: 'insensitive' } },
              { details: { contains: query.search.trim(), mode: 'insensitive' } },
              { targetEntityId: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.userReport.count({ where }),
      this.prisma.userReport.findMany({
        where,
        include: {
          reporter: true,
          targetUser: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return this.wrapPaginated(
      items.map((item) => ({
        id: item.id,
        reporterUserId: item.reporterUserId,
        reporterName: item.reporter.name,
        targetUserId: item.targetUserId,
        targetUserName: item.targetUser?.name ?? null,
        targetEntityId: item.targetEntityId,
        targetEntityType: item.targetEntityType,
        reason: item.reason,
        details: item.details,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      page,
      limit,
      total,
    );
  }

  async updateReport(
    id: string,
    patch: { status: string; note?: string },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.userReport.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Report ${id} not found.`);
    }

    const updated = await this.prisma.userReport.update({
      where: { id },
      data: {
        status: patch.status,
        details: patch.note?.trim() || existing.details,
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'admin.report.update',
      entityType: 'user_report',
      entityId: id,
      metadata: patch,
    });

    return updated;
  }

  async queryAuditLogs(query: {
    page?: number;
    limit?: number;
    entityType?: string;
    action?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.AdminAuditLogWhereInput = {
      ...(query.entityType?.trim() ? { entityType: query.entityType.trim() } : {}),
      ...(query.action?.trim()
        ? { action: { contains: query.action.trim(), mode: 'insensitive' } }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.adminAuditLog.count({ where }),
      this.prisma.adminAuditLog.findMany({
        where,
        include: { actorAdmin: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return this.wrapPaginated(
      rows.map((row) => ({
        id: row.id,
        actorAdminId: row.actorAdminId,
        actorName: row.actorAdmin?.name ?? null,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        metadata: this.readObject(row.metadata),
        createdAt: row.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
    );
  }

  async queryAdminMarketplace(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.MarketplaceProductWhereInput = {
      ...(query.status?.trim() ? { status: query.status.trim() } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { title: { contains: query.search.trim(), mode: 'insensitive' } },
              { description: { contains: query.search.trim(), mode: 'insensitive' } },
              { category: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.marketplaceProduct.count({ where }),
      this.prisma.marketplaceProduct.findMany({
        where,
        include: { seller: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return this.wrapPaginated(
      items.map((item) => ({
        id: item.id,
        title: item.title,
        category: item.category,
        price: Number(item.price),
        currency: item.currency,
        status: item.status,
        stock: item.stock,
        sellerName: item.seller.name,
        sellerId: item.sellerId,
        views: item.views,
        watchers: item.watchers,
        createdAt: item.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
    );
  }

  async queryAdminJobs(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.JobWhereInput = {
      ...(query.status?.trim() ? { status: query.status.trim() } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { title: { contains: query.search.trim(), mode: 'insensitive' } },
              { company: { contains: query.search.trim(), mode: 'insensitive' } },
              { description: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.job.count({ where }),
      this.prisma.job.findMany({
        where,
        include: { recruiter: true, applications: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return this.wrapPaginated(
      items.map((item) => ({
        id: item.id,
        title: item.title,
        company: item.company,
        status: item.status,
        type: item.type,
        recruiterName: item.recruiter.name,
        recruiterId: item.recruiterId,
        applications: item.applications.length,
        createdAt: item.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
    );
  }

  async queryAdminEvents(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.EventWhereInput = {
      ...(query.status?.trim() ? { status: query.status.trim() } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { title: { contains: query.search.trim(), mode: 'insensitive' } },
              { organizerName: { contains: query.search.trim(), mode: 'insensitive' } },
              { location: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.event.count({ where }),
      this.prisma.event.findMany({
        where,
        include: { organizer: true, rsvps: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return this.wrapPaginated(
      items.map((item) => ({
        id: item.id,
        title: item.title,
        organizerName: item.organizer.name,
        organizerId: item.organizerId,
        status: item.status,
        location: item.location,
        participants: item.rsvps.length,
        price: Number(item.price),
        createdAt: item.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
    );
  }

  async queryAdminCommunities(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.CommunityWhereInput = {
      ...(query.search?.trim()
        ? {
            OR: [
              { name: { contains: query.search.trim(), mode: 'insensitive' } },
              { description: { contains: query.search.trim(), mode: 'insensitive' } },
              { category: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.community.count({ where }),
      this.prisma.community.findMany({
        where,
        include: { owner: true, members: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return this.wrapPaginated(
      items.map((item) => ({
        id: item.id,
        name: item.name,
        ownerName: item.owner.name,
        ownerId: item.ownerId,
        privacy: item.privacy,
        category: item.category,
        status: item.deletedAt ? 'deleted' : 'active',
        memberCount: item.members.length,
        createdAt: item.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
    );
  }

  async queryAdminPages(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.PageWhereInput = {
      ...(query.search?.trim()
        ? {
            OR: [
              { name: { contains: query.search.trim(), mode: 'insensitive' } },
              { about: { contains: query.search.trim(), mode: 'insensitive' } },
              { category: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.page.count({ where }),
      this.prisma.page.findMany({
        where,
        include: { owner: true, followers: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return this.wrapPaginated(
      items.map((item) => ({
        id: item.id,
        name: item.name,
        ownerName: item.owner.name,
        ownerId: item.ownerId,
        category: item.category,
        location: item.location,
        status: 'active',
        followerCount: item.followers.length,
        createdAt: item.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
    );
  }

  async queryAdminLiveStreams(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.LiveStreamSessionWhereInput = {
      ...(query.status?.trim() ? { status: query.status.trim() } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { title: { contains: query.search.trim(), mode: 'insensitive' } },
              { description: { contains: query.search.trim(), mode: 'insensitive' } },
              { category: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.liveStreamSession.count({ where }),
      this.prisma.liveStreamSession.findMany({
        where,
        include: { host: true, comments: true, reactions: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return this.wrapPaginated(
      items.map((item) => ({
        id: item.id,
        title: item.title,
        hostName: item.host.name,
        hostId: item.hostId,
        category: item.category,
        status: item.status,
        viewerCount: item.viewerCount,
        comments: item.comments.length,
        reactions: item.reactions.length,
        createdAt: item.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
    );
  }

  async queryAdminMonetization(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const txWhere: Prisma.WalletTransactionWhereInput = {
      ...(query.status?.trim() ? { status: query.status.trim() } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { description: { contains: query.search.trim(), mode: 'insensitive' } },
              { type: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [transactionsTotal, subscriptionTotal, transactions, subscriptions] =
      await Promise.all([
        this.prisma.walletTransaction.count({ where: txWhere }),
        this.prisma.subscription.count({
          where: query.status?.trim() ? { status: query.status.trim() } : undefined,
        }),
        this.prisma.walletTransaction.findMany({
          where: txWhere,
          include: { user: true },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        this.prisma.subscription.findMany({
          where: query.status?.trim() ? { status: query.status.trim() } : undefined,
          include: { user: true, plan: true },
          orderBy: { createdAt: 'desc' },
          take: limit,
        }),
      ]);

    const items = [
      ...transactions.map((item) => ({
        id: item.id,
        kind: 'transaction',
        userName: item.user.name,
        userId: item.userId,
        status: item.status,
        amount: Number(item.amount),
        type: item.type,
        label: item.description ?? item.type,
        createdAt: item.createdAt.toISOString(),
      })),
      ...subscriptions.map((item) => ({
        id: item.id,
        kind: 'subscription',
        userName: item.user.name,
        userId: item.userId,
        status: item.status,
        amount: item.plan ? Number(item.plan.price) : null,
        type: item.planCode,
        label: item.plan?.name ?? item.planCode,
        createdAt: item.createdAt.toISOString(),
      })),
    ].slice(0, limit);

    return {
      ...this.wrapPaginated(items, page, limit, transactionsTotal + subscriptionTotal),
      summary: {
        transactions: transactionsTotal,
        subscriptions: subscriptionTotal,
      },
    };
  }

  async queryAdminNotificationDevices(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const activeFilter =
      query.status?.trim().toLowerCase() === 'active'
        ? true
        : query.status?.trim().toLowerCase() === 'inactive'
          ? false
          : undefined;
    const where: Prisma.PushDeviceTokenWhereInput = {
      ...(activeFilter === undefined ? {} : { isActive: activeFilter }),
      ...(query.search?.trim()
        ? {
            OR: [
              { token: { contains: query.search.trim(), mode: 'insensitive' } },
              { platform: { contains: query.search.trim(), mode: 'insensitive' } },
              { deviceLabel: { contains: query.search.trim(), mode: 'insensitive' } },
              { user: { name: { contains: query.search.trim(), mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.pushDeviceToken.count({ where }),
      this.prisma.pushDeviceToken.findMany({
        where,
        include: { user: true },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return this.wrapPaginated(
      items.map((item) => ({
        id: item.id,
        userName: item.user.name,
        userId: item.userId,
        platform: item.platform,
        deviceLabel: item.deviceLabel,
        status: item.isActive ? 'active' : 'inactive',
        token: item.token,
        lastSeenAt: item.lastSeenAt.toISOString(),
        createdAt: item.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
    );
  }

  async getAdminUsers() {
    return this.prisma.appUser.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getAdminContent() {
    return {
      posts: await this.prisma.appPost.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      stories: await this.prisma.story.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      reels: await this.prisma.reel.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    };
  }

  async getReports() {
    return this.prisma.userReport.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getChatCases() {
    return this.getModerationCases('chat_thread');
  }

  async getEvents() {
    return this.prisma.event.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getMonetization() {
    return {
      wallet: await this.prisma.walletTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      subscriptions: await this.prisma.subscription.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      plans: await this.prisma.premiumPlan.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    };
  }

  async getNotifications() {
    return this.getCampaigns();
  }

  async getAnalytics() {
    const pipeline = await this.getAnalyticsPipeline();
    return {
      userAnalytics: [
        { label: 'Total users', value: pipeline.kpis.userGrowth },
        { label: 'Premium revenue', value: pipeline.kpis.revenue },
      ],
      contentAnalytics: [
        { label: 'Content items', value: pipeline.kpis.contentOutput },
      ],
      moderationAnalytics: [
        { label: 'Reports', value: pipeline.kpis.moderationLoad },
      ],
    };
  }

  getRoles() {
    return this.getPermissionMatrix();
  }

  async getSettings() {
    return this.getOperationalSettings();
  }

  async registerPushDevice(
    userId: string,
    input: { token: string; platform: string; deviceLabel?: string },
  ) {
    await this.coreDatabase.getUser(userId);
    const device = await this.prisma.pushDeviceToken.upsert({
      where: { token: input.token.trim() },
      create: {
        id: makeId('push_device'),
        userId,
        token: input.token.trim(),
        platform: input.platform.trim(),
        deviceLabel: input.deviceLabel?.trim() || null,
        isActive: true,
        lastSeenAt: new Date(),
      },
      update: {
        userId,
        platform: input.platform.trim(),
        deviceLabel: input.deviceLabel?.trim() || null,
        isActive: true,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      id: device.id,
      token: device.token,
      platform: device.platform,
      deviceLabel: device.deviceLabel,
      isActive: device.isActive,
      lastSeenAt: device.lastSeenAt.toISOString(),
    };
  }

  async unregisterPushDevice(userId: string, token: string) {
    const existing = await this.prisma.pushDeviceToken.findFirst({
      where: {
        userId,
        token: token.trim(),
      },
    });
    if (!existing) {
      throw new NotFoundException('Push device token not found.');
    }

    const device = await this.prisma.pushDeviceToken.update({
      where: { id: existing.id },
      data: {
        isActive: false,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return {
      id: device.id,
      token: device.token,
      isActive: device.isActive,
    };
  }

  private async ensureDefaultAdmin() {
    const count = await this.prisma.adminUser.count();
    if (count > 0) {
      return;
    }

    const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
    if (!email || !password) {
      return;
    }
    const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || 'Admin';
    const role = process.env.ADMIN_BOOTSTRAP_ROLE?.trim() || 'Super Admin';

    await this.prisma.adminUser.create({
      data: {
        id: makeId('admin'),
        name,
        email,
        role,
        passwordHash: await argon2.hash(password),
        mfaEnabled: false,
        isActive: true,
      },
    });
  }

  private async resolveAdminSession(accessToken?: string) {
    const token = accessToken?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      throw new UnauthorizedException('Admin authentication required.');
    }

    const session = await this.prisma.adminSession.findUnique({
      where: { accessToken: token },
      include: { admin: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid or expired admin session.');
    }

    await this.prisma.adminSession.update({
      where: { id: session.id },
      data: {
        lastActive: new Date(),
        current: true,
      },
    });

    return session;
  }

  private async createAuditLog(input: {
    actorAdminId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    await this.prisma.adminAuditLog.create({
      data: {
        id: makeId('audit'),
        actorAdminId: input.actorAdminId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  private mapAdminSession(
    session: {
      id: string;
      adminId: string;
      device: string;
      ipAddress: string;
      current: boolean;
      createdAt: Date;
      lastActive: Date;
      revokedAt: Date | null;
      accessToken?: string;
      refreshToken?: string;
    },
    admin: {
      id: string;
      name: string;
      email: string;
      role: string;
      mfaEnabled: boolean;
    },
  ) {
    return {
      id: session.id,
      adminId: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      mfaEnabled: admin.mfaEnabled,
      device: session.device,
      ipAddress: session.ipAddress,
      lastActive: session.lastActive.toISOString(),
      createdAt: session.createdAt.toISOString(),
      current: session.current && !session.revokedAt,
      token: session.accessToken,
      refreshToken: session.refreshToken,
    };
  }

  private mapModerationCase(item: {
    id: string;
    title: string;
    type: string;
    targetType: string;
    severity: string;
    targetId: string | null;
    targetLabel: string | null;
    reason: string;
    evidence: Prisma.JsonValue;
    history: Prisma.JsonValue;
    status: string;
    enforcementActions: Prisma.JsonValue;
    metadata: Prisma.JsonValue;
    assignedAdmin?: { id: string; name: string } | null;
  }) {
    const metadata = this.readObject(item.metadata);
    return {
      id: item.id,
      title: item.title,
      type: item.type,
      targetType: item.targetType,
      severity: item.severity,
      target: item.targetLabel ?? item.targetId ?? '',
      targetId: item.targetId,
      reason: item.reason,
      evidence: this.readStringArray(item.evidence),
      history: this.readStringArray(item.history),
      assignedTo: item.assignedAdmin?.name ?? '',
      assignedToAdminId: item.assignedAdmin?.id ?? null,
      status: item.status,
      enforcementActions: this.readStringArray(item.enforcementActions),
      frozen: Boolean(metadata.frozen),
      restrictedParticipants: this.readStringArray(metadata.restrictedParticipants),
    };
  }

  private normalizeVerificationStatus(value?: string) {
    const normalized = (value ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
    if (!normalized) {
      return 'not_requested';
    }
    if (normalized === 'verified') {
      return 'approved';
    }
    return normalized;
  }

  private readObject(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private readStringArray(value: unknown) {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
  }

  private normalizeJsonValue(value: unknown): Prisma.InputJsonValue {
    if (typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }
    if (value === null) {
      return {} as Prisma.InputJsonValue;
    }
    if (Array.isArray(value)) {
      return value as Prisma.InputJsonValue;
    }
    if (value && typeof value === 'object') {
      return value as Prisma.InputJsonValue;
    }
    return String(value ?? '');
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

  private wrapPaginated(items: unknown[], page: number, limit: number, total: number) {
    return {
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
      total,
      count: items.length,
    };
  }

  private resolveAdminUserSortField(sort?: string) {
    switch (sort) {
      case 'name':
        return 'name';
      case 'followers':
        return 'followers';
      case 'following':
        return 'following';
      case 'updatedAt':
        return 'updatedAt';
      case 'createdAt':
      default:
        return 'createdAt';
    }
  }

  private async getAdminUserById(adminId: string) {
    const admin = await this.prisma.adminUser.findUnique({
      where: { id: adminId },
    });
    if (!admin || !admin.isActive) {
      throw new UnauthorizedException('Admin session is no longer valid.');
    }
    return admin;
  }

  private hasAdminRole(role: string, allowedRoles: string[]) {
    const normalizedRole = role.trim().toLowerCase();
    return allowedRoles.some((item) => item.trim().toLowerCase() === normalizedRole);
  }

  private mapAdminAppUser(user: Prisma.AppUserGetPayload<Record<string, never>>) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    return safeUser;
  }

  private async queryPosts(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.AppPostWhereInput = {
      ...(query.status?.trim() ? { status: query.status.trim() } : {}),
      ...(query.search?.trim()
        ? { caption: { contains: query.search.trim(), mode: 'insensitive' } }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.appPost.count({ where }),
      this.prisma.appPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return {
      targetType: 'post',
      ...this.wrapPaginated(items, page, limit, total),
    };
  }

  private async queryReels(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.ReelWhereInput = {
      ...(query.status?.trim() ? { status: query.status.trim() } : {}),
      ...(query.search?.trim()
        ? { caption: { contains: query.search.trim(), mode: 'insensitive' } }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.reel.count({ where }),
      this.prisma.reel.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return {
      targetType: 'reel',
      ...this.wrapPaginated(items, page, limit, total),
    };
  }

  private async queryStories(query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.StoryWhereInput = {
      ...(query.status?.trim() ? { status: query.status.trim() } : {}),
      ...(query.search?.trim()
        ? { text: { contains: query.search.trim(), mode: 'insensitive' } }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.story.count({ where }),
      this.prisma.story.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);
    return {
      targetType: 'story',
      ...this.wrapPaginated(items, page, limit, total),
    };
  }
}
