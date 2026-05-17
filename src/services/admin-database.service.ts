import {
  BadRequestException,
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
    await this.normalizeLegacyAdminRoles();
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

  async requestAdminPasswordReset(email: string, code: string, expiresAt: Date) {
    const normalizedEmail = email.trim().toLowerCase();
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin || !admin.isActive) {
      return null;
    }

    await this.coreDatabase.storeAuthCode(
      normalizedEmail,
      'admin_reset_password',
      code,
      expiresAt,
    );

    await this.createAuditLog({
      actorAdminId: admin.id,
      action: 'admin.password_reset.request',
      entityType: 'admin_user',
      entityId: admin.id,
      metadata: {
        email: admin.email,
      },
    });

    return {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: this.normalizeAdminRole(admin.role),
    };
  }

  async resetAdminPassword(email: string, otp: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const admin = await this.prisma.adminUser.findUnique({
      where: { email: normalizedEmail },
    });

    if (!admin || !admin.isActive) {
      throw new BadRequestException('No password reset request found for this admin email.');
    }

    const request = await this.coreDatabase.getAuthCode(
      normalizedEmail,
      'admin_reset_password',
    );
    if (!request) {
      throw new BadRequestException('No password reset request found for this admin email.');
    }
    if (Date.now() > new Date(request.expiresAt).getTime()) {
      throw new BadRequestException('Password reset code has expired.');
    }
    if (request.code !== otp.trim()) {
      throw new BadRequestException('Invalid password reset code.');
    }

    const now = new Date();
    const updated = await this.prisma.adminUser.update({
      where: { id: admin.id },
      data: {
        passwordHash: await argon2.hash(password),
        updatedAt: now,
      },
    });

    await this.prisma.adminSession.updateMany({
      where: {
        adminId: admin.id,
        revokedAt: null,
      },
      data: {
        current: false,
        revokedAt: now,
        lastActive: now,
      },
    });

    await this.coreDatabase.deleteAuthCode(normalizedEmail, 'admin_reset_password');

    await this.createAuditLog({
      actorAdminId: admin.id,
      action: 'admin.password_reset.complete',
      entityType: 'admin_user',
      entityId: admin.id,
      metadata: {
        email: admin.email,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: this.normalizeAdminRole(updated.role),
      passwordReset: true,
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
    const canViewAllSessions = this.hasAdminRole(actor.role, ['admin']);
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
          { role: { in: ['Creator', 'Business'] } },
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

  async getModerationCases(
    input?:
      | string
      | {
          page?: number;
          limit?: number;
          search?: string;
          status?: string;
          severity?: string;
          targetType?: string;
          assignedAdminId?: string;
        },
  ) {
    const query = typeof input === 'string' ? { targetType: input } : (input ?? {});
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const search = query.search?.trim();
    const targetType = query.targetType?.trim();
    const status = query.status?.trim();
    const severity = query.severity?.trim();
    const assignedAdminId = query.assignedAdminId?.trim();
    const where: Prisma.ModerationCaseWhereInput = {
      ...(targetType ? { targetType } : {}),
      ...(status ? { status } : {}),
      ...(severity ? { severity } : {}),
      ...(assignedAdminId ? { assignedToAdminId: assignedAdminId } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              { reason: { contains: search, mode: 'insensitive' } },
              { targetLabel: { contains: search, mode: 'insensitive' } },
              { targetId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.moderationCase.findMany({
        where,
        include: {
          assignedAdmin: true,
          actionHistory: {
            include: { actorAdmin: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          assignmentHistory: {
            include: {
              actorAdmin: true,
              previousAdmin: true,
              nextAdmin: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.moderationCase.count({ where }),
    ]);

    const paginated = this.wrapPaginated(
      items.map((item) => this.mapModerationCase(item)),
      page,
      limit,
      total,
    );

    return {
      cases: paginated.items,
      total: paginated.total,
      count: paginated.count,
      pagination: paginated.pagination,
      filters: {
        search: search ?? '',
        status: status ?? '',
        severity: severity ?? '',
        targetType: targetType ?? '',
        assignedAdminId: assignedAdminId ?? '',
      },
    };
  }

  async getModerationCaseDetail(id: string) {
    const existing = await this.prisma.moderationCase.findUnique({
      where: { id },
      include: {
        assignedAdmin: true,
        actionHistory: {
          include: { actorAdmin: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        assignmentHistory: {
          include: {
            actorAdmin: true,
            previousAdmin: true,
            nextAdmin: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!existing) {
      throw new NotFoundException(`Moderation case ${id} not found`);
    }

    return this.mapModerationCase(existing);
  }

  async updateModerationCase(
    id: string,
    patch:
      | string
      | {
          action?: string;
          status?: string;
          severity?: string;
          assignedAdminId?: string;
          note?: string;
          enforcementAction?: string;
        },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.moderationCase.findUnique({
      where: { id },
      include: {
        assignedAdmin: true,
        actionHistory: {
          include: { actorAdmin: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        assignmentHistory: {
          include: {
            actorAdmin: true,
            previousAdmin: true,
            nextAdmin: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!existing) {
      throw new NotFoundException(`Moderation case ${id} not found`);
    }

    const normalizedPatch =
      typeof patch === 'string'
        ? { action: patch }
        : patch;
    const action = normalizedPatch.action?.trim().toLowerCase() || 'update';
    const timestamp = new Date();
    const note = normalizedPatch.note?.trim() || null;
    const nextStatus =
      normalizedPatch.status?.trim() ||
      this.resolveModerationStatusFromAction(action, existing.status);
    const nextSeverity =
      normalizedPatch.severity?.trim() ||
      this.resolveModerationSeverityFromAction(action, existing.severity);
    const nextAssignedAdminId =
      normalizedPatch.assignedAdminId === undefined
        ? existing.assignedToAdminId
        : normalizedPatch.assignedAdminId?.trim() || null;
    const previousAssignedAdminId = existing.assignedToAdminId ?? null;
    const previousSeverity = existing.severity;
    const legacyHistory = this.readStringArray(existing.history);
    const enforcementActions = this.readStringArray(existing.enforcementActions);
    const metadata = this.readObject(existing.metadata);
    const nextEnforcementAction =
      normalizedPatch.enforcementAction?.trim() ||
      this.resolveModerationEnforcementAction(action, nextStatus, existing.targetType);
    const nextEnforcementActions =
      nextEnforcementAction && !enforcementActions.includes(nextEnforcementAction)
        ? [...enforcementActions, nextEnforcementAction]
        : enforcementActions;

    if (nextAssignedAdminId) {
      await this.getAdminUserById(nextAssignedAdminId);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextItem = await tx.moderationCase.update({
        where: { id },
        data: {
          status: nextStatus,
          severity: nextSeverity,
          assignedToAdminId: nextAssignedAdminId,
          history: [
            ...legacyHistory,
            `${timestamp.toISOString()}: ${note || `Action applied: ${action}`}`,
          ] as Prisma.InputJsonValue,
          enforcementActions: nextEnforcementActions as Prisma.InputJsonValue,
          metadata: {
            ...metadata,
            lastAction: action,
            lastActionAt: timestamp.toISOString(),
            lastActorAdminId: actorAdminId ?? null,
          } as Prisma.InputJsonValue,
          updatedAt: timestamp,
        },
      });

      await tx.moderationCaseActionHistory.create({
        data: {
          id: makeId('mod_case_action'),
          caseId: nextItem.id,
          actorAdminId: actorAdminId ?? null,
          action,
          note: note ?? `Action applied: ${action}`,
          fromStatus: existing.status,
          toStatus: nextStatus,
          payload: {
            targetType: nextItem.targetType,
            targetId: nextItem.targetId,
            severity: nextSeverity,
            enforcementAction: nextEnforcementAction,
          } as Prisma.InputJsonValue,
          createdAt: timestamp,
        },
      });

      if (
        nextAssignedAdminId !== previousAssignedAdminId ||
        nextSeverity !== previousSeverity
      ) {
        await tx.moderationCaseAssignmentHistory.create({
          data: {
            id: makeId('mod_case_assignment'),
            caseId: nextItem.id,
            actorAdminId: actorAdminId ?? null,
            previousAdminId: previousAssignedAdminId,
            nextAdminId: nextAssignedAdminId,
            previousSeverity,
            nextSeverity,
            note:
              note ??
              (action === 'escalate'
                ? 'Case escalated'
                : 'Moderation assignment or severity updated'),
            payload: {
              action,
              status: nextStatus,
            } as Prisma.InputJsonValue,
            createdAt: timestamp,
          },
        });
      }

      return tx.moderationCase.findUniqueOrThrow({
        where: { id },
        include: {
          assignedAdmin: true,
          actionHistory: {
            include: { actorAdmin: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          assignmentHistory: {
            include: {
              actorAdmin: true,
              previousAdmin: true,
              nextAdmin: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'moderation.case.update',
      entityType: 'moderation_case',
      entityId: updated.id,
      metadata: {
        action,
        status: nextStatus,
        severity: nextSeverity,
        assignedAdminId: nextAssignedAdminId,
        enforcementAction: nextEnforcementAction,
      },
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
      include: { assignedAdmin: true },
    });
    if (!existing || existing.targetType !== 'chat_thread') {
      throw new NotFoundException(`Chat moderation case ${id} not found`);
    }

    const metadata = this.readObject(existing.metadata);
    const restrictedParticipants = this.readStringArray(metadata.restrictedParticipants);
    const timestamp = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const nextItem = await tx.moderationCase.update({
        where: { id },
        data: {
          metadata: {
            ...metadata,
            frozen: typeof patch.freeze === 'boolean' ? patch.freeze : metadata.frozen ?? false,
            restrictedParticipants: patch.restrictParticipant
              ? [...new Set([...restrictedParticipants, patch.restrictParticipant])]
              : restrictedParticipants,
          } as Prisma.InputJsonValue,
          updatedAt: timestamp,
        },
      });

      await tx.moderationCaseActionHistory.create({
        data: {
          id: makeId('mod_case_action'),
          caseId: nextItem.id,
          actorAdminId: actorAdminId ?? null,
          action: 'chat_update',
          note: 'Updated chat moderation controls',
          fromStatus: existing.status,
          toStatus: nextItem.status,
          payload: patch as Prisma.InputJsonValue,
          createdAt: timestamp,
        },
      });

      return tx.moderationCase.findUniqueOrThrow({
        where: { id },
        include: {
          assignedAdmin: true,
          actionHistory: {
            include: { actorAdmin: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          assignmentHistory: {
            include: {
              actorAdmin: true,
              previousAdmin: true,
              nextAdmin: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });
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
      roles: ['superadmin', 'admin'],
      moduleScopes: {
        dashboard: ['view'],
        users: ['view', 'verify', 'suspend', 'update'],
        content: ['view', 'hide', 'feature', 'delete'],
        reports: ['view', 'assign', 'resolve', 'escalate'],
        monetization: ['view', 'hold', 'approve', 'update'],
        settings: ['view', 'edit'],
        audit: ['view', 'export'],
        adminStaff: ['view', 'update', 'delete'],
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

  async queryAppConfig(query: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isPublic?: boolean;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.AdminAppConfigEntryWhereInput = {
      ...(query.category?.trim() ? { category: query.category.trim() } : {}),
      ...(typeof query.isPublic === 'boolean' ? { isPublic: query.isPublic } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { key: { contains: query.search.trim(), mode: 'insensitive' } },
              { title: { contains: query.search.trim(), mode: 'insensitive' } },
              { description: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.adminAppConfigEntry.count({ where }),
      this.prisma.adminAppConfigEntry.findMany({
        where,
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      ...this.wrapPaginated(
        items.map((item) => ({
          key: item.key,
          category: item.category,
          title: item.title,
          description: item.description,
          value: item.value,
          isPublic: item.isPublic,
          metadata: this.readObject(item.metadata),
          updatedAt: item.updatedAt.toISOString(),
        })),
        page,
        limit,
        total,
      ),
    };
  }

  async createAppConfig(
    input: {
      key?: string;
      title: string;
      category?: string;
      description?: string;
      value?: unknown;
      isPublic?: boolean;
      metadata?: Record<string, unknown>;
    },
    actorAdminId?: string,
  ) {
    const key = (input.key ?? input.title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (!key) {
      throw new ConflictException('A valid app config key is required.');
    }

    const existing = await this.prisma.adminAppConfigEntry.findUnique({ where: { key } });
    if (existing) {
      throw new ConflictException(`App config ${key} already exists.`);
    }

    const created = await this.prisma.adminAppConfigEntry.create({
      data: {
        key,
        title: input.title.trim(),
        category: input.category?.trim() || 'general',
        description: input.description?.trim() || null,
        value: this.normalizeJsonValue(input.value ?? {}),
        isPublic: Boolean(input.isPublic),
        metadata: this.normalizeJsonValue(input.metadata ?? {}),
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'app_config.create',
      entityType: 'admin_app_config_entry',
      entityId: created.key,
      metadata: {
        key: created.key,
        category: created.category,
        isPublic: created.isPublic,
      },
    });

    return {
      key: created.key,
      category: created.category,
      title: created.title,
      description: created.description,
      value: created.value,
      isPublic: created.isPublic,
      metadata: this.readObject(created.metadata),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateAppConfig(
    key: string,
    input: {
      title?: string;
      category?: string;
      description?: string;
      value?: unknown;
      isPublic?: boolean;
      metadata?: Record<string, unknown>;
    },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.adminAppConfigEntry.findUnique({
      where: { key: key.trim() },
    });
    if (!existing) {
      throw new NotFoundException(`App config ${key} not found.`);
    }

    const updated = await this.prisma.adminAppConfigEntry.update({
      where: { key: key.trim() },
      data: {
        ...(typeof input.title === 'string' ? { title: input.title.trim() } : {}),
        ...(typeof input.category === 'string'
          ? { category: input.category.trim() || 'general' }
          : {}),
        ...(typeof input.description === 'string' ? { description: input.description.trim() } : {}),
        ...(Object.prototype.hasOwnProperty.call(input, 'value')
          ? { value: this.normalizeJsonValue(input.value) }
          : {}),
        ...(typeof input.isPublic === 'boolean' ? { isPublic: input.isPublic } : {}),
        ...(input.metadata ? { metadata: this.normalizeJsonValue(input.metadata) } : {}),
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'app_config.update',
      entityType: 'admin_app_config_entry',
      entityId: updated.key,
      metadata: {
        before: {
          category: existing.category,
          title: existing.title,
          description: existing.description,
          isPublic: existing.isPublic,
        },
        after: {
          category: updated.category,
          title: updated.title,
          description: updated.description,
          isPublic: updated.isPublic,
        },
      },
    });

    return {
      key: updated.key,
      category: updated.category,
      title: updated.title,
      description: updated.description,
      value: updated.value,
      isPublic: updated.isPublic,
      metadata: this.readObject(updated.metadata),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async getSupportHelpConfig() {
    const row = await this.prisma.adminAppConfigEntry.findUnique({
      where: { key: 'support.login_help' },
    });

    return this.mapSupportHelpConfig(row);
  }

  async updateSupportHelpConfig(
    input: {
      enabled?: boolean;
      showOnLogin?: boolean;
      headerText?: string;
      bodyText?: string;
      allowImages?: boolean;
    },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.adminAppConfigEntry.findUnique({
      where: { key: 'support.login_help' },
    });
    const previousValue = this.readObject(existing?.value);
    const nextValue = {
      ...previousValue,
      ...(typeof input.enabled === 'boolean' ? { enabled: input.enabled } : {}),
      ...(typeof input.showOnLogin === 'boolean'
        ? { showOnLogin: input.showOnLogin }
        : {}),
      ...(typeof input.headerText === 'string'
        ? { headerText: input.headerText.trim() }
        : {}),
      ...(typeof input.bodyText === 'string' ? { bodyText: input.bodyText.trim() } : {}),
      ...(typeof input.allowImages === 'boolean' ? { allowImages: input.allowImages } : {}),
    };

    const updated = await this.prisma.adminAppConfigEntry.upsert({
      where: { key: 'support.login_help' },
      create: {
        key: 'support.login_help',
        category: 'support',
        title: 'Login help message',
        description: 'Controls whether the app login screen shows a support-help entry and header copy.',
        value: nextValue as Prisma.InputJsonValue,
        isPublic: true,
        metadata: {
          source: 'admin.support_help.config',
        } as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
      update: {
        value: nextValue as Prisma.InputJsonValue,
        isPublic: true,
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'support.help_config.update',
      entityType: 'admin_app_config_entry',
      entityId: updated.key,
      metadata: {
        before: previousValue,
        after: nextValue,
      },
    });

    return this.mapSupportHelpConfig(updated);
  }

  async queryFeatureFlags(query: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    isEnabled?: boolean;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.AdminFeatureFlagWhereInput = {
      ...(query.category?.trim() ? { category: query.category.trim() } : {}),
      ...(typeof query.isEnabled === 'boolean' ? { isEnabled: query.isEnabled } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { key: { contains: query.search.trim(), mode: 'insensitive' } },
              { title: { contains: query.search.trim(), mode: 'insensitive' } },
              { description: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.adminFeatureFlag.count({ where }),
      this.prisma.adminFeatureFlag.findMany({
        where,
        orderBy: [{ category: 'asc' }, { key: 'asc' }],
        skip,
        take: limit,
      }),
    ]);

    return {
      ...this.wrapPaginated(
        items.map((item) => ({
          key: item.key,
          category: item.category,
          title: item.title,
          description: item.description,
          isEnabled: item.isEnabled,
          rolloutPercentage: item.rolloutPercentage,
          audience: this.readObject(item.audience),
          metadata: this.readObject(item.metadata),
          updatedAt: item.updatedAt.toISOString(),
        })),
        page,
        limit,
        total,
      ),
    };
  }

  async createFeatureFlag(
    input: {
      key?: string;
      title: string;
      category?: string;
      description?: string;
      isEnabled?: boolean;
      rolloutPercentage?: number;
      audience?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    },
    actorAdminId?: string,
  ) {
    const key = (input.key ?? input.title)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '_')
      .replace(/^_+|_+$/g, '');
    if (!key) {
      throw new ConflictException('A valid feature flag key is required.');
    }

    const existing = await this.prisma.adminFeatureFlag.findUnique({ where: { key } });
    if (existing) {
      throw new ConflictException(`Feature flag ${key} already exists.`);
    }

    const created = await this.prisma.adminFeatureFlag.create({
      data: {
        key,
        title: input.title.trim(),
        category: input.category?.trim() || 'general',
        description: input.description?.trim() || null,
        isEnabled: Boolean(input.isEnabled),
        rolloutPercentage:
          typeof input.rolloutPercentage === 'number'
            ? Math.max(0, Math.min(100, Math.trunc(input.rolloutPercentage)))
            : 100,
        audience: this.normalizeJsonValue(input.audience ?? {}),
        metadata: this.normalizeJsonValue(input.metadata ?? {}),
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'feature_flag.create',
      entityType: 'admin_feature_flag',
      entityId: created.key,
      metadata: {
        key: created.key,
        category: created.category,
        isEnabled: created.isEnabled,
        rolloutPercentage: created.rolloutPercentage,
      },
    });

    return {
      key: created.key,
      category: created.category,
      title: created.title,
      description: created.description,
      isEnabled: created.isEnabled,
      rolloutPercentage: created.rolloutPercentage,
      audience: this.readObject(created.audience),
      metadata: this.readObject(created.metadata),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateFeatureFlag(
    key: string,
    input: {
      title?: string;
      category?: string;
      description?: string;
      isEnabled?: boolean;
      rolloutPercentage?: number;
      audience?: Record<string, unknown>;
      metadata?: Record<string, unknown>;
    },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.adminFeatureFlag.findUnique({
      where: { key: key.trim() },
    });
    if (!existing) {
      throw new NotFoundException(`Feature flag ${key} not found.`);
    }

    const updated = await this.prisma.adminFeatureFlag.update({
      where: { key: key.trim() },
      data: {
        ...(typeof input.title === 'string' ? { title: input.title.trim() } : {}),
        ...(typeof input.category === 'string'
          ? { category: input.category.trim() || 'general' }
          : {}),
        ...(typeof input.description === 'string' ? { description: input.description.trim() } : {}),
        ...(typeof input.isEnabled === 'boolean' ? { isEnabled: input.isEnabled } : {}),
        ...(typeof input.rolloutPercentage === 'number'
          ? {
              rolloutPercentage: Math.max(
                0,
                Math.min(100, Math.trunc(input.rolloutPercentage)),
              ),
            }
          : {}),
        ...(input.audience ? { audience: this.normalizeJsonValue(input.audience) } : {}),
        ...(input.metadata ? { metadata: this.normalizeJsonValue(input.metadata) } : {}),
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'feature_flag.update',
      entityType: 'admin_feature_flag',
      entityId: updated.key,
      metadata: {
        before: {
          category: existing.category,
          title: existing.title,
          isEnabled: existing.isEnabled,
          rolloutPercentage: existing.rolloutPercentage,
        },
        after: {
          category: updated.category,
          title: updated.title,
          isEnabled: updated.isEnabled,
          rolloutPercentage: updated.rolloutPercentage,
        },
      },
    });

    return {
      key: updated.key,
      category: updated.category,
      title: updated.title,
      description: updated.description,
      isEnabled: updated.isEnabled,
      rolloutPercentage: updated.rolloutPercentage,
      audience: this.readObject(updated.audience),
      metadata: this.readObject(updated.metadata),
      updatedAt: updated.updatedAt.toISOString(),
    };
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

  async getSupportOperations(query?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    priority?: string;
  }) {
    const page = this.resolvePage(query?.page);
    const limit = this.resolveLimit(query?.limit);
    const search = query?.search?.trim();
    const where: Prisma.SupportTicketWhereInput = {
      ...(query?.status ? { status: query.status.trim().toLowerCase() } : {}),
      ...(query?.priority ? { priority: query.priority.trim().toLowerCase() } : {}),
      ...(search
        ? {
            OR: [
              { subject: { contains: search, mode: 'insensitive' } },
              { category: { contains: search, mode: 'insensitive' } },
              { user: { name: { contains: search, mode: 'insensitive' } } },
              { user: { username: { contains: search, mode: 'insensitive' } } },
              { user: { email: { contains: search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [tickets, total, actions, supportHelpConfig] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where,
        include: {
          user: true,
          assignedAdmin: true,
          conversation: {
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
          internalNotes: {
            include: { actorAdmin: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.supportTicket.count({ where }),
      this.prisma.adminAuditLog.findMany({
        where: { entityType: 'support_ticket' },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.getSupportHelpConfig(),
    ]);

    const paginatedTickets = this.wrapPaginated(
      tickets.map((ticket) => this.mapSupportTicket(ticket)),
      page,
      limit,
      total,
    );

    return {
      tickets: paginatedTickets.items,
      total: paginatedTickets.total,
      count: paginatedTickets.count,
      pagination: paginatedTickets.pagination,
      filters: {
        search: search ?? '',
        status: query?.status?.trim().toLowerCase() ?? '',
        priority: query?.priority?.trim().toLowerCase() ?? '',
      },
      supportHelpConfig,
      actions: actions.map((row) => ({
        id: row.id,
        action: row.action,
        entityId: row.entityId,
        metadata: this.readObject(row.metadata),
        createdAt: row.createdAt.toISOString(),
      })),
    };
  }

  async updateSupportTicket(
    id: string,
    patch: {
      status?: string;
      priority?: string;
      adminNote?: string;
      assignedAdminId?: string;
      replyMessage?: string;
      replyAttachments?: string[];
      slaHours?: number;
    },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: true,
        assignedAdmin: true,
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        internalNotes: {
          include: { actorAdmin: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!existing) {
      throw new NotFoundException(`Support ticket ${id} not found.`);
    }

    const metadata = this.readObject(existing.metadata);
    const note = patch.adminNote?.trim();
    const replyMessage = patch.replyMessage?.trim();
    const replyAttachments = this.readStringArray(patch.replyAttachments).map((item) => item.trim());
    const nextStatus = patch.status?.trim().toLowerCase();
    const nextPriority = patch.priority?.trim().toLowerCase();
    const hasAssignedAdminPatch = patch.assignedAdminId !== undefined;
    const assignedAdminId = hasAssignedAdminPatch ? patch.assignedAdminId?.trim() || null : existing.assignedToAdminId;
    const previousAssignedAdminId = existing.assignedToAdminId ?? null;
    const previousSlaHours = existing.slaHours ?? null;
    const previousSlaDueAt = existing.slaDueAt ?? null;
    const nextSlaHours = patch.slaHours ?? previousSlaHours;
    const nextSlaDueAt =
      patch.slaHours === undefined ? previousSlaDueAt : new Date(Date.now() + patch.slaHours * 60 * 60 * 1000);
    const timestamp = new Date();

    if (assignedAdminId) {
      await this.getAdminUserById(assignedAdminId);
    }

    const nextMetadata = {
      ...metadata,
      lastAdminActionAt: new Date().toISOString(),
      assignedAdminId: assignedAdminId,
      assignedAt:
        assignedAdminId === previousAssignedAdminId
          ? (existing.assignedAt?.toISOString() ?? null)
          : assignedAdminId
            ? timestamp.toISOString()
            : null,
      slaHours: nextSlaHours,
      slaDueAt:
        nextSlaDueAt?.toISOString() ?? null,
    };

    const [ticket] = await this.prisma.$transaction(async (tx) => {
      if (replyMessage && existing.conversation?.id) {
        await tx.supportMessage.create({
          data: {
            id: makeId('support_message'),
            conversationId: existing.conversation.id,
            senderType: 'agent',
            senderUserId: null,
            body: replyMessage,
            attachments: replyAttachments,
          },
        });
      }

      const updatedTicket = await tx.supportTicket.update({
        where: { id },
        data: {
          status: nextStatus ?? undefined,
          priority: nextPriority ?? undefined,
          assignedToAdminId: assignedAdminId,
          assignedAt:
            assignedAdminId === previousAssignedAdminId
              ? existing.assignedAt ?? undefined
              : assignedAdminId
                ? timestamp
                : null,
          slaHours: nextSlaHours,
          slaDueAt: nextSlaDueAt,
          metadata: nextMetadata as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
        include: {
          user: true,
          assignedAdmin: true,
          conversation: {
            include: {
              messages: {
                orderBy: { createdAt: 'desc' },
                take: 1,
              },
            },
          },
          internalNotes: {
            include: { actorAdmin: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          actionHistory: {
            include: { actorAdmin: true, actorUser: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          assignmentHistory: {
            include: {
              actorAdmin: true,
              actorUser: true,
              previousAdmin: true,
              nextAdmin: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });

      await tx.supportConversation.updateMany({
        where: { ticketId: id },
        data: {
          status:
            nextStatus === 'resolved' || nextStatus === 'closed'
              ? 'closed'
              : nextStatus === 'reviewing'
                ? 'reviewing'
                : nextStatus === 'open'
                  ? 'open'
                  : undefined,
          updatedAt: new Date(),
        },
      });

      await tx.supportTicketActionHistory.create({
        data: {
          id: makeId('support_action'),
          ticketId: updatedTicket.id,
          actorAdminId: actorAdminId ?? null,
          actorUserId: null,
          action: replyMessage ? 'reply' : 'update',
          note: note ?? replyMessage ?? 'Support ticket updated',
          fromStatus: existing.status,
          toStatus: nextStatus ?? existing.status,
          fromPriority: existing.priority,
          toPriority: nextPriority ?? existing.priority,
          payload: {
            replied: Boolean(replyMessage),
            replyAttachments,
            assignedAdminId,
            slaHours: nextSlaHours,
          } as Prisma.InputJsonValue,
          createdAt: timestamp,
        },
      });

      const assignmentChanged =
        assignedAdminId !== null && assignedAdminId !== previousAssignedAdminId;
      const slaChanged =
        patch.slaHours !== undefined &&
        (previousSlaHours ?? null) !== (patch.slaHours ?? null);

      if (assignmentChanged || slaChanged) {
        await tx.supportTicketAssignmentHistory.create({
          data: {
            id: makeId('support_assignment'),
            ticketId: updatedTicket.id,
            actorAdminId: actorAdminId ?? null,
            actorUserId: null,
            previousAdminId: previousAssignedAdminId,
            nextAdminId: assignmentChanged ? assignedAdminId : previousAssignedAdminId,
            previousSlaHours,
            nextSlaHours,
            previousSlaDueAt,
            nextSlaDueAt,
            note: note ?? (assignmentChanged ? 'Support assignment updated' : 'Support SLA updated'),
            payload: {
              replyMessage: Boolean(replyMessage),
            } as Prisma.InputJsonValue,
            createdAt: timestamp,
          },
        });
      }

      if (note) {
        await tx.supportTicketInternalNote.create({
          data: {
            id: makeId('support_note'),
            ticketId: updatedTicket.id,
            actorAdminId: actorAdminId ?? null,
            note,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        });
      }

      return [updatedTicket];
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'support.ticket.update',
      entityType: 'support_ticket',
      entityId: ticket.id,
      metadata: {
        status: nextStatus ?? existing.status,
        priority: nextPriority ?? existing.priority,
        adminNote: note ?? null,
        assignedAdminId,
        replied: Boolean(replyMessage),
        slaHours: patch.slaHours ?? null,
      },
    });

    return this.mapSupportTicket(ticket);
  }

  async getSupportOperationDetail(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        user: true,
        assignedAdmin: true,
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'asc' },
            },
          },
        },
        internalNotes: {
          include: { actorAdmin: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        actionHistory: {
          include: { actorAdmin: true, actorUser: true },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        assignmentHistory: {
          include: {
            actorAdmin: true,
            actorUser: true,
            previousAdmin: true,
            nextAdmin: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!ticket) {
      throw new NotFoundException(`Support ticket ${id} not found.`);
    }

    const mapped = this.mapSupportTicket(ticket);
    return {
      ...mapped,
      messages:
        ticket.conversation?.messages.map((message) => ({
          id: message.id,
          senderType: message.senderType,
          senderUserId: message.senderUserId,
          body: message.body,
          attachments: this.readStringArray(message.attachments),
          createdAt: message.createdAt.toISOString(),
        })) ?? [],
      actionHistory: this.mapSupportActionHistoryList(ticket.actionHistory),
      assignmentHistory: this.mapSupportAssignmentHistoryList(ticket.assignmentHistory),
    };
  }

  async getDashboardOverview() {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - 6);
    since.setUTCHours(0, 0, 0, 0);

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
      userRows,
      postRows,
      reelRows,
      storyRows,
      revenueRows,
      reportStatuses,
      supportStatuses,
      subscriptionStatuses,
      marketplaceProductCount,
      marketplaceActiveCount,
      marketplaceOrderCount,
      marketplacePendingOrderCount,
      jobsCount,
      jobsOpenCount,
      jobApplicationCount,
      liveStreamCount,
      liveStreamLiveCount,
      callSessionCount,
      callActiveCount,
      recentAuditLogs,
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
      this.prisma.appUser.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.appPost.findMany({
        where: { deletedAt: null, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.reel.findMany({
        where: { deletedAt: null, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.story.findMany({
        where: { deletedAt: null, createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.walletTransaction.findMany({
        where: { createdAt: { gte: since }, status: 'completed' },
        select: { createdAt: true, amount: true },
      }),
      this.prisma.userReport.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.supportTicket.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.subscription.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.marketplaceProduct.count(),
      this.prisma.marketplaceProduct.count({ where: { status: 'active' } }),
      this.prisma.marketplaceOrder.count(),
      this.prisma.marketplaceOrder.count({ where: { status: 'pending' } }),
      this.prisma.job.count({ where: { deletedAt: null } }),
      this.prisma.job.count({ where: { deletedAt: null, status: 'open' } }),
      this.prisma.jobApplication.count(),
      this.prisma.liveStreamSession.count(),
      this.prisma.liveStreamSession.count({ where: { status: 'live' } }),
      this.prisma.callSession.count(),
      this.prisma.callSession.count({ where: { status: 'active' } }),
      this.prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
      }),
    ]);

    const userGrowth = this.buildDailyCountSeries(userRows, since, 'createdAt');
    const postGrowth = this.buildDailyCountSeries(postRows, since, 'createdAt');
    const reelGrowth = this.buildDailyCountSeries(reelRows, since, 'createdAt');
    const storyGrowth = this.buildDailyCountSeries(storyRows, since, 'createdAt');
    const revenueGrowth = this.buildDailyRevenueSeries(revenueRows, since);

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
      charts: {
        userGrowth,
        contentGrowth: userGrowth.labels.map((label, index) => ({
          label,
          posts: postGrowth.values[index] ?? 0,
          reels: reelGrowth.values[index] ?? 0,
          stories: storyGrowth.values[index] ?? 0,
          total:
            (postGrowth.values[index] ?? 0) +
            (reelGrowth.values[index] ?? 0) +
            (storyGrowth.values[index] ?? 0),
        })),
        revenueGrowth,
      },
      breakdowns: {
        reportsByStatus: reportStatuses.map((row) => ({
          label: row.status,
          value: row._count.status,
        })),
        supportByStatus: supportStatuses.map((row) => ({
          label: row.status,
          value: row._count.status,
        })),
        subscriptionsByStatus: subscriptionStatuses.map((row) => ({
          label: row.status,
          value: row._count.status,
        })),
      },
      summaries: {
        marketplace: {
          products: marketplaceProductCount,
          activeProducts: marketplaceActiveCount,
          orders: marketplaceOrderCount,
          pendingOrders: marketplacePendingOrderCount,
        },
        jobs: {
          jobs: jobsCount,
          openJobs: jobsOpenCount,
          applications: jobApplicationCount,
        },
        subscriptions: {
          active: activeSubscriptions,
          total: subscriptionStatuses.reduce((sum, row) => sum + row._count.status, 0),
        },
        support: {
          open: supportOpenCount,
          total: supportStatuses.reduce((sum, row) => sum + row._count.status, 0),
        },
        live: {
          streams: liveStreamCount,
          activeStreams: liveStreamLiveCount,
          calls: callSessionCount,
          activeCalls: callActiveCount,
        },
      },
      recentActivity: recentAuditLogs.map((item) => ({
        id: item.id,
        action: item.action,
        entityType: item.entityType,
        entityId: item.entityId,
        createdAt: item.createdAt.toISOString(),
        metadata: this.readObject(item.metadata),
      })),
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
      enforcementAction?: 'suspend' | 'restrict' | 'clear';
      suspendedUntil?: string;
      restrictedUntil?: string;
      restrictionScope?: string[];
      restrictionReason?: string;
    },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.appUser.findUnique({
      where: { id: userId },
    });
    if (!existing) {
      throw new NotFoundException(`User ${userId} not found.`);
    }

    const enforcement = this.buildUserEnforcementPatch(
      this.readObject(existing.profileSetup),
      patch,
      actorAdminId,
    );
    const derivedStatus =
      patch.status?.trim() ||
      (patch.enforcementAction === 'suspend'
        ? 'Suspended'
        : patch.enforcementAction === 'restrict'
          ? 'Restricted'
          : patch.enforcementAction === 'clear'
            ? 'Active'
            : undefined);
    const derivedBlocked =
      typeof patch.blocked === 'boolean'
        ? patch.blocked
        : patch.enforcementAction === 'suspend'
          ? true
          : patch.enforcementAction === 'restrict'
            ? false
          : patch.enforcementAction === 'clear'
            ? false
            : undefined;

    const updated = await this.prisma.appUser.update({
      where: { id: userId },
      data: {
        role: patch.role?.trim()
          ? this.normalizeManagedAppUserRole(patch.role)
          : undefined,
        status: derivedStatus,
        verification: patch.verification?.trim() || undefined,
        blocked: derivedBlocked,
        note: patch.note?.trim() || undefined,
        ...(enforcement.changed
          ? { profileSetup: enforcement.profileSetup as Prisma.InputJsonValue }
          : {}),
        updatedAt: new Date(),
      },
    });

    if (patch.enforcementAction === 'restrict') {
      await this.sendUserRestrictionNotification(updated);
    }

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
    let targetLabel = '';

    if (normalizedType === 'post') {
      const updated = await this.prisma.appPost.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(deletedAt ? { deletedAt } : {}),
        },
        select: {
          id: true,
          caption: true,
        },
      });
      targetLabel = updated.caption?.trim() || updated.id;
    } else if (normalizedType === 'reel') {
      const updated = await this.prisma.reel.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(deletedAt ? { deletedAt } : {}),
        },
        select: {
          id: true,
          caption: true,
        },
      });
      targetLabel = updated.caption?.trim() || updated.id;
    } else {
      const updated = await this.prisma.story.update({
        where: { id },
        data: {
          ...(status ? { status } : {}),
          ...(deletedAt ? { deletedAt } : {}),
        },
        select: {
          id: true,
          text: true,
        },
      });
      targetLabel = updated.text?.trim() || updated.id;
    }

    await this.upsertModerationCaseForTarget(
      {
        title: `Admin ${normalizedType} moderation`,
        type: 'admin_moderation',
        targetType: normalizedType,
        targetId: id,
        targetLabel,
        reason:
          patch.note?.trim() ||
          (patch.remove
            ? `Removed ${normalizedType} from admin moderation surface`
            : `Updated ${normalizedType} moderation state`),
        status:
          patch.remove
            ? 'resolved'
            : this.resolveModerationStatusFromAction(
                patch.status?.trim()?.toLowerCase() || 'review',
                'open',
              ),
        severity: patch.remove ? 'high' : 'medium',
        action:
          patch.remove
            ? 'remove'
            : patch.status?.trim()?.toLowerCase() || 'review',
        note: patch.note?.trim() || null,
        enforcementAction: patch.remove
          ? `remove_${normalizedType}`
          : patch.status?.trim() || 'review',
        metadata: {
          source: 'admin.content.moderate',
        },
      },
      actorAdminId,
    );

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

  async moderateContentById(
    id: string,
    patch: {
      targetType?: 'post' | 'reel' | 'story';
      status?: string;
      remove?: boolean;
      note?: string;
    },
    actorAdminId?: string,
  ) {
    const targetType = patch.targetType ?? (await this.resolveModerationTargetType(id));
    return this.moderateContent(targetType, id, patch, actorAdminId);
  }

  async queryAdminComments(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const status = query.status?.trim().toLowerCase();
    const search = query.search?.trim();
    const where: Prisma.AppPostCommentWhereInput = {
      ...(status === 'reported' ? { isReported: true } : {}),
      ...(search
        ? {
            OR: [
              { message: { contains: search, mode: 'insensitive' } },
              { authorName: { contains: search, mode: 'insensitive' } },
              { postId: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      this.prisma.appPostComment.count({ where }),
      this.prisma.appPostComment.findMany({
        where,
        include: {
          author: true,
          post: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return this.wrapPaginated(
      items.map((item) => ({
        id: item.id,
        postId: item.postId,
        postCaption: item.post.caption,
        authorId: item.authorId,
        authorName: item.author?.name ?? item.authorName,
        authorUsername: item.author?.username ?? null,
        message: item.message,
        replyTo: item.replyTo,
        likeCount: item.likeCount,
        isLikedByMe: item.isLikedByMe,
        isReported: item.isReported,
        isEdited: item.isEdited,
        mentions: this.readStringArray(item.mentions),
        status: item.isReported ? 'reported' : 'visible',
        createdAt: item.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
    );
  }

  async moderateComment(
    id: string,
    patch: {
      reported?: boolean;
      remove?: boolean;
      note?: string;
    },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.appPostComment.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Comment ${id} not found.`);
    }

    if (patch.remove) {
      await this.upsertModerationCaseForTarget(
        {
          title: 'Admin comment moderation',
          type: 'admin_moderation',
          targetType: 'post_comment',
          targetId: existing.id,
          targetLabel: existing.message?.trim() || existing.id,
          reason:
            patch.note?.trim() ||
            'Removed reported comment from admin moderation surface',
          status: 'resolved',
          severity: 'high',
          action: 'remove',
          note: patch.note?.trim() || null,
          enforcementAction: 'remove_comment',
          metadata: {
            source: 'admin.comment.moderate',
            postId: existing.postId,
          },
        },
        actorAdminId,
      );

      await this.prisma.appPostComment.delete({
        where: { id },
      });

      await this.createAuditLog({
        actorAdminId,
        action: 'admin.comment.delete',
        entityType: 'post_comment',
        entityId: id,
        metadata: patch,
      });

      return {
        id,
        deleted: true,
      };
    }

    const updated = await this.prisma.appPostComment.update({
      where: { id },
      data: {
        ...(patch.reported === undefined ? {} : { isReported: patch.reported }),
      },
      include: {
        author: true,
        post: true,
      },
    });

    await this.upsertModerationCaseForTarget(
      {
        title: 'Admin comment moderation',
        type: 'admin_moderation',
        targetType: 'post_comment',
        targetId: updated.id,
        targetLabel: updated.message?.trim() || updated.id,
        reason:
          patch.note?.trim() ||
          (updated.isReported ? 'Comment flagged for moderation review' : 'Comment moderation state updated'),
        status: updated.isReported ? 'reviewing' : 'open',
        severity: updated.isReported ? 'medium' : 'low',
        action: updated.isReported ? 'flag' : 'unflag',
        note: patch.note?.trim() || null,
        enforcementAction: updated.isReported ? 'flag_comment' : 'restore_comment',
        metadata: {
          source: 'admin.comment.moderate',
          postId: updated.postId,
        },
      },
      actorAdminId,
    );

    await this.createAuditLog({
      actorAdminId,
      action: 'admin.comment.moderate',
      entityType: 'post_comment',
      entityId: id,
      metadata: patch,
    });

    return {
      id: updated.id,
      postId: updated.postId,
      postCaption: updated.post.caption,
      authorId: updated.authorId,
      authorName: updated.author?.name ?? updated.authorName,
      message: updated.message,
      isReported: updated.isReported,
      status: updated.isReported ? 'reported' : 'visible',
      createdAt: updated.createdAt.toISOString(),
    };
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

    await this.upsertModerationCaseForTarget(
      {
        title: `Report: ${updated.reason}`,
        type: 'user_report',
        targetType: updated.targetEntityType || (updated.targetUserId ? 'user' : 'report'),
        targetId: updated.targetEntityId || updated.targetUserId || updated.id,
        targetLabel: updated.targetEntityId || updated.targetUserId || updated.id,
        reason: updated.reason,
        status: this.mapReportStatusToModerationStatus(updated.status),
        severity: this.deriveModerationSeverityFromReportReason(updated.reason),
        action: `report_${updated.status}`,
        note: patch.note?.trim() || null,
        enforcementAction:
          updated.status === 'resolved'
            ? 'report_resolved'
            : updated.status === 'rejected'
              ? 'report_rejected'
              : 'report_review',
        metadata: {
          source: 'admin.report.update',
          reportId: updated.id,
          reportStatus: updated.status,
          reporterUserId: updated.reporterUserId,
          targetUserId: updated.targetUserId,
        },
      },
      actorAdminId,
    );

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
        externalAppName: item.externalAppName ?? null,
        externalAppLink: item.externalAppLink ?? null,
        playStoreUrl: item.playStoreUrl ?? null,
        androidPackage: item.androidPackage ?? null,
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

  async createAdminMarketplace(
    input: {
      sellerId: string;
      title: string;
      description: string;
      price: number;
      category: string;
      currency?: string;
      subcategory?: string;
      condition?: string;
      location?: string;
      images?: string[];
      externalAppName?: string;
      externalAppLink?: string;
      playStoreUrl?: string;
      androidPackage?: string;
      status?: string;
      stock?: number;
    },
    actorAdminId?: string,
  ) {
    await this.ensureUserExists(input.sellerId);
    const item = await this.prisma.marketplaceProduct.create({
      data: {
        id: makeId('product'),
        sellerId: input.sellerId.trim(),
        title: input.title.trim(),
        description: input.description.trim(),
        price: new Prisma.Decimal(input.price),
        currency: input.currency?.trim() || 'BDT',
        category: input.category.trim(),
        subcategory: input.subcategory?.trim() || null,
        condition: input.condition?.trim() || null,
        location: input.location?.trim() || null,
        images: (input.images ?? []).map((entry) => entry.trim()),
        externalAppName: input.externalAppName?.trim() || null,
        externalAppLink: input.externalAppLink?.trim() || null,
        playStoreUrl: input.playStoreUrl?.trim() || null,
        androidPackage: input.androidPackage?.trim() || null,
        status: input.status?.trim() || 'active',
        stock: input.stock ?? 1,
      },
      include: { seller: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'marketplace.create',
      entityType: 'marketplace_product',
      entityId: item.id,
      metadata: input,
    });

    return this.mapAdminMarketplaceRow(item);
  }

  async getAdminMarketplace(id: string) {
    const item = await this.prisma.marketplaceProduct.findUnique({
      where: { id },
      include: {
        seller: true,
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 25,
        },
        conversations: {
          orderBy: { updatedAt: 'desc' },
          take: 25,
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });
    if (!item) {
      throw new NotFoundException(`Marketplace item ${id} not found.`);
    }

    return {
      ...this.mapAdminMarketplaceRow(item),
      description: item.description,
      subcategory: item.subcategory,
      condition: item.condition,
      location: item.location,
      images: this.readStringArray(item.images),
      seller: {
        id: item.seller.id,
        name: item.seller.name,
        username: item.seller.username,
        avatarUrl: item.seller.avatar,
        role: item.seller.role,
        verification: item.seller.verification,
      },
      orderCount: item.orders.length,
      recentOrders: item.orders.map((order) => ({
        id: order.id,
        buyerId: order.buyerId,
        sellerId: order.sellerId,
        amount: Number(order.amount),
        status: order.status,
        deliveryMethod: order.deliveryMethod,
        paymentMethod: order.paymentMethod,
        createdAt: order.createdAt.toISOString(),
      })),
      recentConversations: item.conversations.map((conversation) => ({
        id: conversation.id,
        buyerId: conversation.buyerId,
        sellerId: conversation.sellerId,
        status: conversation.status,
        latestMessage: conversation.messages[0]?.text ?? '',
        updatedAt: conversation.updatedAt.toISOString(),
      })),
    };
  }

  async updateAdminMarketplace(
    id: string,
    patch: {
      sellerId?: string;
      title?: string;
      description?: string;
      price?: number;
      category?: string;
      currency?: string;
      subcategory?: string;
      condition?: string;
      location?: string;
      images?: string[];
      externalAppName?: string;
      externalAppLink?: string;
      playStoreUrl?: string;
      androidPackage?: string;
      status?: string;
      stock?: number;
    },
    actorAdminId?: string,
  ) {
    if (patch.sellerId?.trim()) {
      await this.ensureUserExists(patch.sellerId);
    }
    const existing = await this.prisma.marketplaceProduct.findUnique({
      where: { id },
      include: { seller: true },
    });
    if (!existing) {
      throw new NotFoundException(`Marketplace item ${id} not found.`);
    }

    const updated = await this.prisma.marketplaceProduct.update({
      where: { id },
      data: {
        sellerId: patch.sellerId?.trim() || undefined,
        title: patch.title?.trim() || undefined,
        description: patch.description?.trim() || undefined,
        price: patch.price === undefined ? undefined : new Prisma.Decimal(patch.price),
        category: patch.category?.trim() || undefined,
        currency: patch.currency?.trim() || undefined,
        subcategory:
          patch.subcategory === undefined ? undefined : patch.subcategory.trim() || null,
        condition: patch.condition === undefined ? undefined : patch.condition.trim() || null,
        location: patch.location === undefined ? undefined : patch.location.trim() || null,
        images: patch.images === undefined ? undefined : patch.images.map((entry) => entry.trim()),
        externalAppName:
          patch.externalAppName === undefined ? undefined : patch.externalAppName.trim() || null,
        externalAppLink:
          patch.externalAppLink === undefined ? undefined : patch.externalAppLink.trim() || null,
        playStoreUrl:
          patch.playStoreUrl === undefined ? undefined : patch.playStoreUrl.trim() || null,
        androidPackage:
          patch.androidPackage === undefined ? undefined : patch.androidPackage.trim() || null,
        status: patch.status?.trim() || undefined,
        stock: patch.stock,
        updatedAt: new Date(),
      },
      include: { seller: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'marketplace.update',
      entityType: 'marketplace_product',
      entityId: updated.id,
      metadata: patch,
    });

    return this.mapAdminMarketplaceRow(updated);
  }

  async deleteAdminMarketplace(id: string, actorAdminId?: string) {
    const existing = await this.prisma.marketplaceProduct.findUnique({
      where: { id },
      include: { seller: true },
    });
    if (!existing) {
      throw new NotFoundException(`Marketplace item ${id} not found.`);
    }

    await this.prisma.marketplaceProduct.delete({ where: { id } });
    await this.createAuditLog({
      actorAdminId,
      action: 'marketplace.delete',
      entityType: 'marketplace_product',
      entityId: id,
      metadata: {
        title: existing.title,
        sellerId: existing.sellerId,
      },
    });

    return {
      id,
      deleted: true,
    };
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

  async createAdminJob(
    input: {
      recruiterId: string;
      title: string;
      company: string;
      description: string;
      type: string;
      location?: string;
      experienceLevel?: string;
      salaryMin?: number;
      salaryMax?: number;
      currency?: string;
      status?: string;
      skills?: string[];
    },
    actorAdminId?: string,
  ) {
    const recruiter = await this.ensureUserExists(input.recruiterId);
    const item = await this.prisma.job.create({
      data: {
        id: makeId('job'),
        recruiterId: recruiter.id,
        title: input.title.trim(),
        company: input.company.trim(),
        description: input.description.trim(),
        location: input.location?.trim() || null,
        type: input.type.trim(),
        experienceLevel: input.experienceLevel?.trim() || null,
        salaryMin: input.salaryMin,
        salaryMax: input.salaryMax,
        currency: input.currency?.trim() || 'BDT',
        status: input.status?.trim() || 'open',
        skills: (input.skills ?? []).map((entry) => entry.trim()),
      },
      include: { recruiter: true, applications: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'job.create',
      entityType: 'job',
      entityId: item.id,
      metadata: input,
    });

    return this.mapAdminJobRow(item);
  }

  async getAdminJob(id: string) {
    const item = await this.prisma.job.findUnique({
      where: { id },
      include: {
        recruiter: true,
        applications: {
          include: {
            applicant: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!item) {
      throw new NotFoundException(`Job ${id} not found.`);
    }

    return {
      ...this.mapAdminJobRow(item),
      description: item.description,
      location: item.location,
      experienceLevel: item.experienceLevel,
      salaryMin: item.salaryMin,
      salaryMax: item.salaryMax,
      currency: item.currency,
      skills: this.readStringArray(item.skills),
      metadata: this.readObject(item.metadata),
      recruiter: {
        id: item.recruiter.id,
        name: item.recruiter.name,
        username: item.recruiter.username,
        avatarUrl: item.recruiter.avatar,
        role: item.recruiter.role,
        verification: item.recruiter.verification,
      },
      applicants: item.applications.map((application) => ({
        id: application.id,
        applicantId: application.applicantId,
        applicantName: application.applicantName || application.applicant.name,
        status: application.status,
        resumeUrl: application.resumeUrl,
        createdAt: application.createdAt.toISOString(),
      })),
    };
  }

  async updateAdminJob(
    id: string,
    patch: {
      recruiterId?: string;
      title?: string;
      company?: string;
      description?: string;
      type?: string;
      location?: string;
      experienceLevel?: string;
      salaryMin?: number;
      salaryMax?: number;
      currency?: string;
      status?: string;
      skills?: string[];
    },
    actorAdminId?: string,
  ) {
    if (patch.recruiterId?.trim()) {
      await this.ensureUserExists(patch.recruiterId);
    }
    const existing = await this.prisma.job.findUnique({
      where: { id },
      include: { recruiter: true, applications: true },
    });
    if (!existing) {
      throw new NotFoundException(`Job ${id} not found.`);
    }

    const updated = await this.prisma.job.update({
      where: { id },
      data: {
        recruiterId: patch.recruiterId?.trim() || undefined,
        title: patch.title?.trim() || undefined,
        company: patch.company?.trim() || undefined,
        description: patch.description?.trim() || undefined,
        type: patch.type?.trim() || undefined,
        location: patch.location === undefined ? undefined : patch.location.trim() || null,
        experienceLevel:
          patch.experienceLevel === undefined
            ? undefined
            : patch.experienceLevel.trim() || null,
        salaryMin: patch.salaryMin,
        salaryMax: patch.salaryMax,
        currency: patch.currency?.trim() || undefined,
        status: patch.status?.trim() || undefined,
        skills: patch.skills === undefined ? undefined : patch.skills.map((entry) => entry.trim()),
        updatedAt: new Date(),
      },
      include: { recruiter: true, applications: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'job.update',
      entityType: 'job',
      entityId: updated.id,
      metadata: patch,
    });

    return this.mapAdminJobRow(updated);
  }

  async deleteAdminJob(id: string, actorAdminId?: string) {
    const existing = await this.prisma.job.findUnique({
      where: { id },
      include: { recruiter: true, applications: true },
    });
    if (!existing) {
      throw new NotFoundException(`Job ${id} not found.`);
    }

    await this.prisma.job.delete({ where: { id } });
    await this.createAuditLog({
      actorAdminId,
      action: 'job.delete',
      entityType: 'job',
      entityId: id,
      metadata: {
        title: existing.title,
        recruiterId: existing.recruiterId,
      },
    });

    return {
      id,
      deleted: true,
    };
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

  async createAdminEvent(
    input: {
      organizerId: string;
      title: string;
      date: string;
      time: string;
      location: string;
      description?: string;
      organizerName?: string;
      category?: string;
      price?: number;
      status?: string;
    },
    actorAdminId?: string,
  ) {
    const organizer = await this.ensureUserExists(input.organizerId);
    const item = await this.prisma.event.create({
      data: {
        id: makeId('event'),
        organizerId: organizer.id,
        organizerName: input.organizerName?.trim() || organizer.name,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        date: input.date.trim(),
        time: input.time.trim(),
        location: input.location.trim(),
        category: input.category?.trim() || null,
        price: new Prisma.Decimal(input.price ?? 0),
        status: input.status?.trim() || 'review',
      },
      include: { organizer: true, rsvps: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'event.create',
      entityType: 'event',
      entityId: item.id,
      metadata: input,
    });

    return this.mapAdminEventRow(item);
  }

  async getAdminEvent(id: string) {
    const item = await this.prisma.event.findUnique({
      where: { id },
      include: {
        organizer: true,
        rsvps: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!item) {
      throw new NotFoundException(`Event ${id} not found.`);
    }

    return {
      ...this.mapAdminEventRow(item),
      description: item.description,
      date: item.date,
      time: item.time,
      category: item.category,
      savedCount: item.savedCount,
      attendees: item.rsvps.map((rsvp) => ({
        userId: rsvp.userId,
        status: rsvp.status,
        saved: rsvp.saved,
        createdAt: rsvp.createdAt.toISOString(),
      })),
    };
  }

  async updateAdminEvent(
    id: string,
    patch: {
      organizerId?: string;
      title?: string;
      date?: string;
      time?: string;
      location?: string;
      description?: string;
      organizerName?: string;
      category?: string;
      price?: number;
      status?: string;
    },
    actorAdminId?: string,
  ) {
    if (patch.organizerId?.trim()) {
      await this.ensureUserExists(patch.organizerId);
    }
    const existing = await this.prisma.event.findUnique({
      where: { id },
      include: { organizer: true, rsvps: true },
    });
    if (!existing) {
      throw new NotFoundException(`Event ${id} not found.`);
    }

    const updated = await this.prisma.event.update({
      where: { id },
      data: {
        organizerId: patch.organizerId?.trim() || undefined,
        organizerName: patch.organizerName?.trim() || undefined,
        title: patch.title?.trim() || undefined,
        description: patch.description === undefined ? undefined : patch.description.trim() || null,
        date: patch.date?.trim() || undefined,
        time: patch.time?.trim() || undefined,
        location: patch.location?.trim() || undefined,
        category: patch.category === undefined ? undefined : patch.category.trim() || null,
        price: patch.price === undefined ? undefined : new Prisma.Decimal(patch.price),
        status: patch.status?.trim() || undefined,
        updatedAt: new Date(),
      },
      include: { organizer: true, rsvps: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'event.update',
      entityType: 'event',
      entityId: updated.id,
      metadata: patch,
    });

    return this.mapAdminEventRow(updated);
  }

  async deleteAdminEvent(id: string, actorAdminId?: string) {
    const existing = await this.prisma.event.findUnique({
      where: { id },
      include: { organizer: true, rsvps: true },
    });
    if (!existing) {
      throw new NotFoundException(`Event ${id} not found.`);
    }

    await this.prisma.event.delete({ where: { id } });
    await this.createAuditLog({
      actorAdminId,
      action: 'event.delete',
      entityType: 'event',
      entityId: id,
      metadata: {
        title: existing.title,
        organizerId: existing.organizerId,
      },
    });

    return {
      id,
      deleted: true,
    };
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
      ...(query.status?.trim().toLowerCase() === 'active'
        ? { deletedAt: null }
        : query.status?.trim().toLowerCase() === 'deleted'
          ? { deletedAt: { not: null } }
          : {}),
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

  async createAdminCommunity(
    input: {
      ownerId: string;
      name: string;
      description: string;
      privacy?: string;
      category?: string;
      location?: string;
      approvalRequired?: boolean;
      allowEvents?: boolean;
      allowLive?: boolean;
      allowPolls?: boolean;
      allowMarketplace?: boolean;
      allowChatRoom?: boolean;
      notificationLevel?: string;
    },
    actorAdminId?: string,
  ) {
    const owner = await this.prisma.appUser.findUnique({
      where: { id: input.ownerId },
    });
    if (!owner) {
      throw new NotFoundException(`Community owner ${input.ownerId} not found.`);
    }

    const created = await this.prisma.community.create({
      data: {
        id: makeId('community'),
        ownerId: owner.id,
        ownerName: owner.name,
        name: input.name.trim(),
        description: input.description.trim(),
        privacy: input.privacy?.trim() || 'public',
        category: input.category?.trim() || null,
        location: input.location?.trim() || null,
        approvalRequired: input.approvalRequired ?? false,
        allowEvents: input.allowEvents ?? true,
        allowLive: input.allowLive ?? false,
        allowPolls: input.allowPolls ?? true,
        allowMarketplace: input.allowMarketplace ?? false,
        allowChatRoom: input.allowChatRoom ?? true,
        notificationLevel: input.notificationLevel?.trim() || 'all',
        memberCount: 1,
        members: {
          create: {
            userId: owner.id,
            role: 'admin',
            status: 'active',
          },
        },
      },
      include: { owner: true, members: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'community.create',
      entityType: 'community',
      entityId: created.id,
      metadata: input,
    });

    return this.mapAdminCommunityRow(created);
  }

  async updateAdminCommunity(
    id: string,
    patch: {
      name?: string;
      description?: string;
      privacy?: string;
      category?: string;
      location?: string;
      approvalRequired?: boolean;
      allowEvents?: boolean;
      allowLive?: boolean;
      allowPolls?: boolean;
      allowMarketplace?: boolean;
      allowChatRoom?: boolean;
      notificationLevel?: string;
      status?: string;
    },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.community.findUnique({
      where: { id },
      include: { owner: true, members: true },
    });
    if (!existing) {
      throw new NotFoundException(`Community ${id} not found.`);
    }

    const normalizedStatus = patch.status?.trim().toLowerCase();
    const updated = await this.prisma.community.update({
      where: { id },
      data: {
        name: patch.name?.trim() || undefined,
        description: patch.description?.trim() || undefined,
        privacy: patch.privacy?.trim() || undefined,
        category: patch.category === undefined ? undefined : patch.category.trim() || null,
        location: patch.location === undefined ? undefined : patch.location.trim() || null,
        approvalRequired: patch.approvalRequired,
        allowEvents: patch.allowEvents,
        allowLive: patch.allowLive,
        allowPolls: patch.allowPolls,
        allowMarketplace: patch.allowMarketplace,
        allowChatRoom: patch.allowChatRoom,
        notificationLevel: patch.notificationLevel?.trim() || undefined,
        deletedAt:
          normalizedStatus === undefined
            ? undefined
            : normalizedStatus === 'deleted'
              ? new Date()
              : null,
        updatedAt: new Date(),
      },
      include: { owner: true, members: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'community.update',
      entityType: 'community',
      entityId: updated.id,
      metadata: patch,
    });

    return this.mapAdminCommunityRow(updated);
  }

  async deleteAdminCommunity(id: string, actorAdminId?: string) {
    const existing = await this.prisma.community.findUnique({
      where: { id },
      include: { owner: true, members: true },
    });
    if (!existing) {
      throw new NotFoundException(`Community ${id} not found.`);
    }

    const deleted = await this.prisma.community.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedAt: new Date(),
      },
      include: { owner: true, members: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'community.delete',
      entityType: 'community',
      entityId: deleted.id,
      metadata: { deletedAt: deleted.deletedAt?.toISOString() ?? null },
    });

    return {
      id: deleted.id,
      deleted: true,
      status: 'deleted',
    };
  }

  async getAdminCommunity(id: string) {
    const item = await this.prisma.community.findUnique({
      where: { id },
      include: { owner: true, members: true },
    });
    if (!item) {
      throw new NotFoundException(`Community ${id} not found.`);
    }
    return this.mapAdminCommunityRow(item);
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

  async createAdminPage(
    input: {
      ownerId: string;
      name: string;
      about: string;
      category: string;
      location?: string;
      contactLabel?: string;
    },
    actorAdminId?: string,
  ) {
    const owner = await this.prisma.appUser.findUnique({
      where: { id: input.ownerId },
    });
    if (!owner) {
      throw new NotFoundException(`Page owner ${input.ownerId} not found.`);
    }

    const created = await this.prisma.page.create({
      data: {
        id: makeId('page'),
        ownerId: owner.id,
        name: input.name.trim(),
        about: input.about.trim(),
        category: input.category.trim(),
        location: input.location?.trim() || null,
        contactLabel: input.contactLabel?.trim() || null,
      },
      include: { owner: true, followers: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'page.create',
      entityType: 'page',
      entityId: created.id,
      metadata: input,
    });

    return this.mapAdminPageRow(created);
  }

  async updateAdminPage(
    id: string,
    patch: {
      name?: string;
      about?: string;
      category?: string;
      location?: string;
      contactLabel?: string;
    },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.page.findUnique({
      where: { id },
      include: { owner: true, followers: true },
    });
    if (!existing) {
      throw new NotFoundException(`Page ${id} not found.`);
    }

    const updated = await this.prisma.page.update({
      where: { id },
      data: {
        name: patch.name?.trim() || undefined,
        about: patch.about?.trim() || undefined,
        category: patch.category?.trim() || undefined,
        location: patch.location === undefined ? undefined : patch.location.trim() || null,
        contactLabel:
          patch.contactLabel === undefined ? undefined : patch.contactLabel.trim() || null,
        updatedAt: new Date(),
      },
      include: { owner: true, followers: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'page.update',
      entityType: 'page',
      entityId: updated.id,
      metadata: patch,
    });

    return this.mapAdminPageRow(updated);
  }

  async deleteAdminPage(id: string, actorAdminId?: string) {
    const existing = await this.prisma.page.findUnique({
      where: { id },
      include: { owner: true, followers: true },
    });
    if (!existing) {
      throw new NotFoundException(`Page ${id} not found.`);
    }

    await this.prisma.page.delete({
      where: { id },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'page.delete',
      entityType: 'page',
      entityId: id,
      metadata: { name: existing.name, ownerId: existing.ownerId },
    });

    return {
      id,
      deleted: true,
    };
  }

  async getAdminPage(id: string) {
    const item = await this.prisma.page.findUnique({
      where: { id },
      include: { owner: true, followers: true },
    });
    if (!item) {
      throw new NotFoundException(`Page ${id} not found.`);
    }
    return this.mapAdminPageRow(item);
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

  async createAdminLiveStream(
    input: {
      hostId: string;
      title: string;
      description?: string;
      category?: string;
      audience?: string;
      location?: string;
      status?: string;
      commentsEnabled?: boolean;
      slowModeSeconds?: number;
      previewImageUrl?: string;
    },
    actorAdminId?: string,
  ) {
    const host = await this.prisma.appUser.findUnique({
      where: { id: input.hostId },
    });
    if (!host) {
      throw new NotFoundException(`Live stream host ${input.hostId} not found.`);
    }

    const status = input.status?.trim() || 'scheduled';
    const now = new Date();
    const created = await this.prisma.liveStreamSession.create({
      data: {
        id: makeId('live_stream'),
        hostId: host.id,
        title: input.title.trim(),
        description: input.description?.trim() || '',
        category: input.category?.trim() || 'Live',
        audience: input.audience?.trim() || 'public',
        location: input.location?.trim() || null,
        status,
        previewImageUrl: input.previewImageUrl?.trim() || null,
        metadata: {
          moderation: {
            commentsEnabled: input.commentsEnabled ?? true,
            slowModeSeconds: input.slowModeSeconds ?? 0,
          },
        } as Prisma.InputJsonValue,
        ...(status.toLowerCase() === 'live' ? { startedAt: now } : {}),
        ...(status.toLowerCase() === 'ended' ? { endedAt: now } : {}),
      },
      include: { host: true, comments: true, reactions: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'live_stream.create',
      entityType: 'live_stream',
      entityId: created.id,
      metadata: input,
    });

    return {
      id: created.id,
      title: created.title,
      description: created.description,
      hostName: created.host.name,
      hostId: created.hostId,
      category: created.category,
      status: created.status,
      audience: created.audience,
      viewerCount: created.viewerCount,
      comments: created.comments.length,
      reactions: created.reactions.length,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  async updateAdminLiveStream(
    id: string,
    patch: {
      status?: string;
      title?: string;
      description?: string;
      category?: string;
      audience?: string;
      commentsEnabled?: boolean;
      slowModeSeconds?: number;
      note?: string;
    },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.liveStreamSession.findUnique({
      where: { id },
      include: { host: true, comments: true, reactions: true },
    });
    if (!existing) {
      throw new NotFoundException(`Live stream ${id} not found.`);
    }

    const metadata = this.readObject(existing.metadata);
    const moderation = this.readObject(metadata.moderation);
    const updated = await this.prisma.liveStreamSession.update({
      where: { id },
      data: {
        status: patch.status?.trim() || undefined,
        title: patch.title?.trim() || undefined,
        description: patch.description?.trim() || undefined,
        category: patch.category?.trim() || undefined,
        audience: patch.audience?.trim() || undefined,
        metadata: {
          ...metadata,
          moderation: {
            ...moderation,
            ...(patch.commentsEnabled === undefined
              ? {}
              : { commentsEnabled: patch.commentsEnabled }),
            ...(patch.slowModeSeconds === undefined
              ? {}
              : { slowModeSeconds: patch.slowModeSeconds }),
            ...(patch.note?.trim() ? { note: patch.note.trim() } : {}),
          },
        } as Prisma.InputJsonValue,
        ...(patch.status?.trim().toLowerCase() === 'ended'
          ? { endedAt: new Date() }
          : patch.status?.trim().toLowerCase() === 'live'
            ? { startedAt: existing.startedAt ?? new Date() }
            : {}),
        updatedAt: new Date(),
      },
      include: { host: true, comments: true, reactions: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'live_stream.update',
      entityType: 'live_stream',
      entityId: updated.id,
      metadata: patch,
    });

    return {
      id: updated.id,
      title: updated.title,
      hostName: updated.host.name,
      hostId: updated.hostId,
      category: updated.category,
      status: updated.status,
      audience: updated.audience,
      viewerCount: updated.viewerCount,
      comments: updated.comments.length,
      reactions: updated.reactions.length,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteAdminLiveStream(id: string, actorAdminId?: string) {
    const existing = await this.prisma.liveStreamSession.findUnique({
      where: { id },
      include: { host: true },
    });
    if (!existing) {
      throw new NotFoundException(`Live stream ${id} not found.`);
    }

    await this.prisma.liveStreamSession.delete({
      where: { id },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'live_stream.delete',
      entityType: 'live_stream',
      entityId: id,
      metadata: { title: existing.title, hostId: existing.hostId },
    });

    return {
      id,
      deleted: true,
    };
  }

  async getAdminLiveStream(id: string) {
    const item = await this.prisma.liveStreamSession.findUnique({
      where: { id },
      include: { host: true, comments: true, reactions: true },
    });
    if (!item) {
      throw new NotFoundException(`Live stream ${id} not found.`);
    }

    return {
      id: item.id,
      title: item.title,
      description: item.description,
      hostName: item.host.name,
      hostId: item.hostId,
      category: item.category,
      status: item.status,
      audience: item.audience,
      location: item.location,
      viewerCount: item.viewerCount,
      comments: item.comments.length,
      reactions: item.reactions.length,
      quickOptions: this.readArrayObjects(item.quickOptions),
      metadata: this.readObject(item.metadata),
      startedAt: item.startedAt?.toISOString() ?? null,
      endedAt: item.endedAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
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

  async queryAdminWallet(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.WalletTransactionWhereInput = {
      ...(query.status?.trim() ? { status: query.status.trim() } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { description: { contains: query.search.trim(), mode: 'insensitive' } },
              { type: { contains: query.search.trim(), mode: 'insensitive' } },
              { user: { name: { contains: query.search.trim(), mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.walletTransaction.count({ where }),
      this.prisma.walletTransaction.findMany({
        where,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const payload = this.wrapPaginated(
      items.map((item) => ({
        id: item.id,
        userName: item.user.name,
        userId: item.userId,
        type: item.type,
        amount: Number(item.amount),
        currency: item.currency,
        status: item.status,
        description: item.description,
        createdAt: item.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
    );
    return {
      ...payload,
      filters: {
        search: query.search?.trim() || '',
        status: query.status?.trim().toLowerCase() || '',
      },
    };
  }

  async getAdminWalletTransaction(id: string) {
    const item = await this.prisma.walletTransaction.findUnique({
      where: { id },
      include: { user: true, walletAccount: true },
    });
    if (!item) {
      throw new NotFoundException(`Wallet transaction ${id} not found.`);
    }

    return {
      id: item.id,
      walletAccountId: item.walletAccountId,
      userName: item.user.name,
      userId: item.userId,
      type: item.type,
      amount: Number(item.amount),
      currency: item.currency,
      status: item.status,
      description: item.description,
      metadata: this.readObject(item.metadata),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.createdAt.toISOString(),
    };
  }

  async queryAdminSubscriptions(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.SubscriptionWhereInput = {
      ...(query.status?.trim() ? { status: query.status.trim() } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { planCode: { contains: query.search.trim(), mode: 'insensitive' } },
              { provider: { contains: query.search.trim(), mode: 'insensitive' } },
              { user: { name: { contains: query.search.trim(), mode: 'insensitive' } } },
              { plan: { name: { contains: query.search.trim(), mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.subscription.count({ where }),
      this.prisma.subscription.findMany({
        where,
        include: { user: true, plan: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return this.wrapPaginated(
      items.map((item) => ({
        id: item.id,
        userName: item.user.name,
        userId: item.userId,
        planId: item.planId,
        planCode: item.planCode,
        planName: item.plan?.name ?? item.planCode,
        provider: item.provider,
        status: item.status,
        autoRenew: item.autoRenew,
        currentPeriodEnd: item.currentPeriodEnd?.toISOString() ?? null,
        createdAt: item.createdAt.toISOString(),
      })),
      page,
      limit,
      total,
    );
  }

  async getAdminSubscription(id: string) {
    const item = await this.prisma.subscription.findUnique({
      where: { id },
      include: { user: true, plan: true },
    });
    if (!item) {
      throw new NotFoundException(`Subscription ${id} not found.`);
    }

    return {
      id: item.id,
      userName: item.user.name,
      userId: item.userId,
      planId: item.planId,
      planCode: item.planCode,
      planName: item.plan?.name ?? item.planCode,
      provider: item.provider,
      status: item.status,
      autoRenew: item.autoRenew,
      currentPeriodEnd: item.currentPeriodEnd?.toISOString() ?? null,
      metadata: this.readObject(item.metadata),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async exportAdminRevenue(
    query: {
      search?: string;
      status?: string;
    },
    actorAdminId?: string,
  ) {
    const walletWhere: Prisma.WalletTransactionWhereInput = {
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
    const subscriptionWhere: Prisma.SubscriptionWhereInput = {
      ...(query.status?.trim() ? { status: query.status.trim() } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { planCode: { contains: query.search.trim(), mode: 'insensitive' } },
              { provider: { contains: query.search.trim(), mode: 'insensitive' } },
              { user: { name: { contains: query.search.trim(), mode: 'insensitive' } } },
            ],
          }
        : {}),
    };

    const [walletRows, subscriptions, aggregate] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: walletWhere,
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.subscription.findMany({
        where: subscriptionWhere,
        include: { user: true, plan: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.walletTransaction.aggregate({
        where: walletWhere,
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    await this.createAuditLog({
      actorAdminId,
      action: 'revenue.export',
      entityType: 'admin_export',
      metadata: {
        scope: 'revenue',
        search: query.search?.trim() || null,
        status: query.status?.trim() || null,
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalRevenue: Number(aggregate._sum.amount ?? 0),
        transactionCount: aggregate._count.id,
        subscriptionCount: subscriptions.length,
      },
      walletTransactions: walletRows.map((item) => ({
        id: item.id,
        userName: item.user.name,
        userId: item.userId,
        type: item.type,
        amount: Number(item.amount),
        currency: item.currency,
        status: item.status,
        createdAt: item.createdAt.toISOString(),
      })),
      subscriptions: subscriptions.map((item) => ({
        id: item.id,
        userName: item.user.name,
        userId: item.userId,
        planCode: item.planCode,
        planName: item.plan?.name ?? item.planCode,
        provider: item.provider,
        status: item.status,
        autoRenew: item.autoRenew,
        createdAt: item.createdAt.toISOString(),
      })),
    };
  }

  async exportAdminWallet(
    query: {
      search?: string;
      status?: string;
    },
    actorAdminId?: string,
  ) {
    const payload = await this.queryAdminWallet({
      page: 1,
      limit: 5000,
      search: query.search,
      status: query.status,
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'wallet.export',
      entityType: 'admin_export',
      metadata: {
        scope: 'wallet',
        search: query.search?.trim() || null,
        status: query.status?.trim() || null,
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      total: payload.total,
      filters: payload.filters,
      items: payload.items,
    };
  }

  async exportAdminSubscriptions(
    query: {
      search?: string;
      status?: string;
    },
    actorAdminId?: string,
  ) {
    const payload = await this.queryAdminSubscriptions({
      page: 1,
      limit: 5000,
      search: query.search,
      status: query.status,
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'subscription.export',
      entityType: 'admin_export',
      metadata: {
        scope: 'subscriptions',
        search: query.search?.trim() || null,
        status: query.status?.trim() || null,
      },
    });

    return {
      generatedAt: new Date().toISOString(),
      total: payload.total,
      items: payload.items,
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
        select: {
          id: true,
          token: true,
          platform: true,
          deviceLabel: true,
          appVersion: true,
          isActive: true,
          lastSeenAt: true,
          createdAt: true,
          updatedAt: true,
          userId: true,
          user: {
            select: {
              name: true,
            },
          },
        },
        where,
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
        appVersion: item.appVersion,
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

  async queryAdminNotificationCampaigns(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) {
    const page = this.resolvePage(query.page);
    const limit = this.resolveLimit(query.limit);
    const skip = (page - 1) * limit;
    const where: Prisma.NotificationCampaignWhereInput = {
      ...(query.status?.trim() ? { status: query.status.trim() } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { name: { contains: query.search.trim(), mode: 'insensitive' } },
              { audience: { contains: query.search.trim(), mode: 'insensitive' } },
              { schedule: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.notificationCampaign.count({ where }),
      this.prisma.notificationCampaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return this.wrapPaginated(
      items.map((item) => this.mapAdminNotificationCampaignRow(item)),
      page,
      limit,
      total,
    );
  }

  async getAdminNotificationCampaign(id: string) {
    const item = await this.prisma.notificationCampaign.findUnique({
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(`Notification campaign ${id} not found.`);
    }

    const lifecycleEvents = await this.readNotificationCampaignHistory(id);

    return {
      ...this.mapAdminNotificationCampaignRow(item),
      stats: {
        events: lifecycleEvents.length,
        lastAction: lifecycleEvents[0]?.action ?? null,
        lastActionAt: lifecycleEvents[0]?.createdAt ?? item.updatedAt.toISOString(),
      },
      lifecycleEvents,
    };
  }

  async createAdminNotificationCampaign(
    input: {
      name: string;
      audience: string;
      schedule: string;
      status?: string;
    },
    actorAdminId?: string,
  ) {
    const item = await this.prisma.notificationCampaign.create({
      data: {
        id: makeId('campaign'),
        name: input.name.trim(),
        audience: input.audience.trim(),
        schedule: input.schedule.trim(),
        status: input.status?.trim() || 'scheduled',
      },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'notification_campaign.create',
      entityType: 'notification_campaign',
      entityId: item.id,
      metadata: input,
    });
    await this.createNotificationCampaignHistory(item.id, 'create', actorAdminId, {
      audience: item.audience,
      schedule: item.schedule,
      status: item.status,
    });

    return this.getAdminNotificationCampaign(item.id);
  }

  async updateAdminNotificationCampaign(
    id: string,
    patch: {
      name?: string;
      audience?: string;
      schedule?: string;
      status?: string;
    },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.notificationCampaign.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Notification campaign ${id} not found.`);
    }

    const updated = await this.prisma.notificationCampaign.update({
      where: { id },
      data: {
        name: patch.name?.trim() || undefined,
        audience: patch.audience?.trim() || undefined,
        schedule: patch.schedule?.trim() || undefined,
        status: patch.status?.trim() || undefined,
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'notification_campaign.update',
      entityType: 'notification_campaign',
      entityId: updated.id,
      metadata: patch,
    });
    await this.createNotificationCampaignHistory(updated.id, 'update', actorAdminId, patch);

    return this.getAdminNotificationCampaign(updated.id);
  }

  async runAdminNotificationCampaignAction(
    id: string,
    input: {
      action: 'send' | 'schedule' | 'cancel' | 'delete';
      schedule?: string;
      note?: string;
    },
    actorAdminId?: string,
  ) {
    const action = input.action.trim().toLowerCase() as 'send' | 'schedule' | 'cancel' | 'delete';
    if (action === 'delete') {
      return this.deleteAdminNotificationCampaign(id, actorAdminId, input.note);
    }

    const existing = await this.prisma.notificationCampaign.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Notification campaign ${id} not found.`);
    }

    const nextStatus =
      action === 'send' ? 'sent' : action === 'cancel' ? 'cancelled' : 'scheduled';
    const updated = await this.prisma.notificationCampaign.update({
      where: { id },
      data: {
        status: nextStatus,
        schedule:
          action === 'schedule' && input.schedule?.trim()
            ? input.schedule.trim()
            : existing.schedule,
        updatedAt: new Date(),
      },
    });

    await this.createAuditLog({
      actorAdminId,
      action: `notification_campaign.${action}`,
      entityType: 'notification_campaign',
      entityId: updated.id,
      metadata: {
        note: input.note?.trim() || null,
        schedule: input.schedule?.trim() || null,
      },
    });
    await this.createNotificationCampaignHistory(updated.id, action, actorAdminId, {
      status: updated.status,
      schedule: updated.schedule,
      note: input.note?.trim() || null,
    });

    return this.getAdminNotificationCampaign(updated.id);
  }

  async deleteAdminNotificationCampaign(id: string, actorAdminId?: string, note?: string) {
    const existing = await this.prisma.notificationCampaign.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Notification campaign ${id} not found.`);
    }

    await this.createNotificationCampaignHistory(id, 'delete', actorAdminId, {
      name: existing.name,
      audience: existing.audience,
      note: note?.trim() || null,
    });
    await this.createAuditLog({
      actorAdminId,
      action: 'notification_campaign.delete',
      entityType: 'notification_campaign',
      entityId: id,
      metadata: {
        name: existing.name,
        audience: existing.audience,
        note: note?.trim() || null,
      },
    });
    await this.prisma.notificationCampaign.delete({
      where: { id },
    });

    return {
      id,
      deleted: true,
      name: existing.name,
    };
  }

  async updateAdminWalletSubscription(
    id: string,
    patch: {
      status?: string;
      autoRenew?: boolean;
      currentPeriodEnd?: string;
    },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.subscription.findUnique({
      where: { id },
      include: { user: true, plan: true },
    });
    if (!existing) {
      throw new NotFoundException(`Subscription ${id} not found.`);
    }

    const updated = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: patch.status?.trim() || undefined,
        autoRenew: patch.autoRenew,
        currentPeriodEnd:
          patch.currentPeriodEnd === undefined
            ? undefined
            : patch.currentPeriodEnd.trim()
              ? new Date(patch.currentPeriodEnd)
              : null,
        updatedAt: new Date(),
      },
      include: { user: true, plan: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'subscription.update',
      entityType: 'subscription',
      entityId: updated.id,
      metadata: patch,
    });

    return {
      id: updated.id,
      userName: updated.user.name,
      userId: updated.userId,
      planId: updated.planId,
      planCode: updated.planCode,
      planName: updated.plan?.name ?? updated.planCode,
      provider: updated.provider,
      status: updated.status,
      autoRenew: updated.autoRenew,
      currentPeriodEnd: updated.currentPeriodEnd?.toISOString() ?? null,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async updateAdminNotificationDevice(
    id: string,
    patch: { isActive: boolean },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.pushDeviceToken.findUnique({
      select: {
        id: true,
        token: true,
        platform: true,
        deviceLabel: true,
        appVersion: true,
        isActive: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Push notification device ${id} not found.`);
    }

    const updated = await this.prisma.pushDeviceToken.update({
      select: {
        id: true,
        token: true,
        platform: true,
        deviceLabel: true,
        appVersion: true,
        isActive: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      where: { id },
      data: {
        isActive: patch.isActive,
        updatedAt: new Date(),
        lastSeenAt: new Date(),
      },
    });

    await this.createAuditLog({
      actorAdminId,
      action: patch.isActive ? 'notification_device.activate' : 'notification_device.deactivate',
      entityType: 'notification_device',
      entityId: updated.id,
      metadata: {
        userId: updated.userId,
        token: updated.token,
        platform: updated.platform,
        isActive: updated.isActive,
      },
    });

    return {
      id: updated.id,
      userName: updated.user.name,
      userId: updated.userId,
      platform: updated.platform,
      deviceLabel: updated.deviceLabel,
      appVersion: updated.appVersion,
      status: updated.isActive ? 'active' : 'inactive',
      token: updated.token,
      lastSeenAt: updated.lastSeenAt.toISOString(),
      createdAt: updated.createdAt.toISOString(),
    };
  }

  async getAdminNotificationDevice(id: string) {
    const item = await this.prisma.pushDeviceToken.findUnique({
      select: {
        id: true,
        token: true,
        platform: true,
        deviceLabel: true,
        appVersion: true,
        isActive: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      where: { id },
    });
    if (!item) {
      throw new NotFoundException(`Push notification device ${id} not found.`);
    }

    return {
      id: item.id,
      userName: item.user.name,
      userId: item.userId,
      platform: item.platform,
      deviceLabel: item.deviceLabel,
      appVersion: item.appVersion,
      status: item.isActive ? 'active' : 'inactive',
      token: item.token,
      lastSeenAt: item.lastSeenAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async deleteAdminNotificationDevice(id: string, actorAdminId?: string) {
    const existing = await this.prisma.pushDeviceToken.findUnique({
      select: {
        id: true,
        token: true,
        platform: true,
        deviceLabel: true,
        appVersion: true,
        isActive: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        user: {
          select: {
            name: true,
          },
        },
      },
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException(`Push notification device ${id} not found.`);
    }

    await this.prisma.pushDeviceToken.delete({
      where: { id },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'notification_device.delete',
      entityType: 'notification_device',
      entityId: id,
      metadata: {
        userId: existing.userId,
        platform: existing.platform,
        deviceLabel: existing.deviceLabel,
      },
    });

    return {
      id,
      deleted: true,
      userName: existing.user.name,
    };
  }

  async queryAdminPremiumPlans(query: {
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
    const where: Prisma.PremiumPlanWhereInput = {
      ...(activeFilter === undefined ? {} : { isActive: activeFilter }),
      ...(query.search?.trim()
        ? {
            OR: [
              { code: { contains: query.search.trim(), mode: 'insensitive' } },
              { name: { contains: query.search.trim(), mode: 'insensitive' } },
              { description: { contains: query.search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [total, items] = await Promise.all([
      this.prisma.premiumPlan.count({ where }),
      this.prisma.premiumPlan.findMany({
        where,
        include: { subscriptions: true },
        orderBy: [{ price: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
    ]);

    return this.wrapPaginated(
      items.map((item) => ({
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        currency: item.currency,
        billingInterval: item.billingInterval,
        features: this.readStringArray(item.features),
        isActive: item.isActive,
        status: item.isActive ? 'active' : 'inactive',
        subscriptions: item.subscriptions.length,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      page,
      limit,
      total,
    );
  }

  async createAdminPremiumPlan(
    input: {
      code: string;
      name: string;
      description?: string;
      price: number;
      currency?: string;
      billingInterval?: string;
      features?: string[];
      isActive?: boolean;
    },
    actorAdminId?: string,
  ) {
    const item = await this.prisma.premiumPlan.create({
      data: {
        id: makeId('plan'),
        code: input.code.trim(),
        name: input.name.trim(),
        description: input.description?.trim() || null,
        price: new Prisma.Decimal(input.price),
        currency: input.currency?.trim() || 'BDT',
        billingInterval: input.billingInterval?.trim() || 'monthly',
        features: (input.features ?? []).map((entry) => entry.trim()),
        isActive: input.isActive ?? true,
      },
      include: { subscriptions: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'premium_plan.create',
      entityType: 'premium_plan',
      entityId: item.id,
      metadata: input,
    });

    return {
      id: item.id,
      code: item.code,
      name: item.name,
      description: item.description,
      price: Number(item.price),
      currency: item.currency,
      billingInterval: item.billingInterval,
      features: this.readStringArray(item.features),
      isActive: item.isActive,
      status: item.isActive ? 'active' : 'inactive',
      subscriptions: item.subscriptions.length,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  async updateAdminPremiumPlan(
    id: string,
    patch: {
      code?: string;
      name?: string;
      description?: string;
      price?: number;
      currency?: string;
      billingInterval?: string;
      features?: string[];
      isActive?: boolean;
    },
    actorAdminId?: string,
  ) {
    const existing = await this.prisma.premiumPlan.findUnique({
      where: { id },
      include: { subscriptions: true },
    });
    if (!existing) {
      throw new NotFoundException(`Premium plan ${id} not found.`);
    }

    const updated = await this.prisma.premiumPlan.update({
      where: { id },
      data: {
        code: patch.code?.trim() || undefined,
        name: patch.name?.trim() || undefined,
        description:
          patch.description === undefined ? undefined : patch.description.trim() || null,
        price: patch.price === undefined ? undefined : new Prisma.Decimal(patch.price),
        currency: patch.currency?.trim() || undefined,
        billingInterval: patch.billingInterval?.trim() || undefined,
        features:
          patch.features === undefined
            ? undefined
            : patch.features.map((entry) => entry.trim()),
        isActive: patch.isActive,
        updatedAt: new Date(),
      },
      include: { subscriptions: true },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'premium_plan.update',
      entityType: 'premium_plan',
      entityId: updated.id,
      metadata: patch,
    });

    return {
      id: updated.id,
      code: updated.code,
      name: updated.name,
      description: updated.description,
      price: Number(updated.price),
      currency: updated.currency,
      billingInterval: updated.billingInterval,
      features: this.readStringArray(updated.features),
      isActive: updated.isActive,
      status: updated.isActive ? 'active' : 'inactive',
      subscriptions: updated.subscriptions.length,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteAdminPremiumPlan(id: string, actorAdminId?: string) {
    const existing = await this.prisma.premiumPlan.findUnique({
      where: { id },
      include: { subscriptions: true },
    });
    if (!existing) {
      throw new NotFoundException(`Premium plan ${id} not found.`);
    }

    const activeSubscriptions = existing.subscriptions.filter(
      (item) => item.status.trim().toLowerCase() === 'active',
    ).length;
    if (activeSubscriptions > 0) {
      throw new ConflictException(
        `Premium plan ${id} cannot be deleted while ${activeSubscriptions} active subscription(s) still depend on it.`,
      );
    }

    await this.prisma.premiumPlan.delete({
      where: { id },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'premium_plan.delete',
      entityType: 'premium_plan',
      entityId: id,
      metadata: {
        code: existing.code,
        name: existing.name,
      },
    });

    return {
      id,
      deleted: true,
      code: existing.code,
      name: existing.name,
    };
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

  async listAdminAccounts() {
    const admins = await this.prisma.adminUser.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return admins.map((admin) => ({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      role: this.normalizeAdminRole(admin.role),
      isActive: admin.isActive,
      createdAt: admin.createdAt.toISOString(),
      updatedAt: admin.updatedAt.toISOString(),
    }));
  }

  async updateAdminAccount(
    adminId: string,
    patch: { name?: string; role?: string; isActive?: boolean },
    actorAdminId: string,
  ) {
    const actor = await this.getAdminUserById(actorAdminId);
    if (this.normalizeAdminRole(actor.role) !== 'superadmin') {
      throw new UnauthorizedException('Only superadmin can manage admin accounts.');
    }

    const existing = await this.getAdminUserById(adminId);
    const updated = await this.prisma.adminUser.update({
      where: { id: adminId },
      data: {
        name: patch.name?.trim() || undefined,
        role: patch.role?.trim() ? this.canonicalizeStoredAdminRole(patch.role) : undefined,
        isActive: patch.isActive ?? undefined,
      },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'admin.account.update',
      entityType: 'admin_user',
      entityId: adminId,
      metadata: {
        previousRole: this.normalizeAdminRole(existing.role),
        nextRole: this.normalizeAdminRole(updated.role),
        isActive: updated.isActive,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: this.normalizeAdminRole(updated.role),
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteAdminAccount(adminId: string, actorAdminId: string) {
    const actor = await this.getAdminUserById(actorAdminId);
    if (this.normalizeAdminRole(actor.role) !== 'superadmin') {
      throw new UnauthorizedException('Only superadmin can remove admin accounts.');
    }
    if (adminId === actorAdminId) {
      throw new ConflictException('Superadmin cannot remove the current signed-in account.');
    }

    const existing = await this.getAdminUserById(adminId);
    if (this.normalizeAdminRole(existing.role) === 'superadmin') {
      throw new ConflictException('Superadmin accounts cannot be removed from this route.');
    }

    await this.prisma.adminUser.delete({
      where: { id: adminId },
    });

    await this.createAuditLog({
      actorAdminId,
      action: 'admin.account.delete',
      entityType: 'admin_user',
      entityId: adminId,
      metadata: {
        email: existing.email,
        role: this.normalizeAdminRole(existing.role),
      },
    });

    return {
      id: existing.id,
      email: existing.email,
      deleted: true,
    };
  }

  async getSettings() {
    return this.getOperationalSettings();
  }

  async registerPushDevice(
    userId: string,
    input: { token: string; platform: string; deviceLabel?: string; appVersion?: string },
  ) {
    await this.coreDatabase.getUser(userId);
    const device = await this.prisma.pushDeviceToken.upsert({
      select: {
        id: true,
        token: true,
        platform: true,
        deviceLabel: true,
        appVersion: true,
        isActive: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { token: input.token.trim() },
      create: {
        id: makeId('push_device'),
        userId,
        token: input.token.trim(),
        platform: input.platform.trim(),
        deviceLabel: input.deviceLabel?.trim() || null,
        appVersion: input.appVersion?.trim() || null,
        isActive: true,
        lastSeenAt: new Date(),
      },
      update: {
        userId,
        platform: input.platform.trim(),
        deviceLabel: input.deviceLabel?.trim() || null,
        appVersion: input.appVersion?.trim() || null,
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
      appVersion: device.appVersion,
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

  async listUserPushDevices(
    userId: string,
    query?: {
      status?: string;
      platform?: string;
    },
  ) {
    const items = await this.prisma.pushDeviceToken.findMany({
      select: {
        id: true,
        token: true,
        platform: true,
        deviceLabel: true,
        appVersion: true,
        isActive: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        userId,
        ...(query?.platform?.trim()
          ? { platform: query.platform.trim().toLowerCase() }
          : {}),
        ...(query?.status?.trim().toLowerCase() === 'active'
          ? { isActive: true }
          : query?.status?.trim().toLowerCase() === 'inactive'
            ? { isActive: false }
            : {}),
      },
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
    });

    return items.map((item) => this.mapUserPushDevice(item));
  }

  async getUserPushDevice(userId: string, id: string) {
    const item = await this.prisma.pushDeviceToken.findFirst({
      select: {
        id: true,
        token: true,
        platform: true,
        deviceLabel: true,
        appVersion: true,
        isActive: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { id, userId },
    });
    if (!item) {
      throw new NotFoundException(`Push notification device ${id} not found.`);
    }

    return this.mapUserPushDevice(item);
  }

  async updateUserPushDevice(
    userId: string,
    id: string,
    patch: {
      enabled?: boolean;
      isActive?: boolean;
      deviceLabel?: string;
      appVersion?: string;
    },
  ) {
    const existing = await this.prisma.pushDeviceToken.findFirst({
      select: {
        id: true,
        token: true,
        platform: true,
        deviceLabel: true,
        appVersion: true,
        isActive: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException(`Push notification device ${id} not found.`);
    }

    const nextIsActive = patch.enabled === undefined ? patch.isActive : patch.enabled;
    const updated = await this.prisma.pushDeviceToken.update({
      select: {
        id: true,
        token: true,
        platform: true,
        deviceLabel: true,
        appVersion: true,
        isActive: true,
        lastSeenAt: true,
        createdAt: true,
        updatedAt: true,
      },
      where: { id: existing.id },
      data: {
        isActive: nextIsActive ?? undefined,
        deviceLabel:
          patch.deviceLabel === undefined ? undefined : patch.deviceLabel.trim() || null,
        appVersion:
          patch.appVersion === undefined ? undefined : patch.appVersion.trim() || null,
        lastSeenAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return this.mapUserPushDevice(updated);
  }

  async deleteUserPushDevice(userId: string, id: string) {
    const existing = await this.prisma.pushDeviceToken.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException(`Push notification device ${id} not found.`);
    }

    await this.prisma.pushDeviceToken.delete({
      where: { id: existing.id },
    });

    return {
      id: existing.id,
      deleted: true,
      token: existing.token,
    };
  }

  private async ensureDefaultAdmin() {
    const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
    if (!email || !password) {
      return;
    }
    const weakPasswords = new Set([
      'admin123',
      '123456',
      'password',
      'change_this_bootstrap_password',
    ]);
    if (password.length < 12 || weakPasswords.has(password.toLowerCase())) {
      throw new Error(
        'ADMIN_BOOTSTRAP_PASSWORD must be a strong non-demo value with at least 12 characters.',
      );
    }
    const name = process.env.ADMIN_BOOTSTRAP_NAME?.trim() || 'Admin';
    const role = this.canonicalizeStoredAdminRole(
      process.env.ADMIN_BOOTSTRAP_ROLE?.trim() || 'superadmin',
    );
    const forceSync =
      process.env.ADMIN_BOOTSTRAP_FORCE_SYNC?.trim().toLowerCase() === 'true';
    const existing = await this.prisma.adminUser.findUnique({
      where: { email },
    });

    if (!existing) {
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
      return;
    }

    if (!forceSync) {
      return;
    }

    await this.prisma.adminUser.update({
      where: { email },
      data: {
        name,
        role,
        passwordHash: await argon2.hash(password),
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

  private async sendUserRestrictionNotification(user: {
    id: string;
    name: string;
    profileSetup: Prisma.JsonValue;
  }) {
    const profileSetup = this.readObject(user.profileSetup);
    const moderation = this.mapUserAdminModeration(profileSetup.adminModeration);
    if (moderation.action !== 'restrict' || !moderation.active) {
      return;
    }

    const scopeLabel =
      moderation.restrictionScope.length > 0
        ? moderation.restrictionScope.join(', ')
        : 'selected app features';
    const durationLabel = this.describeRestrictionDuration(moderation.restrictedUntil);
    const reason = moderation.reason?.trim() || 'Admin moderation decision.';
    await this.coreDatabase.pushNotification({
      recipientId: user.id,
      title: 'Feature restriction applied',
      body: `Restricted: ${scopeLabel}. Duration: ${durationLabel}. Reason: ${reason}`,
      routeName: '/notifications',
      entityId: user.id,
      type: 'security',
      entityType: 'account_restriction',
      metadata: {
        moderationType: 'feature_restriction',
        restrictionScope: moderation.restrictionScope,
        restrictedUntil: moderation.restrictedUntil,
        durationLabel,
        reason,
        source: 'admin_user_management',
      },
    });
  }

  private describeRestrictionDuration(restrictedUntil: string | null) {
    if (!restrictedUntil) {
      return 'until an admin clears it';
    }
    const until = new Date(restrictedUntil);
    if (Number.isNaN(until.getTime())) {
      return `until ${restrictedUntil}`;
    }
    const remainingMs = until.getTime() - Date.now();
    if (remainingMs <= 0) {
      return `until ${restrictedUntil}`;
    }
    const remainingHours = Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000)));
    const amount =
      remainingHours >= 48
        ? `${Math.ceil(remainingHours / 24)} days`
        : `${remainingHours} hours`;
    return `about ${amount}, until ${restrictedUntil}`;
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
      role: this.normalizeAdminRole(admin.role),
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

  private mapAdminMarketplaceRow(item: {
    id: string;
    title: string;
    description?: string;
    category: string;
    price: Prisma.Decimal;
    currency: string;
    status: string;
    stock: number;
    sellerId: string;
    views: number;
    watchers: number;
    subcategory?: string | null;
    condition?: string | null;
    location?: string | null;
    images?: Prisma.JsonValue;
    externalAppName?: string | null;
    externalAppLink?: string | null;
    playStoreUrl?: string | null;
    androidPackage?: string | null;
    createdAt: Date;
    seller: { name: string; username?: string; avatar?: string; verification?: string | null; role?: string | null };
    orders?: Array<unknown>;
    conversations?: Array<unknown>;
  }) {
    return {
      id: item.id,
      title: item.title,
      description: item.description ?? '',
      category: item.category,
      subcategory: item.subcategory ?? '',
      condition: item.condition ?? '',
      location: item.location ?? '',
      externalAppName: item.externalAppName ?? '',
      externalAppLink: item.externalAppLink ?? '',
      playStoreUrl: item.playStoreUrl ?? '',
      androidPackage: item.androidPackage ?? '',
      externalApp: {
        name: item.externalAppName ?? '',
        appLink: item.externalAppLink ?? '',
        playStoreUrl: item.playStoreUrl ?? '',
        androidPackage: item.androidPackage ?? '',
      },
      price: Number(item.price),
      currency: item.currency,
      status: item.status,
      stock: item.stock,
      sellerName: item.seller.name,
      sellerId: item.sellerId,
      sellerUsername: item.seller.username ?? '',
      sellerAvatarUrl: item.seller.avatar ?? '',
      sellerVerification: item.seller.verification ?? '',
      sellerRole: item.seller.role ?? '',
      views: item.views,
      watchers: item.watchers,
      imageCount: Array.isArray(item.images) ? item.images.length : 0,
      orderCount: item.orders?.length ?? 0,
      conversationCount: item.conversations?.length ?? 0,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private mapAdminJobRow(item: {
    id: string;
    title: string;
    company: string;
    description?: string;
    status: string;
    type: string;
    recruiterId: string;
    location?: string | null;
    experienceLevel?: string | null;
    salaryMin?: number | null;
    salaryMax?: number | null;
    currency?: string;
    skills?: Prisma.JsonValue;
    createdAt: Date;
    recruiter: { name: string; username?: string; avatar?: string; verification?: string | null; role?: string | null };
    applications: Array<unknown>;
  }) {
    return {
      id: item.id,
      title: item.title,
      company: item.company,
      description: item.description ?? '',
      status: item.status,
      type: item.type,
      recruiterName: item.recruiter.name,
      recruiterId: item.recruiterId,
      recruiterUsername: item.recruiter.username ?? '',
      recruiterAvatarUrl: item.recruiter.avatar ?? '',
      recruiterVerification: item.recruiter.verification ?? '',
      recruiterRole: item.recruiter.role ?? '',
      location: item.location ?? '',
      experienceLevel: item.experienceLevel ?? '',
      salaryMin: item.salaryMin ?? null,
      salaryMax: item.salaryMax ?? null,
      currency: item.currency ?? 'BDT',
      skills: this.readStringArray(item.skills),
      applications: item.applications.length,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private mapAdminEventRow(item: {
    id: string;
    title: string;
    organizerId: string;
    status: string;
    location: string;
    createdAt: Date;
    price: Prisma.Decimal;
    organizer: { name: string };
    rsvps: Array<unknown>;
  }) {
    return {
      id: item.id,
      title: item.title,
      organizerName: item.organizer.name,
      organizerId: item.organizerId,
      status: item.status,
      location: item.location,
      participants: item.rsvps.length,
      price: Number(item.price),
      createdAt: item.createdAt.toISOString(),
    };
  }

  private mapAdminCommunityRow(item: {
    id: string;
    name: string;
    ownerId: string;
    privacy: string;
    category: string | null;
    createdAt: Date;
    deletedAt: Date | null;
    owner: { name: string };
    members: Array<unknown>;
  }) {
    return {
      id: item.id,
      name: item.name,
      ownerName: item.owner.name,
      ownerId: item.ownerId,
      privacy: item.privacy,
      category: item.category,
      status: item.deletedAt ? 'deleted' : 'active',
      memberCount: item.members.length,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private mapAdminPageRow(item: {
    id: string;
    name: string;
    ownerId: string;
    category: string;
    location: string | null;
    createdAt: Date;
    owner: { name: string };
    followers: Array<unknown>;
  }) {
    return {
      id: item.id,
      name: item.name,
      ownerName: item.owner.name,
      ownerId: item.ownerId,
      category: item.category,
      location: item.location,
      status: 'active',
      followerCount: item.followers.length,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private mapAdminNotificationCampaignRow(item: {
    id: string;
    name: string;
    audience: string;
    schedule: string;
    status: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      name: item.name,
      audience: item.audience,
      segmentId: item.audience,
      schedule: item.schedule,
      status: item.status,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private mapNotificationCampaignHistory(item: {
    id: string;
    action: string;
    note: string | null;
    payload: Prisma.JsonValue;
    createdAt: Date;
    actorAdmin?: { id: string; name: string | null; email: string } | null;
  }) {
    return {
      id: item.id,
      action: item.action,
      note: item.note,
      payload: this.readObject(item.payload),
      actorAdminId: item.actorAdmin?.id ?? null,
      actorName: item.actorAdmin?.name ?? item.actorAdmin?.email ?? null,
      createdAt: item.createdAt.toISOString(),
    };
  }

  private async createNotificationCampaignHistory(
    campaignId: string,
    action: string,
    actorAdminId: string | undefined,
    payload: Record<string, unknown>,
  ) {
    await this.prisma.$executeRaw`
      insert into app_notification_campaign_action_history (
        id, campaign_id, actor_admin_id, action, note, payload, created_at
      ) values (
        ${makeId('campaign_action')},
        ${campaignId},
        ${actorAdminId ?? null},
        ${action},
        ${this.readString(payload.note) ?? null},
        ${payload as Prisma.InputJsonValue},
        ${new Date()}
      )
    `;
  }

  private async readNotificationCampaignHistory(campaignId: string) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        action: string;
        note: string | null;
        payload: Prisma.JsonValue;
        created_at: Date;
        actor_admin_id: string | null;
        actor_name: string | null;
        actor_email: string | null;
      }>
    >`select history.id,
             history.action,
             history.note,
             history.payload,
             history.created_at,
             admin.id as actor_admin_id,
             admin.name as actor_name,
             admin.email as actor_email
        from app_notification_campaign_action_history history
        left join admin_users admin on admin.id = history.actor_admin_id
       where history.campaign_id = ${campaignId}
       order by history.created_at desc`;

    return rows.map((item) =>
      this.mapNotificationCampaignHistory({
        id: item.id,
        action: item.action,
        note: item.note,
        payload: item.payload,
        createdAt: item.created_at,
        actorAdmin:
          item.actor_admin_id || item.actor_name || item.actor_email
            ? {
                id: item.actor_admin_id ?? '',
                name: item.actor_name,
                email: item.actor_email ?? '',
              }
            : null,
      }),
    );
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
    createdAt?: Date;
    updatedAt?: Date;
    actionHistory?: Array<{
      id: string;
      action: string;
      note: string | null;
      fromStatus: string | null;
      toStatus: string | null;
      payload: Prisma.JsonValue;
      createdAt: Date;
      actorAdmin?: { id: string; name: string; email: string } | null;
    }>;
    assignmentHistory?: Array<{
      id: string;
      note: string | null;
      previousSeverity: string | null;
      nextSeverity: string | null;
      payload: Prisma.JsonValue;
      createdAt: Date;
      actorAdmin?: { id: string; name: string; email: string } | null;
      previousAdmin?: { id: string; name: string; email: string } | null;
      nextAdmin?: { id: string; name: string; email: string } | null;
    }>;
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
      targetLabel: item.targetLabel ?? item.targetId ?? null,
      reason: item.reason,
      evidence: this.readStringArray(item.evidence),
      history: this.buildModerationTimeline(
        item.actionHistory,
        item.assignmentHistory,
        item.history,
      ),
      assignedTo: item.assignedAdmin?.name ?? '',
      assignedToAdminId: item.assignedAdmin?.id ?? null,
      assignedAdmin: item.assignedAdmin
        ? {
            id: item.assignedAdmin.id,
            name: item.assignedAdmin.name,
          }
        : null,
      status: item.status,
      enforcementActions: this.readStringArray(item.enforcementActions),
      frozen: Boolean(metadata.frozen),
      restrictedParticipants: this.readStringArray(metadata.restrictedParticipants),
      metadata,
      actionHistory: this.mapModerationActionHistoryList(item.actionHistory),
      assignmentHistory: this.mapModerationAssignmentHistoryList(item.assignmentHistory),
      createdAt: 'createdAt' in item && item.createdAt instanceof Date ? item.createdAt.toISOString() : null,
      updatedAt: 'updatedAt' in item && item.updatedAt instanceof Date ? item.updatedAt.toISOString() : null,
    };
  }

  private async upsertModerationCaseForTarget(
    input: {
      title: string;
      type: string;
      targetType: string;
      targetId: string;
      targetLabel?: string | null;
      reason: string;
      status: string;
      severity: string;
      action: string;
      note?: string | null;
      enforcementAction?: string | null;
      assignedAdminId?: string | null;
      metadata?: Record<string, unknown>;
    },
    actorAdminId?: string,
  ) {
    const targetType = input.targetType.trim();
    const targetId = input.targetId.trim();
    const timestamp = new Date();
    const title = input.title.trim();
    const reason = input.reason.trim();
    const status = input.status.trim();
    const severity = input.severity.trim();
    const note = input.note?.trim() || null;
    const enforcementAction = input.enforcementAction?.trim() || null;
    const assignedAdminId = input.assignedAdminId?.trim() || null;

    const existing = await this.prisma.moderationCase.findFirst({
      where: {
        targetType,
        targetId,
      },
      include: {
        assignedAdmin: true,
        actionHistory: {
          include: { actorAdmin: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        assignmentHistory: {
          include: {
            actorAdmin: true,
            previousAdmin: true,
            nextAdmin: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (assignedAdminId) {
      await this.getAdminUserById(assignedAdminId);
    }

    const nextMetadata = {
      ...(existing ? this.readObject(existing.metadata) : {}),
      ...(input.metadata ?? {}),
      lastAction: input.action,
      lastActionAt: timestamp.toISOString(),
      lastActorAdminId: actorAdminId ?? null,
    };

    if (!existing) {
      const created = await this.prisma.$transaction(async (tx) => {
        const createdCase = await tx.moderationCase.create({
          data: {
            id: makeId('moderation_case'),
            title,
            type: input.type.trim(),
            targetType,
            targetId,
            targetLabel: input.targetLabel?.trim() || null,
            reason,
            evidence: [] as Prisma.InputJsonValue,
            history: [`${timestamp.toISOString()}: ${note || `Case created via ${input.action}`}`] as Prisma.InputJsonValue,
            status,
            severity,
            enforcementActions: enforcementAction ? [enforcementAction] as Prisma.InputJsonValue : [],
            metadata: nextMetadata as Prisma.InputJsonValue,
            assignedToAdminId: assignedAdminId,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        });

        await tx.moderationCaseActionHistory.create({
          data: {
            id: makeId('mod_case_action'),
            caseId: createdCase.id,
            actorAdminId: actorAdminId ?? null,
            action: input.action.trim(),
            note: note ?? 'Moderation case created',
            fromStatus: null,
            toStatus: status,
            payload: {
              targetType,
              targetId,
              severity,
              enforcementAction,
            } as Prisma.InputJsonValue,
            createdAt: timestamp,
          },
        });

        if (assignedAdminId) {
          await tx.moderationCaseAssignmentHistory.create({
            data: {
              id: makeId('mod_case_assignment'),
              caseId: createdCase.id,
              actorAdminId: actorAdminId ?? null,
              previousAdminId: null,
              nextAdminId: assignedAdminId,
              previousSeverity: null,
              nextSeverity: severity,
              note: note ?? 'Moderation case assigned during creation',
              payload: {
                action: input.action.trim(),
                status,
              } as Prisma.InputJsonValue,
              createdAt: timestamp,
            },
          });
        }

        return tx.moderationCase.findUniqueOrThrow({
          where: { id: createdCase.id },
          include: {
            assignedAdmin: true,
            actionHistory: {
              include: { actorAdmin: true },
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
            assignmentHistory: {
              include: {
                actorAdmin: true,
                previousAdmin: true,
                nextAdmin: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 20,
            },
          },
        });
      });

      return this.mapModerationCase(created);
    }

    const previousStatus = existing.status;
    const previousSeverity = existing.severity;
    const previousAssignedAdminId = existing.assignedToAdminId ?? null;
    const nextHistory = [
      ...this.readStringArray(existing.history),
      `${timestamp.toISOString()}: ${note || `Action applied: ${input.action}`}`,
    ];
    const existingEnforcementActions = this.readStringArray(existing.enforcementActions);
    const nextEnforcementActions =
      enforcementAction && !existingEnforcementActions.includes(enforcementAction)
        ? [...existingEnforcementActions, enforcementAction]
        : existingEnforcementActions;

    const updated = await this.prisma.$transaction(async (tx) => {
      const nextCase = await tx.moderationCase.update({
        where: { id: existing.id },
        data: {
          title,
          type: input.type.trim(),
          targetLabel: input.targetLabel?.trim() || existing.targetLabel || null,
          reason,
          status,
          severity,
          assignedToAdminId: assignedAdminId ?? existing.assignedToAdminId,
          enforcementActions: nextEnforcementActions as Prisma.InputJsonValue,
          history: nextHistory as Prisma.InputJsonValue,
          metadata: nextMetadata as Prisma.InputJsonValue,
          updatedAt: timestamp,
        },
      });

      await tx.moderationCaseActionHistory.create({
        data: {
          id: makeId('mod_case_action'),
          caseId: nextCase.id,
          actorAdminId: actorAdminId ?? null,
          action: input.action.trim(),
          note: note ?? `Action applied: ${input.action}`,
          fromStatus: previousStatus,
          toStatus: status,
          payload: {
            targetType,
            targetId,
            severity,
            enforcementAction,
          } as Prisma.InputJsonValue,
          createdAt: timestamp,
        },
      });

      if (previousAssignedAdminId !== (assignedAdminId ?? existing.assignedToAdminId) || previousSeverity !== severity) {
        await tx.moderationCaseAssignmentHistory.create({
          data: {
            id: makeId('mod_case_assignment'),
            caseId: nextCase.id,
            actorAdminId: actorAdminId ?? null,
            previousAdminId: previousAssignedAdminId,
            nextAdminId: assignedAdminId ?? existing.assignedToAdminId,
            previousSeverity,
            nextSeverity: severity,
            note: note ?? 'Moderation assignment or severity updated',
            payload: {
              action: input.action.trim(),
              status,
            } as Prisma.InputJsonValue,
            createdAt: timestamp,
          },
        });
      }

      return tx.moderationCase.findUniqueOrThrow({
        where: { id: nextCase.id },
        include: {
          assignedAdmin: true,
          actionHistory: {
            include: { actorAdmin: true },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          assignmentHistory: {
            include: {
              actorAdmin: true,
              previousAdmin: true,
              nextAdmin: true,
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      });
    });

    return this.mapModerationCase(updated);
  }

  private resolveModerationStatusFromAction(action: string, currentStatus: string) {
    const normalized = action.trim().toLowerCase();
    if (normalized === 'close' || normalized === 'resolve') {
      return 'resolved';
    }
    if (normalized === 'reopen') {
      return 'open';
    }
    if (normalized === 'review' || normalized === 'flag') {
      return 'reviewing';
    }
    if (normalized === 'escalate') {
      return 'escalated';
    }
    if (normalized === 'remove' || normalized === 'freeze') {
      return 'resolved';
    }
    return currentStatus?.trim() || 'updated';
  }

  private resolveModerationSeverityFromAction(action: string, currentSeverity: string) {
    const normalized = action.trim().toLowerCase();
    if (normalized === 'escalate' || normalized === 'remove' || normalized === 'freeze') {
      return 'high';
    }
    if (normalized === 'review' || normalized === 'flag') {
      return 'medium';
    }
    return currentSeverity?.trim() || 'medium';
  }

  private resolveModerationEnforcementAction(
    action: string,
    status: string,
    targetType: string,
  ) {
    const normalized = action.trim().toLowerCase();
    if (normalized === 'remove') {
      return `remove_${targetType}`;
    }
    if (normalized === 'freeze') {
      return `freeze_${targetType}`;
    }
    if (normalized === 'flag') {
      return `flag_${targetType}`;
    }
    if (normalized === 'escalate') {
      return 'escalate_case';
    }
    if (status.trim().toLowerCase() === 'resolved') {
      return 'resolve_case';
    }
    return normalized || null;
  }

  private mapReportStatusToModerationStatus(status: string) {
    const normalized = status.trim().toLowerCase();
    if (normalized === 'reviewing') {
      return 'reviewing';
    }
    if (normalized === 'resolved') {
      return 'resolved';
    }
    if (normalized === 'rejected') {
      return 'closed';
    }
    return 'open';
  }

  private deriveModerationSeverityFromReportReason(reason: string) {
    const normalized = reason.trim().toLowerCase();
    if (
      normalized.includes('violence') ||
      normalized.includes('abuse') ||
      normalized.includes('harassment') ||
      normalized.includes('illegal')
    ) {
      return 'high';
    }
    if (
      normalized.includes('spam') ||
      normalized.includes('fake') ||
      normalized.includes('misinformation')
    ) {
      return 'medium';
    }
    return 'low';
  }

  private buildModerationTimeline(
    actionHistory:
      | Array<{
          action: string;
          note: string | null;
          createdAt: Date;
          actorAdmin?: { name: string; email: string } | null;
        }>
      | null
      | undefined,
    assignmentHistory:
      | Array<{
          note: string | null;
          previousSeverity: string | null;
          nextSeverity: string | null;
          createdAt: Date;
          actorAdmin?: { name: string; email: string } | null;
          previousAdmin?: { name: string; email: string } | null;
          nextAdmin?: { name: string; email: string } | null;
        }>
      | null
      | undefined,
    legacyHistory: Prisma.JsonValue,
  ) {
    const events: Array<{ createdAt: Date; message: string }> = [];

    for (const item of actionHistory ?? []) {
      const actor = item.actorAdmin?.name ?? item.actorAdmin?.email ?? 'System';
      const note = item.note?.trim() || `Action applied: ${item.action}`;
      events.push({
        createdAt: item.createdAt,
        message: `${item.createdAt.toISOString()}: ${note} by ${actor}`,
      });
    }

    for (const item of assignmentHistory ?? []) {
      const actor = item.actorAdmin?.name ?? item.actorAdmin?.email ?? 'System';
      const reassignment =
        item.previousAdmin?.name || item.nextAdmin?.name
          ? `assignment ${item.previousAdmin?.name ?? 'unassigned'} -> ${item.nextAdmin?.name ?? 'unassigned'}`
          : 'assignment updated';
      const severity =
        item.previousSeverity || item.nextSeverity
          ? ` severity ${item.previousSeverity ?? 'n/a'} -> ${item.nextSeverity ?? 'n/a'}`
          : '';
      const note = item.note?.trim() || `${reassignment}${severity}`;
      events.push({
        createdAt: item.createdAt,
        message: `${item.createdAt.toISOString()}: ${note} by ${actor}`,
      });
    }

    if (events.length > 0) {
      return events
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((item) => item.message);
    }

    return this.readStringArray(legacyHistory);
  }

  private mapSupportHelpConfig(
    row:
      | {
          value: Prisma.JsonValue;
          updatedAt: Date;
        }
      | null,
  ) {
    const value = this.readObject(row?.value);
    return {
      enabled: this.readBoolean(value.enabled, true),
      showOnLogin: this.readBoolean(value.showOnLogin, true),
      headerText: this.readNullableString(value.headerText) ?? 'Need help signing in?',
      bodyText:
        this.readNullableString(value.bodyText) ??
        'Send a message with an optional screenshot and support will reply from the admin dashboard.',
      allowImages: this.readBoolean(value.allowImages, true),
      updatedAt: row?.updatedAt.toISOString() ?? null,
    };
  }

  private mapSupportTicket(item: {
    id: string;
    userId: string | null;
    subject: string;
    category: string;
    status: string;
    priority: string;
    createdAt: Date;
    updatedAt: Date;
    metadata: Prisma.JsonValue;
    user?: { id: string; name: string; username: string; email: string } | null;
    conversation?: {
      id: string;
      status: string;
      channel: string;
      messages?: Array<{ id: string; body: string; createdAt: Date }>;
    } | null;
    actionHistory?: Array<{
      id: string;
      action: string;
      note: string | null;
      fromStatus: string | null;
      toStatus: string | null;
      fromPriority: string | null;
      toPriority: string | null;
      payload: Prisma.JsonValue;
      createdAt: Date;
      actorAdmin?: { id: string; name: string; email: string } | null;
      actorUser?: { id: string; name: string; email: string } | null;
    }>;
    assignmentHistory?: Array<{
      id: string;
      note: string | null;
      previousSlaHours: number | null;
      nextSlaHours: number | null;
      previousSlaDueAt: Date | null;
      nextSlaDueAt: Date | null;
      payload: Prisma.JsonValue;
      createdAt: Date;
      actorAdmin?: { id: string; name: string; email: string } | null;
      actorUser?: { id: string; name: string; email: string } | null;
      previousAdmin?: { id: string; name: string; email: string } | null;
      nextAdmin?: { id: string; name: string; email: string } | null;
    }>;
    assignedToAdminId?: string | null;
    assignedAt?: Date | null;
    slaHours?: number | null;
    slaDueAt?: Date | null;
    assignedAdmin?: { id: string; name: string; email: string } | null;
    internalNotes?: Array<{
      id: string;
      note: string;
      createdAt: Date;
      updatedAt: Date;
      actorAdmin?: { id: string; name: string; email: string } | null;
    }>;
  }) {
    const metadata = this.readObject(item.metadata);
    const internalNotes = this.mapSupportInternalNotes(item.internalNotes);
    const adminNotes =
      internalNotes.length > 0
        ? internalNotes.map((entry) => entry.note)
        : this.readStringArray(metadata.adminNotes);
    const latestMessage = item.conversation?.messages?.[0];
    return {
      id: item.id,
      subject: item.subject,
      category: item.category,
      status: item.status,
      priority: item.priority,
      userId: item.userId,
      userName: item.user?.name ?? null,
      username: item.user?.username ?? null,
      userEmail: item.user?.email ?? null,
      userLabel:
        item.user?.name ??
        item.user?.username ??
        item.user?.email ??
        (item.userId ? `user:${item.userId}` : null),
      conversationId: item.conversation?.id ?? null,
      conversationStatus: item.conversation?.status ?? null,
      channel: item.conversation?.channel ?? null,
      latestMessage: latestMessage?.body ?? null,
      latestMessageAt: latestMessage?.createdAt?.toISOString() ?? null,
      assignedAdminId:
        item.assignedToAdminId ?? this.readNullableString(metadata.assignedAdminId),
      assignedAdmin:
        item.assignedAdmin
          ? {
              id: item.assignedAdmin.id,
              name: item.assignedAdmin.name,
              email: item.assignedAdmin.email,
            }
          : null,
      assignedAt:
        item.assignedAt?.toISOString() ?? this.readNullableString(metadata.assignedAt),
      slaHours: item.slaHours ?? this.readNumber(metadata.slaHours),
      slaDueAt:
        item.slaDueAt?.toISOString() ??
        this.readNullableString(metadata.slaDueAt),
      adminNotes,
      internalNotes,
      metadata,
      actionHistory: this.mapSupportActionHistoryList(item.actionHistory),
      assignmentHistory: this.mapSupportAssignmentHistoryList(item.assignmentHistory),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }

  private mapSupportActionHistoryList(
    items?:
      | Array<{
          id: string;
          action: string;
          note: string | null;
          fromStatus: string | null;
          toStatus: string | null;
          fromPriority: string | null;
          toPriority: string | null;
          payload: Prisma.JsonValue;
          createdAt: Date;
          actorAdmin?: { id: string; name: string; email: string } | null;
          actorUser?: { id: string; name: string; email: string } | null;
        }>
      | null,
  ) {
    return (items ?? []).map((item) => ({
      id: item.id,
      action: item.action,
      note: item.note,
      fromStatus: item.fromStatus,
      toStatus: item.toStatus,
      fromPriority: item.fromPriority,
      toPriority: item.toPriority,
      payload: this.readObject(item.payload),
      actorAdmin: item.actorAdmin
        ? { id: item.actorAdmin.id, name: item.actorAdmin.name, email: item.actorAdmin.email }
        : null,
      actorUser: item.actorUser
        ? { id: item.actorUser.id, name: item.actorUser.name, email: item.actorUser.email }
        : null,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  private mapSupportAssignmentHistoryList(
    items?:
      | Array<{
          id: string;
          note: string | null;
          previousSlaHours: number | null;
          nextSlaHours: number | null;
          previousSlaDueAt: Date | null;
          nextSlaDueAt: Date | null;
          payload: Prisma.JsonValue;
          createdAt: Date;
          actorAdmin?: { id: string; name: string; email: string } | null;
          actorUser?: { id: string; name: string; email: string } | null;
          previousAdmin?: { id: string; name: string; email: string } | null;
          nextAdmin?: { id: string; name: string; email: string } | null;
        }>
      | null,
  ) {
    return (items ?? []).map((item) => ({
      id: item.id,
      note: item.note,
      previousSlaHours: item.previousSlaHours,
      nextSlaHours: item.nextSlaHours,
      previousSlaDueAt: item.previousSlaDueAt?.toISOString() ?? null,
      nextSlaDueAt: item.nextSlaDueAt?.toISOString() ?? null,
      payload: this.readObject(item.payload),
      actorAdmin: item.actorAdmin
        ? { id: item.actorAdmin.id, name: item.actorAdmin.name, email: item.actorAdmin.email }
        : null,
      actorUser: item.actorUser
        ? { id: item.actorUser.id, name: item.actorUser.name, email: item.actorUser.email }
        : null,
      previousAdmin: item.previousAdmin
        ? { id: item.previousAdmin.id, name: item.previousAdmin.name, email: item.previousAdmin.email }
        : null,
      nextAdmin: item.nextAdmin
        ? { id: item.nextAdmin.id, name: item.nextAdmin.name, email: item.nextAdmin.email }
        : null,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  private mapSupportInternalNotes(
    items?:
      | Array<{
          id: string;
          note: string;
          createdAt: Date;
          updatedAt: Date;
          actorAdmin?: { id: string; name: string; email: string } | null;
        }>
      | null,
  ) {
    return (items ?? []).map((item) => ({
      id: item.id,
      note: item.note,
      actorAdmin: item.actorAdmin
        ? { id: item.actorAdmin.id, name: item.actorAdmin.name, email: item.actorAdmin.email }
        : null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    }));
  }

  private mapModerationActionHistoryList(
    items?:
      | Array<{
          id: string;
          action: string;
          note: string | null;
          fromStatus: string | null;
          toStatus: string | null;
          payload: Prisma.JsonValue;
          createdAt: Date;
          actorAdmin?: { id: string; name: string; email: string } | null;
        }>
      | null,
  ) {
    return (items ?? []).map((item) => ({
      id: item.id,
      action: item.action,
      note: item.note,
      fromStatus: item.fromStatus,
      toStatus: item.toStatus,
      payload: this.readObject(item.payload),
      actorAdmin: item.actorAdmin
        ? { id: item.actorAdmin.id, name: item.actorAdmin.name, email: item.actorAdmin.email }
        : null,
      createdAt: item.createdAt.toISOString(),
    }));
  }

  private mapModerationAssignmentHistoryList(
    items?:
      | Array<{
          id: string;
          note: string | null;
          previousSeverity: string | null;
          nextSeverity: string | null;
          payload: Prisma.JsonValue;
          createdAt: Date;
          actorAdmin?: { id: string; name: string; email: string } | null;
          previousAdmin?: { id: string; name: string; email: string } | null;
          nextAdmin?: { id: string; name: string; email: string } | null;
        }>
      | null,
  ) {
    return (items ?? []).map((item) => ({
      id: item.id,
      note: item.note,
      previousSeverity: item.previousSeverity,
      nextSeverity: item.nextSeverity,
      payload: this.readObject(item.payload),
      actorAdmin: item.actorAdmin
        ? { id: item.actorAdmin.id, name: item.actorAdmin.name, email: item.actorAdmin.email }
        : null,
      previousAdmin: item.previousAdmin
        ? { id: item.previousAdmin.id, name: item.previousAdmin.name, email: item.previousAdmin.email }
        : null,
      nextAdmin: item.nextAdmin
        ? { id: item.nextAdmin.id, name: item.nextAdmin.name, email: item.nextAdmin.email }
        : null,
      createdAt: item.createdAt.toISOString(),
    }));
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

  private readBoolean(value: unknown, fallback = false) {
    return typeof value === 'boolean' ? value : fallback;
  }

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private readNullableString(value: unknown) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }

  private readNumber(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : null;
  }

  private readDate(value: unknown) {
    if (typeof value !== 'string' || !value.trim()) {
      return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private readStringArray(value: unknown) {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
  }

  private readArrayObjects(value: unknown) {
    return Array.isArray(value)
      ? value.filter(
          (item): item is Record<string, unknown> =>
            Boolean(item) && typeof item === 'object' && !Array.isArray(item),
        )
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

  private async ensureUserExists(userId: string) {
    const user = await this.prisma.appUser.findUnique({
      where: { id: userId.trim() },
    });
    if (!user) {
      throw new NotFoundException(`User ${userId} not found.`);
    }
    return user;
  }

  private hasAdminRole(role: string, allowedRoles: string[]) {
    const normalizedRole = this.normalizeAdminRole(role);
    if (normalizedRole === 'superadmin') {
      return true;
    }
    return allowedRoles.some((item) => this.normalizeAdminRole(item) === normalizedRole);
  }

  private normalizeAdminRole(role?: string | null) {
    const normalized = (role ?? '').trim().toLowerCase();
    if (normalized === 'superadmin' || normalized === 'super admin') {
      return 'superadmin';
    }
    if (
      normalized === 'admin' ||
      normalized === 'operations admin' ||
      normalized === 'content moderator' ||
      normalized === 'finance admin' ||
      normalized === 'support admin' ||
      normalized === 'analytics viewer'
    ) {
      return 'admin';
    }
    return 'admin';
  }

  private canonicalizeStoredAdminRole(role?: string | null) {
    return this.normalizeAdminRole(role) === 'superadmin' ? 'superadmin' : 'admin';
  }

  private normalizeManagedAppUserRole(role: string) {
    const normalized = role.trim().toLowerCase();
    switch (normalized) {
      case 'creator':
        return 'Creator';
      case 'business':
        return 'Business';
      case 'admin':
        return 'Admin';
      case 'superadmin':
      case 'super admin':
        return 'SuperAdmin';
      default:
        return 'User';
    }
  }

  private async normalizeLegacyAdminRoles() {
    await this.prisma.adminUser.updateMany({
      where: { role: 'Super Admin' },
      data: { role: 'superadmin' },
    });

    await this.prisma.adminUser.updateMany({
      where: {
        role: {
          in: [
            'Operations Admin',
            'Content Moderator',
            'Finance Admin',
            'Support Admin',
            'Analytics Viewer',
            'Admin',
          ],
        },
      },
      data: { role: 'admin' },
    });
  }

  private mapAdminAppUser(user: Prisma.AppUserGetPayload<Record<string, never>>) {
    const { passwordHash: _passwordHash, ...safeUser } = user;
    const profileSetup = this.readObject(safeUser.profileSetup);
    const adminModeration = this.mapUserAdminModeration(profileSetup.adminModeration);
    return {
      ...safeUser,
      adminModeration,
      suspendedUntil: adminModeration.suspendedUntil,
      restrictedUntil: adminModeration.restrictedUntil,
      restrictionScope: adminModeration.restrictionScope,
      restrictionReason: adminModeration.reason,
      restrictionActive: adminModeration.action === 'restrict' && adminModeration.active,
      suspensionActive: adminModeration.action === 'suspend' && adminModeration.active,
    };
  }

  private buildUserEnforcementPatch(
    profileSetup: Record<string, unknown>,
    patch: {
      enforcementAction?: 'suspend' | 'restrict' | 'clear';
      suspendedUntil?: string;
      restrictedUntil?: string;
      restrictionScope?: string[];
      restrictionReason?: string;
    },
    actorAdminId?: string,
  ) {
    const changed =
      patch.enforcementAction !== undefined ||
      patch.suspendedUntil !== undefined ||
      patch.restrictedUntil !== undefined ||
      patch.restrictionScope !== undefined ||
      patch.restrictionReason !== undefined;

    if (!changed) {
      return { changed: false, profileSetup };
    }

    const now = new Date().toISOString();
    const existing = this.readObject(profileSetup.adminModeration);
    const action =
      patch.enforcementAction ??
      (patch.suspendedUntil ? 'suspend' : 'restrict');
    const reason =
      patch.restrictionReason?.trim() ||
      this.readNullableString(existing.reason) ||
      null;
    const suspendedUntil =
      patch.suspendedUntil !== undefined
        ? this.normalizeEnforcementDate(patch.suspendedUntil, 'suspendedUntil')
        : this.readNullableString(existing.suspendedUntil);
    const restrictedUntil =
      patch.restrictedUntil !== undefined
        ? this.normalizeEnforcementDate(patch.restrictedUntil, 'restrictedUntil')
        : this.readNullableString(existing.restrictedUntil);
    const restrictionScope =
      patch.restrictionScope !== undefined
        ? this.readStringArray(patch.restrictionScope).map((item) => item.trim())
        : this.readStringArray(existing.restrictionScope);

    const nextModeration =
      action === 'clear'
        ? {
            action: 'clear',
            active: false,
            suspendedUntil: null,
            restrictedUntil: null,
            restrictionScope: [],
            reason,
            actorAdminId: actorAdminId ?? null,
            updatedAt: now,
            clearedAt: now,
          }
        : {
            ...existing,
            action,
            active: true,
            suspendedUntil: action === 'suspend' ? suspendedUntil : null,
            restrictedUntil: action === 'restrict' ? restrictedUntil : null,
            restrictionScope: action === 'restrict' ? restrictionScope : [],
            reason,
            actorAdminId: actorAdminId ?? null,
            updatedAt: now,
          };

    return {
      changed: true,
      profileSetup: {
        ...profileSetup,
        adminModeration: nextModeration,
      },
    };
  }

  private mapUserAdminModeration(value: unknown) {
    const moderation = this.readObject(value);
    const action = this.readNullableString(moderation.action) ?? 'none';
    const suspendedUntil = this.readNullableString(moderation.suspendedUntil);
    const restrictedUntil = this.readNullableString(moderation.restrictedUntil);
    const now = Date.now();
    const suspensionActive =
      action === 'suspend' &&
      (!suspendedUntil || new Date(suspendedUntil).getTime() > now);
    const restrictionActive =
      action === 'restrict' &&
      (!restrictedUntil || new Date(restrictedUntil).getTime() > now);

    return {
      action,
      active: this.readBoolean(moderation.active, false) && (suspensionActive || restrictionActive),
      suspendedUntil,
      restrictedUntil,
      restrictionScope: this.readStringArray(moderation.restrictionScope),
      reason: this.readNullableString(moderation.reason),
      actorAdminId: this.readNullableString(moderation.actorAdminId),
      updatedAt: this.readNullableString(moderation.updatedAt),
      clearedAt: this.readNullableString(moderation.clearedAt),
    };
  }

  private normalizeEnforcementDate(value: string | undefined, fieldName: string) {
    if (value === undefined || value.trim().length === 0) {
      return null;
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new ConflictException(`${fieldName} must be a valid ISO date/time.`);
    }
    return parsed.toISOString();
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

  private buildDailyCountSeries(
    rows: Array<{ createdAt: Date }>,
    since: Date,
    key: 'createdAt',
  ) {
    const labels = this.buildDayLabels(since);
    const counts = new Map(labels.map((label) => [label, 0]));
    for (const row of rows) {
      const label = this.formatDayLabel(row[key]);
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }

    return {
      labels,
      values: labels.map((label) => counts.get(label) ?? 0),
    };
  }

  private buildDailyRevenueSeries(
    rows: Array<{ createdAt: Date; amount: Prisma.Decimal }>,
    since: Date,
  ) {
    const labels = this.buildDayLabels(since);
    const totals = new Map(labels.map((label) => [label, 0]));
    for (const row of rows) {
      const label = this.formatDayLabel(row.createdAt);
      totals.set(label, (totals.get(label) ?? 0) + Number(row.amount ?? 0));
    }

    return labels.map((label) => ({
      label,
      value: Number((totals.get(label) ?? 0).toFixed(2)),
    }));
  }

  private buildDayLabels(since: Date) {
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(since);
      date.setUTCDate(since.getUTCDate() + index);
      return this.formatDayLabel(date);
    });
  }

  private formatDayLabel(value: Date) {
    return value.toISOString().slice(5, 10);
  }

  private async resolveModerationTargetType(id: string) {
    const [post, reel, story] = await Promise.all([
      this.prisma.appPost.findUnique({ where: { id }, select: { id: true } }),
      this.prisma.reel.findUnique({ where: { id }, select: { id: true } }),
      this.prisma.story.findUnique({ where: { id }, select: { id: true } }),
    ]);

    if (post) {
      return 'post' as const;
    }
    if (reel) {
      return 'reel' as const;
    }
    if (story) {
      return 'story' as const;
    }

    throw new NotFoundException(`Content ${id} not found.`);
  }

  private mapUserPushDevice(item: {
    id: string;
    token: string;
    platform: string;
    deviceLabel: string | null;
    appVersion: string | null;
    isActive: boolean;
    lastSeenAt: Date;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: item.id,
      token: item.token,
      platform: item.platform,
      deviceLabel: item.deviceLabel,
      appVersion: item.appVersion,
      enabled: item.isActive,
      isActive: item.isActive,
      status: item.isActive ? 'active' : 'inactive',
      lastSeenAt: item.lastSeenAt.toISOString(),
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  }
}
