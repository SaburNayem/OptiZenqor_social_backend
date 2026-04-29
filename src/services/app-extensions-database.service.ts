import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CoreDatabaseService } from './core-database.service';
import { PrismaService } from './prisma.service';

const DEFAULT_VERIFICATION_DOCUMENTS = [
  'Government ID',
  'Business proof',
  'Profile photo',
];

type ExtensionSettingsState = {
  accountSwitching?: {
    linkedAccountIds?: string[];
    activeAccountId?: string | null;
  };
  activitySessions?: {
    history?: Array<{
      id?: string;
      message?: string;
      createdAt?: string;
      action?: string;
      sessionId?: string;
    }>;
  };
  verificationRequest?: {
    status?: string;
    reason?: string;
    selectedDocuments?: string[];
    requiredDocuments?: string[];
    submittedAt?: string | null;
  };
};

@Injectable()
export class AppExtensionsDatabaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  async getAccountSwitching(userId: string) {
    const [user, settings] = await Promise.all([
      this.coreDatabase.getUser(userId),
      this.getSettings(userId),
    ]);
    const linkedIds = this.resolveLinkedAccountIds(userId, settings);
    const linkedUsers = await this.getUsersByIds(linkedIds);
    const accounts = linkedUsers.map((item) => this.mapAccountIdentity(item));
    const activeAccountId = this.resolveActiveAccountId(userId, accounts, settings);
    const active = accounts.find((item) => item.id === activeAccountId) ?? accounts[0] ?? null;

