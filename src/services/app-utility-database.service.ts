import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AppExtensionsDatabaseService } from './app-extensions-database.service';
import { AccountStateDatabaseService } from './account-state-database.service';
import { CoreDatabaseService } from './core-database.service';
import { PrismaService } from './prisma.service';
import { SettingsDatabaseService } from './settings-database.service';
import { SupportDatabaseService } from './support-database.service';

type OnboardingSlideRecord = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
};

const DEFAULT_ONBOARDING_SLIDES: OnboardingSlideRecord[] = [
  {
    id: 'identity',
    title: 'Create your social identity',
    subtitle: 'One profile, multiple roles, premium social tools.',
    icon: 'person_pin_circle_rounded',
  },
  {
    id: 'discovery',
    title: 'Discover what matters faster',
    subtitle: 'Reels, communities, market, jobs, and curated feed.',
    icon: 'travel_explore_rounded',
  },
  {
    id: 'growth',
    title: 'Scale with creator and business tools',
    subtitle: 'Insights, campaigns, subscriptions, and growth modules.',
    icon: 'insights_rounded',
  },
];

const DEFAULT_REFERRAL_MILESTONES = [
  { count: 5, reward: 'Premium profile badge' },
  { count: 10, reward: '1 month premium access' },
  { count: 25, reward: 'Priority creator review' },
];

