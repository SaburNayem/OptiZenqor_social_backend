import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
      null;
    const shareBaseUrl =
      this.readString(await this.readOperationalSetting('growth.referral.share_base_url')) ?? null;
    const milestones = settingsMilestones.map((item) => ({
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
      shareLink: shareBaseUrl ? `${shareBaseUrl.replace(/\/$/, '')}/${inviteCode}` : null,
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
    const normalizedSlides = await this.readOnboardingCatalogItems('slide');
    const configured =
      normalizedSlides.length > 0
        ? normalizedSlides.map((item, index) => this.normalizeOnboardingSlide(item, index))
        : this.readArrayObjects(await this.readOperationalSetting('app.onboarding.slides'))
            .map((item, index) => this.normalizeOnboardingSlide(item, index))
            .filter((item) => item.title.trim().length > 0);
    const slides = configured;
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
    const normalizedPersonalization = await this.readPersonalizationCatalog();
    if (normalizedPersonalization.length > 0) {
      return normalizedPersonalization;
    }

    const normalizedOnboarding = await this.readOnboardingInterestCatalog();
    if (normalizedOnboarding.length > 0) {
      return normalizedOnboarding;
    }

    const configured = this.readStringArray(await this.readOperationalSetting('app.onboarding.interests'));
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

  async getDeepLinkHandler() {
    const config = this.toRecord(await this.readOperationalSetting('app.deep_link_handler'));
    const supportedPrefixes = this.readStringArray(config.supportedPrefixes);
    return {
      supportedPrefixes,
      recentLinks: this.readStringArray(config.recentLinks).slice(0, 10),
      allowUniversalLinks: this.readBoolean(config.allowUniversalLinks, true),
      openExternalLinksInApp: this.readBoolean(config.openExternalLinksInApp, false),
    };
  }

  async resolveDeepLink(url: string) {
    const normalizedUrl = url.trim();
    const state = await this.getDeepLinkHandler();
    const resolvedPath = this.resolveAppRoute(normalizedUrl);
    const recentLinks = [normalizedUrl, ...state.recentLinks]
      .filter((item, index, array) => item.length > 0 && array.indexOf(item) === index)
      .slice(0, 10);

    await this.writeOperationalSetting('app.deep_link_handler', {
      supportedPrefixes: state.supportedPrefixes,
      recentLinks,
      allowUniversalLinks: state.allowUniversalLinks,
      openExternalLinksInApp: state.openExternalLinksInApp,
    });

    return {
      url: normalizedUrl,
      path: resolvedPath,
      resolvedRoute: resolvedPath,
      explanation: `Incoming link routed to: ${resolvedPath}`,
      recentLinks,
    };
  }

  async getShareRepostOptions() {
    const config = this.toRecord(await this.readOperationalSetting('app.share_repost'));
    const options = this.readArrayObjects(config.options)
      .map((item) => ({
        title: this.readString(item.title) ?? '',
      }))
      .filter((item) => item.title.length > 0);

    return options;
  }

  async trackShareRepost(targetId: string, option: string) {
    const config = this.toRecord(await this.readOperationalSetting('app.share_repost'));
    const recent = this.readArrayObjects(config.recentActivity)
      .map((item) => ({
        targetId: this.readString(item.targetId) ?? '',
        option: this.readString(item.option) ?? '',
        trackedAt: this.readString(item.trackedAt) ?? new Date(0).toISOString(),
      }))
      .filter((item) => item.targetId.length > 0 && item.option.length > 0);
    const event = {
      targetId: targetId.trim(),
      option: option.trim(),
      trackedAt: new Date().toISOString(),
    };

    await this.writeOperationalSetting('app.share_repost', {
      ...config,
      options: (await this.getShareRepostOptions()) as Prisma.InputJsonValue,
      recentActivity: [event, ...recent].slice(0, 50),
    });

    return {
      ...event,
      tracked: true,
    };
  }

  async getOfflineSync(authorization?: string) {
    const user = await this.resolveOptionalUserFromAuthorization(authorization);
    if (user) {
      const [uploads, drafts, settingsState] = await Promise.all([
        this.prisma.mediaUpload.findMany({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
        this.prisma.postDraft.findMany({
          where: { userId: user.id, status: 'draft' },
          orderBy: { updatedAt: 'desc' },
          take: 10,
        }),
        this.accountStateDatabase.getSettingsState(user.id),
      ]);
      const state = settingsState as Record<string, unknown>;
      const queue = [
        ...uploads.map((item) => ({
          title: item.fileName || 'Upload task',
          pending: item.status !== 'completed',
          type: 'upload',
          updatedAt: item.createdAt.toISOString(),
        })),
        ...drafts.map((item) => ({
          title: item.title || 'Draft save',
          pending: true,
          type: 'draft',
          updatedAt: item.updatedAt.toISOString(),
        })),
      ].slice(0, 10);

      return {
        isOffline: this.readBoolean(state['data.offline_mode'], false),
        queue,
        pendingCount: queue.filter((item) => item.pending).length,
        lastSyncAt: this.readString(state['data.last_sync_at']) ?? null,
      };
    }

    const config = this.toRecord(await this.readOperationalSetting('app.offline_sync_preview'));
    return {
      isOffline: this.readBoolean(config.isOffline, false),
      queue: this.readArrayObjects(config.queue).map((item) => ({
        title: this.readString(item.title) ?? 'Queued action',
        pending: this.readBoolean(item.pending, false),
      })),
      pendingCount: this.readNumber(config.pendingCount, 0),
      lastSyncAt: this.readString(config.lastSyncAt),
    };
  }

  async retryOfflineSync(authorization?: string) {
    const user = await this.resolveOptionalUserFromAuthorization(authorization);
    if (user) {
      await this.accountStateDatabase.updateSettingsState(user.id, {
        'data.offline_mode': false,
        'data.last_sync_at': new Date().toISOString(),
      });
      return this.getOfflineSync(authorization);
    }

    const payload = {
      isOffline: false,
      queue: [] as Array<{ title: string; pending: boolean }>,
      pendingCount: 0,
      lastSyncAt: new Date().toISOString(),
    };
    await this.writeOperationalSetting('app.offline_sync_preview', payload);
    return payload;
  }

  async getMediaViewerItems() {
    const [posts, reels] = await Promise.all([
      this.prisma.appPost.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          media: true,
          type: true,
        },
      }),
      this.prisma.reel.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          thumbnailUrl: true,
          videoUrl: true,
        },
      }),
    ]);

    const postItems = posts.flatMap((post, postIndex) =>
      this.readStringArray(post.media).map((url, mediaIndex) => ({
        id: `${post.id}:${mediaIndex}`,
        url,
        type: this.inferMediaType(url, post.type),
        sourceType: 'post',
        sourceId: post.id,
        order: postIndex,
      })),
    );
    const reelItems = reels.flatMap((reel, reelIndex) =>
      [reel.videoUrl, reel.thumbnailUrl]
        .map((url, index) => ({
          url: url?.trim() ?? '',
          type: index === 0 ? 'video' : 'image',
        }))
        .filter((item) => item.url.length > 0)
        .map((item, mediaIndex) => ({
          id: `${reel.id}:${mediaIndex}`,
          url: item.url,
          type: item.type,
          sourceType: 'reel',
          sourceId: reel.id,
          order: reelIndex,
        })),
    );

    return [...postItems, ...reelItems]
      .sort((left, right) => left.order - right.order)
      .map(({ order, ...item }) => item);
  }

  async getMediaViewerItem(id: string) {
    const item = (await this.getMediaViewerItems()).find((entry) => entry.id === id);
    if (!item) {
      throw new NotFoundException(`Media item ${id} not found.`);
    }
    return item;
  }

  async getPersonalizationOnboarding(authorization?: string) {
    const [interests, state] = await Promise.all([
      this.getOnboardingInterests(),
      this.getOnboardingState(authorization),
    ]);
    const selected = new Set(state.selectedInterests.map((item) => item.trim()));
    const items = interests.map((name) => ({
      name,
      selected: selected.has(name),
    }));
    return {
      interests: items,
      selectedCount: items.filter((item) => item.selected).length,
      canContinue: items.some((item) => item.selected),
      completed: state.completed,
      completedAt: state.completedAt,
    };
  }

  async togglePersonalizationInterest(name: string, authorization?: string) {
    const normalized = name.trim();
    if (!normalized) {
      throw new NotFoundException('Interest name is required.');
    }

    const user = await this.resolveOptionalUserFromAuthorization(authorization);
    if (!user) {
      const preview = this.toRecord(
        await this.readOperationalSetting('app.personalization.preview'),
      );
      const selected = this.readStringArray(preview.selectedInterests);
      const next = selected.includes(normalized)
        ? selected.filter((item) => item !== normalized)
        : [...selected, normalized];
      await this.writeOperationalSetting('app.personalization.preview', {
        selectedInterests: next,
      });

      return {
        interests: (await this.getOnboardingInterests()).map((item) => ({
          name: item,
          selected: next.includes(item),
        })),
        selectedCount: next.length,
        canContinue: next.length > 0,
      };
    }

    const currentState = await this.getOnboardingState(authorization);
    const next = currentState.selectedInterests.includes(normalized)
      ? currentState.selectedInterests.filter((item) => item !== normalized)
      : [...currentState.selectedInterests, normalized];
    await this.accountStateDatabase.updateSettingsState(user.id, {
      'onboarding.selected_interests': next,
    });
    return this.getPersonalizationOnboarding(authorization);
  }

  async getAppUpdateFlow() {
    const config = this.toRecord(await this.readOperationalSetting('app.update_flow'));
    return {
      type: this.readString(config.type) ?? '',
      message: this.readString(config.message) ?? null,
      isUpdating: this.readBoolean(config.isUpdating, false),
      latestVersion: this.readString(config.latestVersion) ?? null,
      minVersion: this.readString(config.minVersion) ?? null,
    };
  }

  async startAppUpdate() {
    const current = await this.getAppUpdateFlow();
    const payload = {
      ...current,
      isUpdating: false,
      lastStartedAt: new Date().toISOString(),
      status: 'completed',
      message: current.message,
    };
    await this.writeOperationalSetting('app.update_flow', payload);
    return payload;
  }

  async getLocalizationSupport(authorization?: string) {
    const user = await this.resolveOptionalUserFromAuthorization(authorization);
    const supportedLocales = await this.resolveSupportedLocales();
    const fallbackLocale = this.readString(
      await this.readOperationalSetting('locale.fallback_locale'),
    );

    if (!user) {
      return {
        locales: supportedLocales,
        selected:
          this.readString(await this.readOperationalSetting('locale.default')) ??
          fallbackLocale ??
          supportedLocales[0]?.localeCode ??
          '',
        fallbackLocale: fallbackLocale ?? '',
      };
    }

    const state = (await this.accountStateDatabase.getSettingsState(
      user.id,
    )) as Record<string, unknown>;
    return {
      locales: supportedLocales,
      selected:
        this.readString(state['locale.language_code']) ??
        this.readString(state['locale.language'])?.slice(0, 2).toLowerCase() ??
        fallbackLocale ??
        supportedLocales[0]?.localeCode ??
        '',
      fallbackLocale: fallbackLocale ?? '',
    };
  }

  async setLocale(localeCode: string, authorization?: string) {
    const supportedLocales = await this.resolveSupportedLocales();
    const locale = supportedLocales.find((item) => item.localeCode === localeCode.trim());
    if (!locale) {
      throw new NotFoundException(`Locale ${localeCode} not found.`);
    }

    const user = await this.resolveOptionalUserFromAuthorization(authorization);
    if (!user) {
      await this.writeOperationalSetting('locale.default', {
        value: locale.localeCode,
      });
      return this.getLocalizationSupport();
    }

    await this.accountStateDatabase.updateSettingsState(user.id, {
      'locale.language_code': locale.localeCode,
      'locale.language': locale.label,
    });
    return this.getLocalizationSupport(authorization);
  }

  async getMaintenanceMode() {
    const config = this.toRecord(await this.readOperationalSetting('app.maintenance_mode'));
    return {
      title: this.readString(config.title) ?? null,
      message: this.readString(config.message) ?? null,
      isActive: this.readBoolean(config.isActive, false),
      isRetrying: this.readBoolean(config.isRetrying, false),
    };
  }

  async retryMaintenance() {
    const state = await this.getMaintenanceMode();
    const payload = {
      ...state,
      isRetrying: false,
      status: 'retried',
      lastRetriedAt: new Date().toISOString(),
    };
    await this.writeOperationalSetting('app.maintenance_mode', payload);
    return payload;
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

  private async writeOperationalSetting(key: string, value: Record<string, unknown>) {
    await this.prisma.adminOperationalSetting.upsert({
      where: { key },
      create: {
        key,
        value: value as Prisma.InputJsonValue,
      },
      update: {
        value: value as Prisma.InputJsonValue,
        updatedAt: new Date(),
      },
    });
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

  private resolveAppRoute(url: string) {
    const uri = UriSafe.parse(url);
    if (!uri) {
      return '/';
    }
    const first = uri.segments[0];
    const second = uri.segments[1];
    if (first === 'post' && second) {
      return `/post-detail?id=${second}`;
    }
    if (first === 'profile' && second) {
      return `/user-profile?id=${second}`;
    }
    if (first === 'chat' && second) {
      return `/chat?chatId=${second}`;
    }
    return uri.path || '/';
  }

  private async resolveSupportedLocales() {
    const normalized = await this.readLocalizationCatalog();
    if (normalized.length > 0) {
      return normalized;
    }

    return this.readArrayObjects(await this.readOperationalSetting('app.localization.locales'))
      .map((item) => ({
        localeCode: this.readString(item.localeCode) ?? '',
        label: this.readString(item.label) ?? '',
      }))
      .filter((item) => item.localeCode.length > 0 && item.label.length > 0);
  }

  private async readOnboardingCatalogItems(catalogType: string) {
    const rows = await this.prisma.$queryRaw<
      Array<{
        code: string;
        title: string;
        subtitle: string | null;
        icon: string | null;
      }>
    >`select code, title, subtitle, icon
       from app_onboarding_catalog_items
       where catalog_type = ${catalogType} and is_active = true
       order by sort_order asc, code asc`;

    return rows.map((item) => ({
      id: item.code,
      title: item.title,
      subtitle: item.subtitle,
      icon: item.icon,
    }));
  }

  private async readOnboardingInterestCatalog() {
    const rows = await this.prisma.$queryRaw<Array<{ title: string }>>`
      select title
      from app_onboarding_catalog_items
      where catalog_type = 'interest' and is_active = true
      order by sort_order asc, code asc
    `;
    return rows
      .map((item) => item.title?.trim() || '')
      .filter((item) => item.length > 0);
  }

  private async readPersonalizationCatalog() {
    const rows = await this.prisma.$queryRaw<Array<{ title: string }>>`
      select title
      from app_personalization_catalog_items
      where is_active = true
      order by sort_order asc, code asc
    `;
    return rows
      .map((item) => item.title?.trim() || '')
      .filter((item) => item.length > 0);
  }

  private async readLocalizationCatalog() {
    const rows = await this.prisma.$queryRaw<
      Array<{
        locale_code: string;
        label: string;
        native_label: string | null;
      }>
    >`select locale_code, label, native_label
       from app_localization_locale_catalog
       where is_active = true
       order by is_default desc, sort_order asc, locale_code asc`;

    return rows
      .map((item) => ({
        localeCode: item.locale_code?.trim() || '',
        label: item.native_label?.trim() || item.label?.trim() || '',
      }))
      .filter((item) => item.localeCode.length > 0 && item.label.length > 0);
  }

  private inferMediaType(url: string, fallbackType?: string | null) {
    const normalized = url.toLowerCase();
    if (normalized.match(/\.(mp4|mov|webm|m4v)(\?|$)/)) {
      return 'video';
    }
    if (normalized.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/)) {
      return 'image';
    }
    return fallbackType?.trim().toLowerCase() === 'video' ? 'video' : 'image';
  }

  private toRecord(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
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

class UriSafe {
  static parse(value: string) {
    try {
      const normalized = value.trim();
      if (!normalized) {
        return null;
      }
      const url = normalized.startsWith('optizenqor://')
        ? normalized.replace('optizenqor://', 'https://optizenqor.app/')
        : normalized;
      const parsed = new URL(url);
      return {
        path: parsed.pathname,
        segments: parsed.pathname.split('/').filter(Boolean),
      };
    } catch {
      return null;
    }
  }
}