    return {
      success: true,
      activeAccountId: active?.id ?? user.id,
      accounts,
      linkedAccounts: accounts,
      active,
      data: {
        activeAccountId: active?.id ?? user.id,
        accounts,
        linkedAccounts: accounts,
        active,
      },
    };
  }

  async getActiveAccount(userId: string) {
    const payload = await this.getAccountSwitching(userId);
    if (!payload.active) {
      throw new NotFoundException(`No active account found for user ${userId}.`);
    }
    return {
      success: true,
      accountId: payload.active.id,
      activeAccountId: payload.active.id,
      account: payload.active,
      active: payload.active,
      data: payload.active,
    };
  }

  async setActiveAccount(userId: string, accountId: string) {
    const normalizedAccountId = accountId.trim();
    if (!normalizedAccountId) {
      throw new NotFoundException('Active account id is required.');
    }

    const current = await this.getAccountSwitching(userId);
    const account = current.accounts.find((item) => item.id === normalizedAccountId);
    if (!account) {
      throw new ForbiddenException('The requested account is not linked to this user.');
    }

    await this.updateSettings(userId, (settings) => ({
      ...settings,
      accountSwitching: {
        ...(settings.accountSwitching ?? {}),
        linkedAccountIds: this.resolveLinkedAccountIds(userId, settings),
        activeAccountId: normalizedAccountId,
      },
    }));

    return {
      success: true,
      accountId: normalizedAccountId,
      activeAccountId: normalizedAccountId,
      account,
      active: account,
      data: account,
    };
  }

  async getActivitySessions(userId: string, authorization?: string) {
    const currentSession = await this.requireSessionFromAuthorization(authorization, userId);
    const [sessions, history] = await Promise.all([
      this.prisma.authSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.getActivityHistory(userId),
    ]);

    const items = sessions.map((session) =>
      this.mapActivitySession(session, currentSession?.sessionId === session.sessionId),
    );

    return {
      success: true,
      isLoading: false,
      loggingOutOthers: false,
      sessions: items,
      items,
      activities: history,
      history,
      activeSessions: items.filter((item) => item.active),
      data: {
        sessions: items,
        items,
        activities: history,
        history,
        activeSessions: items.filter((item) => item.active),
      },
    };
  }

  async getActivityHistory(userId: string) {
    const [sessions, settings] = await Promise.all([
      this.prisma.authSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      this.getSettings(userId),
    ]);

    const historyEntries = this.readHistory(settings)
      .map((entry) => ({
        message: this.readString(entry.message) ?? this.readString(entry.action) ?? 'Security activity recorded.',
        createdAt: this.readString(entry.createdAt) ?? new Date(0).toISOString(),
      }))
      .filter((entry) => entry.message.trim().length > 0)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    const sessionEntries = sessions.map((session) => ({
      message: `Session started on ${this.mapActivitySession(session, false).device}.`,
      createdAt: session.createdAt.toISOString(),
    }));

    return [...historyEntries, ...sessionEntries]
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .slice(0, 20)
      .map((entry) => entry.message);
  }

  async logoutOtherDevices(userId: string, authorization?: string) {
    const currentSession = await this.requireSessionFromAuthorization(authorization, userId);
    await this.prisma.authSession.deleteMany({
      where: {
        userId,
        sessionId: { not: currentSession.sessionId },
      },
    });

    await this.appendHistory(userId, {
      action: 'logout_others',
      message: 'Signed out from other devices.',
      sessionId: currentSession.sessionId,
    });

    return this.getActivitySessions(userId, authorization);
  }

  async revokeSession(userId: string, sessionId: string, authorization?: string) {
    const currentSession = await this.requireSessionFromAuthorization(authorization, userId);
    const session = await this.prisma.authSession.findFirst({
      where: { sessionId, userId },
    });
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found.`);
    }
    if (session.sessionId === currentSession.sessionId) {
      throw new ForbiddenException('The current session cannot be revoked from this route.');
    }

    await this.prisma.authSession.delete({
      where: { sessionId: session.sessionId },
    });

    await this.appendHistory(userId, {
      action: 'revoke_session',
      message: `Revoked session ${session.sessionId}.`,
      sessionId: session.sessionId,
    });

    return {
      success: true,
      id: session.sessionId,
      active: false,
      isCurrent: false,
      lastActive: 'Signed out remotely',
      data: {
        id: session.sessionId,
        active: false,
      },
    };
  }

  async getVerificationRequest(userId: string) {
    const [user, settings] = await Promise.all([
      this.coreDatabase.getUser(userId),
      this.getSettings(userId),
    ]);
    return this.buildVerificationPayload(user, settings);
  }

  async getVerificationRequestStatus(userId: string) {
    const payload = await this.getVerificationRequest(userId);
    return {
      success: true,
      ...payload,
      data: payload,
      result: payload,
    };
  }

  async getVerificationDocuments(userId: string) {
    const payload = await this.getVerificationRequest(userId);
    return {
      success: true,
      documents: payload.requiredDocuments,
      items: payload.requiredDocuments,
      data: payload.requiredDocuments,
    };
  }

  async toggleVerificationDocument(userId: string, documentName: string) {
    const payload = await this.getVerificationRequest(userId);
    const normalizedName = documentName.trim();
    if (!normalizedName) {
      throw new NotFoundException('Verification document name is required.');
    }
    const nextDocuments = payload.selectedDocuments.includes(normalizedName)
      ? payload.selectedDocuments.filter((item) => item !== normalizedName)
      : [...payload.selectedDocuments, normalizedName];
    return this.persistVerificationRequest(userId, {
      ...payload,
      selectedDocuments: nextDocuments,
    });
  }

  async submitVerificationRequest(userId: string, documents?: string[]) {
    const payload = await this.getVerificationRequest(userId);
    return this.persistVerificationRequest(userId, {
      ...payload,
      status: 'pending',
      reason: 'Documents uploaded. Under review.',
      selectedDocuments:
        documents && documents.length > 0
          ? [...new Set(documents.map((item) => item.trim()).filter(Boolean))]
          : payload.selectedDocuments,
      submittedAt: new Date().toISOString(),
    });
  }

  async updateVerificationStatus(
    userId: string,
    status: 'notRequested' | 'pending' | 'approved' | 'rejected',
  ) {
    const payload = await this.getVerificationRequest(userId);
    const reason =
      status === 'notRequested'
        ? 'Submit creator or business documents to start review.'
        : status === 'pending'
          ? 'Documents uploaded. Under review.'
          : status === 'approved'
            ? 'Approved. Verification badge is ready to appear on your profile.'
            : 'Rejected. Update your documents and try again.';

    return this.persistVerificationRequest(userId, {
      ...payload,
      status,
      reason,
      submittedAt:
        status === 'notRequested' ? null : payload.submittedAt ?? new Date().toISOString(),
    });
  }

  private async persistVerificationRequest(
    userId: string,
    payload: {
      status: string;
      reason: string;
      selectedDocuments: string[];
      requiredDocuments: string[];
      submittedAt: string | null;
    },
  ) {
    await Promise.all([
      this.prisma.appUser.update({
        where: { id: userId },
        data: {
          verification: payload.status,
          updatedAt: new Date(),
        },
      }),
      this.updateSettings(userId, (settings) => ({
        ...settings,
        verificationRequest: {
          status: payload.status,
          reason: payload.reason,
          selectedDocuments: payload.selectedDocuments,
          requiredDocuments: payload.requiredDocuments,
          submittedAt: payload.submittedAt,
        },
      })),
    ]);

    return {
      ...payload,
      success: true,
      data: payload,
      result: payload,
    };
  }

  private async buildVerificationPayload(
    user: Awaited<ReturnType<CoreDatabaseService['getUser']>>,
    settings: ExtensionSettingsState,
  ) {
    const stored = settings.verificationRequest ?? {};
    const status = this.normalizeVerificationStatus(
      this.readString(stored.status) ?? this.readString(user.verification) ?? 'not_requested',
    );
    const requiredDocuments = this.readStringArray(stored.requiredDocuments);
    const selectedDocuments = this.readStringArray(stored.selectedDocuments);
    const reason =
      this.readString(stored.reason) ?? this.defaultVerificationReason(status);

    return {
      status,
      reason,
      selectedDocuments,
      requiredDocuments:
        requiredDocuments.length > 0 ? requiredDocuments : [...DEFAULT_VERIFICATION_DOCUMENTS],
      submittedAt: this.readString(stored.submittedAt) ?? null,
    };
  }

  private defaultVerificationReason(status: string) {
    switch (status) {
      case 'approved':
        return 'Approved. Verification badge is ready to appear on your profile.';
      case 'pending':
        return 'Documents uploaded. Under review.';
      case 'rejected':
        return 'Rejected. Update your documents and try again.';
      default:
        return 'Not submitted';
    }
  }

  private normalizeVerificationStatus(value: string) {
    const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, '_');
    switch (normalized) {
      case 'approved':
      case 'pending':
      case 'rejected':
        return normalized;
      case 'notrequested':
      case 'not_requested':
      case 'not requested':
        return 'notRequested';
      default:
        return normalized === 'verified' ? 'approved' : 'notRequested';
    }
  }

  private mapAccountIdentity(user: Awaited<ReturnType<CoreDatabaseService['getUser']>>) {
    return {
      id: user.id,
      name: user.name,
      username: user.username,
      handle: `@${user.username}`,
      role: this.titleCase(String(user.role ?? 'personal')),
      roleLabel: this.titleCase(String(user.role ?? 'personal')),
      isVerified: Boolean(user.verified),
      verified: Boolean(user.verified),
      avatar: user.avatar,
    };
  }

  private mapActivitySession(
    session: {
      sessionId: string;
      createdAt: Date;
      accessExpiresAt: Date;
    },
    isCurrent: boolean,
  ) {
    return {
      id: session.sessionId,
      device: isCurrent ? 'Current device' : 'Trusted device',
      location: 'Authenticated session',
      platform: 'Mobile/Web session',
      lastActiveAt: session.createdAt.toISOString(),
      lastActive: session.createdAt.toISOString(),
      updatedAt: session.createdAt.toISOString(),
      createdAt: session.createdAt.toISOString(),
      expiresAt: session.accessExpiresAt.toISOString(),
      active: session.accessExpiresAt > new Date(),
      isCurrent,
      currentSession: isCurrent,
    };
  }

  private resolveLinkedAccountIds(userId: string, settings: ExtensionSettingsState) {
    const stored = this.readStringArray(settings.accountSwitching?.linkedAccountIds);
    return [...new Set([userId, ...stored])];
  }

  private resolveActiveAccountId(
    userId: string,
    accounts: Array<{ id: string }>,
    settings: ExtensionSettingsState,
  ) {
    const stored = this.readString(settings.accountSwitching?.activeAccountId);
    if (stored && accounts.some((item) => item.id === stored)) {
      return stored;
    }
    return accounts[0]?.id ?? userId;
  }

  private async getUsersByIds(userIds: string[]) {
    const users = await Promise.all(
      userIds.map(async (id) => this.coreDatabase.getUser(id).catch(() => null)),
    );
    return users.filter(
      (item): item is Awaited<ReturnType<CoreDatabaseService['getUser']>> => Boolean(item),
    );
  }

  private async requireSessionFromAuthorization(authorization: string | undefined, userId: string) {
    const accessToken = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (!accessToken) {
      throw new UnauthorizedException('Authentication required.');
    }

    const session = await this.prisma.authSession.findUnique({
      where: { accessToken },
    });
    if (!session || session.userId !== userId) {
      throw new UnauthorizedException('Active session not found.');
    }
    return session;
  }

  private async getSettings(userId: string) {
    const row = await this.prisma.userSettings.findUnique({
      where: { userId },
    });
    return this.toSettingsObject(row?.settings ?? {});
  }

  private async updateSettings(
    userId: string,
    updater: (current: ExtensionSettingsState) => ExtensionSettingsState,
  ) {
    const current = await this.getSettings(userId);
    const next = updater(current);
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
    return next;
  }

  private async appendHistory(
    userId: string,
    entry: { message: string; action: string; sessionId?: string },
  ) {
    await this.updateSettings(userId, (settings) => {
      const history = this.readHistory(settings).slice(0, 19);
      return {
        ...settings,
        activitySessions: {
          ...(settings.activitySessions ?? {}),
          history: [
            {
              id: `${entry.action}_${Date.now()}`,
              message: entry.message,
              action: entry.action,
              sessionId: entry.sessionId,
              createdAt: new Date().toISOString(),
            },
            ...history,
          ],
        },
      };
    });
  }

  private readHistory(settings: ExtensionSettingsState) {
    const value = settings.activitySessions?.history;
    return Array.isArray(value)
      ? value.filter(
          (item): item is {
            id?: string;
            message?: string;
            createdAt?: string;
            action?: string;
            sessionId?: string;
          } => Boolean(item) && typeof item === 'object' && !Array.isArray(item),
        )
      : [];
  }

  private toSettingsObject(value: Prisma.JsonValue | unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as ExtensionSettingsState)
      : {};
  }

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
  }

  private readStringArray(value: unknown) {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : [];
  }

  private titleCase(value: string) {
    return value
      .split(/[\s_-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
}