@Injectable()
export class AppUtilityDatabaseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly settingsDatabase: SettingsDatabaseService,
    private readonly supportDatabase: SupportDatabaseService,
    private readonly appExtensionsDatabase: AppExtensionsDatabaseService,
  ) {}

  async getReferralOverview(userId: string) {
    const [user, settingsState] = await Promise.all([
      this.coreDatabase.getUser(userId),
      this.accountStateDatabase.getSettingsState(userId),
    ]);
    const state = settingsState as Record<string, unknown>;
    const settingsMilestones = this.readArrayObjects(
      await this.readOperationalSetting('growth.referral.milestones'),
    )
      .map((item) => ({
        count: this.readNumber(item.count, 0),
        reward: this.readString(item.reward) ?? '',
      }))
      .filter((item) => item.count > 0 && item.reward.trim().length > 0);
    const milestonesSource =
      settingsMilestones.length > 0 ? settingsMilestones : DEFAULT_REFERRAL_MILESTONES;
    const invitedFriends = this.readArrayObjects(state['growth.referral.invited_friends']).map((item) => ({
      id:
        this.readString(item.id) ??
        this.readString(item.email) ??
        this.readString(item.name) ??
        '',
      name: this.readString(item.name) ?? 'Invited friend',
      avatarUrl: this.readString(item.avatarUrl) ?? '',
      status: this.normalizeReferralStatus(this.readString(item.status)),
      invitedAt: this.readString(item.invitedAt) ?? null,
    }));
    const joinedCount = invitedFriends.filter((item) => item.status === 'Joined').length;
    const pendingCount = invitedFriends.filter((item) => item.status === 'Pending').length;
    const inviteCode =
      this.readString(state['growth.referral.code']) ??
      this.buildInviteCode(user.username, user.id);
    const benefit =
      this.readString(state['growth.referral.benefit']) ??
      this.readString(await this.readOperationalSetting('growth.referral.benefit')) ??
      'Invite friends to join OptiZenqor Social and unlock program rewards together.';
    const shareBaseUrl =
      this.readString(await this.readOperationalSetting('growth.referral.share_base_url')) ??
      process.env.APP_SHARE_BASE_URL?.trim() ??
      'https://optizenqor.app/invite';
    const milestones = milestonesSource.map((item) => ({
      count: item.count,
      reward: item.reward,
      isAchieved: joinedCount >= item.count,
    }));

    return {
      inviteCode,
      benefit,
      currentInvites: joinedCount,
      pendingInvites: pendingCount,
      totalMilestone: milestones.length > 0 ? Math.max(...milestones.map((item) => item.count)) : 0,
      shareLink: `${shareBaseUrl.replace(/\/$/, '')}/${inviteCode}`,
      milestones,
      invitedFriends,
      summary: {
        joined: joinedCount,
        pending: pendingCount,
        total: invitedFriends.length,
      },
    };
  }

  async getOnboardingSlides() {
    const configured = this.readArrayObjects(
      await this.readOperationalSetting('app.onboarding.slides'),
    )
      .map((item, index) => this.normalizeOnboardingSlide(item, index))
      .filter((item) => item.title.trim().length > 0);
    const slides = configured.length > 0 ? configured : DEFAULT_ONBOARDING_SLIDES;
    return {
      slides,
      items: slides,
      total: slides.length,
    };
  }

  async getOnboardingState(authorization?: string) {
    const user = await this.resolveOptionalUserFromAuthorization(authorization);
    if (!user) {
      return {
        completed: false,
        selectedInterests: [] as string[],
        completedAt: null,
      };
    }

    const settingsState = (await this.accountStateDatabase.getSettingsState(
      user.id,
    )) as Record<string, unknown>;

    return {
      completed: this.readBoolean(settingsState['onboarding.completed'], false),
      selectedInterests: [
        ...this.readStringArray(settingsState['onboarding.selected_interests']),
        ...this.readStringArray(user.interests),
      ].filter((value, index, array) => array.indexOf(value) === index),
      completedAt: this.readString(settingsState['onboarding.completed_at']) ?? null,
    };
  }

  async getOnboardingInterests() {
    const configured = this.readStringArray(
      await this.readOperationalSetting('app.onboarding.interests'),
    );
    if (configured.length > 0) {
      return configured;
    }

    const users = await this.prisma.appUser.findMany({
      select: { interests: true },
      take: 500,
    });
    const discovered = users.flatMap((user) => this.readStringArray(user.interests));
    return [...new Set(discovered)].sort((left, right) => left.localeCompare(right));
  }

  async completeOnboarding(selectedInterests: string[], authorization?: string) {
    const user = await this.resolveOptionalUserFromAuthorization(authorization);
    const normalizedInterests = [...new Set(selectedInterests.map((item) => item.trim()).filter(Boolean))];

    if (!user) {
      return {
        completed: true,
        selectedInterests: normalizedInterests,
        completedAt: new Date().toISOString(),
      };
    }

    const currentState = (await this.accountStateDatabase.getSettingsState(
      user.id,
    )) as Record<string, unknown>;
    const completedAt = new Date().toISOString();
    await this.prisma.$transaction([
      this.prisma.appUser.update({
        where: { id: user.id },
        data: {
          interests: normalizedInterests as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      }),
      this.prisma.userSettings.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          settings: {
            ...currentState,
            'onboarding.completed': true,
            'onboarding.completed_at': completedAt,
            'onboarding.selected_interests': normalizedInterests,
          } as Prisma.InputJsonValue,
        },
        update: {
          settings: {
            ...currentState,
            'onboarding.completed': true,
            'onboarding.completed_at': completedAt,
            'onboarding.selected_interests': normalizedInterests,
          } as Prisma.InputJsonValue,
          updatedAt: new Date(),
        },
      }),
    ]);

    return {
      completed: true,
      selectedInterests: normalizedInterests,
      completedAt,
    };
  }

  async getMasterData() {
    const [roles, profileTypes, interests] = await Promise.all([
      this.prisma.appUser.groupBy({ by: ['role'] }),
      this.prisma.appUser.groupBy({ by: ['profileType'] }),
      this.getOnboardingInterests(),
    ]);

    return {
      userRoles: roles
        .map((item) => item.role?.trim())
        .filter((item): item is string => Boolean(item)),
      profileTypes: profileTypes
        .map((item) => item.profileType?.trim())
        .filter((item): item is string => Boolean(item)),
      interests,
      contentTypes: ['post', 'story', 'reel', 'event', 'community', 'page', 'job', 'product'],
    };
  }

  async getRecommendations(userId: string) {
    return this.settingsDatabase.getExploreRecommendations(userId);
  }

  async getLegalConsents(userId: string) {
    const compliance = await this.settingsDatabase.getLegalCompliance(userId);
    const state = (await this.accountStateDatabase.getSettingsState(
      userId,
    )) as Record<string, unknown>;
    return {
      ...compliance,
      consents: {
        terms: compliance.termsAccepted,
        privacy: compliance.privacyAccepted,
        guidelines: compliance.guidelinesAccepted,
      },
      accountDeletionRequestedAt:
        this.readString(state['legal.account_deletion_requested_at']) ?? null,
      dataExportRequestedAt: this.readString(state['legal.data_export_requested_at']) ?? null,
    };
  }

  async updateLegalConsents(userId: string, patch: Record<string, boolean>) {
    const settingsPatch: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(patch)) {
      const normalized = key.trim().toLowerCase();
      if (normalized.includes('terms')) {
        settingsPatch['legal.terms_accepted'] = Boolean(value);
      }
      if (normalized.includes('privacy')) {
        settingsPatch['legal.privacy_accepted'] = Boolean(value);
      }
      if (normalized.includes('guidelines')) {
        settingsPatch['legal.guidelines_accepted'] = Boolean(value);
      }
    }
    await this.accountStateDatabase.updateSettingsState(userId, settingsPatch);
    return this.getLegalConsents(userId);
  }

  async requestAccountDeletion(userId: string, reason?: string) {
    const requestedAt = new Date().toISOString();
    await Promise.all([
      this.accountStateDatabase.updateSettingsState(userId, {
        'legal.account_deletion_requested_at': requestedAt,
        'legal.account_deletion_reason': reason?.trim() || null,
      }),
      this.supportDatabase.createTicket({
        userId,
        category: 'account_deletion',
        subject: 'Account deletion request',
        priority: 'high',
        message: reason?.trim() || 'User requested account deletion from the mobile app.',
      }),
    ]);

    return {
      requested: true,
      requestedAt,
      reason: reason?.trim() || null,
    };
  }

  async requestDataExport(userId: string, format?: string) {
    const requestedAt = new Date().toISOString();
    const normalizedFormat = format?.trim().toLowerCase() || 'json';
    await Promise.all([
      this.accountStateDatabase.updateSettingsState(userId, {
        'legal.data_export_requested_at': requestedAt,
        'legal.data_export_format': normalizedFormat,
      }),
      this.supportDatabase.createTicket({
        userId,
        category: 'data_export',
        subject: 'Data export request',
        priority: 'normal',
        message: `User requested a ${normalizedFormat.toUpperCase()} data export.`,
      }),
    ]);

    const [user, posts, reels] = await Promise.all([
      this.coreDatabase.getUser(userId),
      this.coreDatabase.getPosts(userId),
      this.prisma.reel.count({ where: { authorId: userId, deletedAt: null } }),
    ]);

    return {
      requested: true,
      requestedAt,
      format: normalizedFormat,
      summary: {
        username: user.username,
        posts: posts.length,
        reels,
        followers: user.followers,
        following: user.following,
        verificationStatus: user.verificationStatus,
      },
    };
  }

  async getSecurityState(userId: string) {
    const [sessionsPayload, history] = await Promise.all([
      this.appExtensionsDatabase.getActivitySessions(userId),
      this.appExtensionsDatabase.getActivityHistory(userId),
    ]);
    return {
      activeSessions: sessionsPayload.data.sessions,
      sessionCount: sessionsPayload.data.sessions.length,
      loginHistory: history,
      revokeSessionEnabled: sessionsPayload.data.sessions.length > 1,
    };
  }

  async logoutAllSessions(userId: string) {
    await this.prisma.authSession.deleteMany({
      where: { userId },
    });
    return {
      loggedOut: true,
      scope: 'all',
    };
  }

  private async readOperationalSetting(key: string) {
    const row = await this.prisma.adminOperationalSetting.findUnique({
      where: { key },
    });
    return row?.value ?? null;
  }

  private async resolveOptionalUserFromAuthorization(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();
    if (!token) {
      return null;
    }
    return this.coreDatabase.resolveUserFromAccessToken(token);
  }

  private normalizeOnboardingSlide(
    input: Record<string, unknown>,
    index: number,
  ): OnboardingSlideRecord {
    return {
      id: this.readString(input.id) ?? `slide-${index + 1}`,
      title: this.readString(input.title) ?? '',
      subtitle: this.readString(input.subtitle) ?? '',
      icon: this.readString(input.icon) ?? 'auto_awesome_rounded',
    };
  }

  private buildInviteCode(username: string, userId: string) {
    const source = username.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const suffix = userId.replace(/[^A-Za-z0-9]/g, '').slice(-4).toUpperCase();
    return `${source.slice(0, 8) || 'OPTIZEN'}${suffix}`.slice(0, 12);
  }

  private normalizeReferralStatus(status?: string | null) {
    const normalized = status?.trim().toLowerCase();
    if (normalized === 'joined' || normalized === 'accepted') {
      return 'Joined';
    }
    return 'Pending';
  }

  private readArrayObjects(value: unknown) {
    return Array.isArray(value)
      ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
      : [];
  }

  private readStringArray(value: unknown) {
    return Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === 'string')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  }

  private readBoolean(value: unknown, fallback: boolean) {
    return typeof value === 'boolean' ? value : fallback;
  }

  private readNumber(value: unknown, fallback: number) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }
}
