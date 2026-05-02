import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  SettingsDataService,
  SettingsItemRecord,
  SettingsSectionRecord,
} from '../data/settings-data.service';
import { AccountStateDatabaseService } from './account-state-database.service';
import { CoreDatabaseService } from './core-database.service';
import { MonetizationDatabaseService } from './monetization-database.service';
import { PrismaService } from './prisma.service';
import { UploadsDatabaseService } from './uploads-database.service';

type SettingsContext = {
  user: Awaited<ReturnType<CoreDatabaseService['getUser']>>;
  settingsState: Record<string, unknown>;
  blockedUsers: Awaited<ReturnType<AccountStateDatabaseService['getBlockedUsers']>>;
  bookmarks: Awaited<ReturnType<AccountStateDatabaseService['getBookmarks']>>;
  collections: Awaited<ReturnType<AccountStateDatabaseService['getCollections']>>;
  drafts: Awaited<ReturnType<AccountStateDatabaseService['getDrafts']>>;
  scheduled: Awaited<ReturnType<AccountStateDatabaseService['getScheduledDrafts']>>;
  reports: Awaited<ReturnType<AccountStateDatabaseService['getReportCenter']>>;
  uploads: Awaited<ReturnType<UploadsDatabaseService['getUploads']>>;
  wallet: Awaited<ReturnType<MonetizationDatabaseService['getWallet']>> | null;
  sessions: number;
  creatorAnalytics:
    | Awaited<ReturnType<AccountStateDatabaseService['getCreatorAnalytics']>>
    | null;
};

@Injectable()
export class SettingsDatabaseService {
  constructor(
    private readonly settingsData: SettingsDataService,
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly monetizationDatabase: MonetizationDatabaseService,
    private readonly prisma: PrismaService,
    private readonly uploadsDatabase: UploadsDatabaseService,
  ) {}

  async getSections(userId: string) {
    const context = await this.buildContext(userId);
    const sections = this.settingsData.getSections();
    return sections.map((section) => this.hydrateSection(section, context));
  }

  async getItems(userId: string) {
    const sections = await this.getSections(userId);
    return sections.flatMap((section) =>
      section.items.map((item) => ({
        ...item,
        sectionKey: section.key,
        sectionTitle: section.title,
      })),
    );
  }

  async getItem(userId: string, itemKey: string) {
    const context = await this.buildContext(userId);
    return this.hydrateItem(this.settingsData.getItem(itemKey), context);
  }

  async getRouteEntry(userId: string, routePath: string) {
    const context = await this.buildContext(userId);
    const entry = this.settingsData.getRouteEntry(routePath);
    return this.isSection(entry)
      ? this.hydrateSection(entry, context)
      : this.hydrateItem(entry, context);
  }

  async updateItem(userId: string, itemKey: string, patch: Record<string, unknown>) {
    await this.accountStateDatabase.updateSettingsState(userId, {
      [`catalog.item_overrides.${itemKey}`]: patch,
    });
    return this.getItem(userId, itemKey);
  }

  async updateRouteEntry(userId: string, routePath: string, patch: Record<string, unknown>) {
    const entry = this.settingsData.getRouteEntry(routePath);
    if (this.isSection(entry)) {
      await this.accountStateDatabase.updateSettingsState(userId, {
        [`catalog.section_overrides.${entry.key}`]: patch,
      });
      return this.getRouteEntry(userId, routePath);
    }

    return this.updateItem(userId, entry.key, patch);
  }

  async getAdvancedPrivacyControls(userId: string) {
    return this.getItem(userId, 'advanced-privacy-controls');
  }

  async getSafetyPrivacy(userId: string) {
    return this.getItem(userId, 'safety-privacy');
  }

  async getAccessibilitySupport(userId: string) {
    const context = await this.buildContext(userId);
    const state = context.settingsState;
    const normalizedOptions = await this.readAccessibilityCatalog();
    const options =
      normalizedOptions.length > 0
        ? normalizedOptions
        : (await this.readArraySetting('app.accessibility.options'))
            .map((item) => ({
              title: this.readString(item['title']) ?? '',
              key: this.readString(item['key']) ?? '',
              enabledByDefault: this.readBoolean(item['enabledByDefault'], false),
            }))
            .filter((item) => item.title.length > 0 && item.key.length > 0);

    return {
      options: options.map((item) => ({
        title: item.title,
        enabled: this.readBoolean(state[item.key], item.enabledByDefault),
      })),
      previewState: {
        screenReaderHints: this.readBoolean(
          state['accessibility.screen_reader_hints'],
          false,
        ),
        motionPreviewAvailable: this.readBoolean(
          state['accessibility.motion_preview_available'],
          false,
        ),
      },
    };
  }

  async getExploreRecommendations(userId: string) {
    const context = await this.buildContext(userId);
    const recommendationScore = this.readNumber(
      context.settingsState['explore.recommendation_score'],
      0.81,
    );
    return {
      recommendationScore,
      resetAvailable: this.readBoolean(
        context.settingsState['feed.reset_recommendations'],
        false,
      ),
      topics: this.jsonStringArray(context.user.interests).slice(0, 6),
      hints:
        this.jsonStringArray(context.user.interests).length > 0
          ? this.jsonStringArray(context.user.interests).map((item) => ({
              type: 'interest',
              title: item,
              subtitle: 'Based on your saved interests',
            }))
          : [],
    };
  }

  async getPushNotificationPreferences(userId: string) {
    const context = await this.buildContext(userId);
    const stored = this.resolvePushPreferences(context.settingsState);
    if (stored.length > 0) {
      return stored;
    }

    const catalog = await this.readArraySetting('notifications.push_categories');
    return catalog
      .map((item) => ({
        title: this.readString(item['title']) ?? '',
        enabled: this.readBoolean(item['enabledByDefault'], false),
      }))
      .filter((item) => item.title.length > 0);
  }

  async updatePushNotificationPreferences(
    userId: string,
    categories: Array<{ title: string; enabled: boolean }>,
  ) {
    const normalized = categories
      .map((item) => ({
        title: item.title.trim(),
        enabled: Boolean(item.enabled),
      }))
      .filter((item) => item.title.length > 0);

    if (normalized.length === 0) {
      return this.getPushNotificationPreferences(userId);
    }

    await this.accountStateDatabase.updateSettingsState(userId, {
      'preferences.push_categories': normalized,
      'notifications.push_enabled': normalized.some((item) => item.enabled),
    });

    return this.getPushNotificationPreferences(userId);
  }

  async getLegalCompliance(userId: string) {
    const state = (await this.buildContext(userId)).settingsState;
    const normalizedDocuments = await this.readLegalDocumentCatalog();
    const documents =
      normalizedDocuments.length > 0
        ? normalizedDocuments
        : (await this.readArraySetting('legal.documents'))
            .map((item) => ({
              key: this.readString(item['key']) ?? '',
              title: this.readString(item['title']) ?? '',
              version: this.readString(item['version']) ?? '',
            }))
            .filter((item) => item.key.length > 0 && item.title.length > 0);
    return {
      termsAccepted: this.readBoolean(state['legal.terms_accepted'], false),
      privacyAccepted: this.readBoolean(state['legal.privacy_accepted'], false),
      guidelinesAccepted: this.readBoolean(state['legal.guidelines_accepted'], false),
      documents,
    };
  }

  async getBlockedMutedAccounts(userId: string) {
    const [blocked, rawState] = await Promise.all([
      this.accountStateDatabase.getBlockedUsers(userId),
      this.accountStateDatabase.getSettingsState(userId),
    ]);
    const state = rawState as Record<string, unknown>;
    const mutedAccounts = this.readArrayObjects(state['moderation.muted_accounts']).map((item) =>
      this.normalizeRestrictedAccount(item, 'muted'),
    );
    const blockedAccounts = blocked.map((item) => ({
      id: item.id,
      name: item.user.name,
      username: item.user.username,
      handle: item.user.username ? `@${item.user.username}` : '@account',
      avatarUrl: item.user.avatar,
      blockedAt: item.blockedAt,
      reason: item.reason,
      status: 'blocked',
    }));

    return {
      blocked: blockedAccounts,
      muted: mutedAccounts,
      blockedAccounts,
      mutedAccounts,
      restrictedAccounts: this.readArrayObjects(
        state['moderation.restricted_accounts'],
      ),
    };
  }

  async muteAccount(actorUserId: string, targetUserId: string, reason?: string) {
    await this.coreDatabase.getUser(actorUserId);
    const target = await this.coreDatabase.getUser(targetUserId);
    const current = (await this.accountStateDatabase.getSettingsState(
      actorUserId,
    )) as Record<string, unknown>;
    const existing = this.readArrayObjects(current['moderation.muted_accounts'])
      .map((item) => this.normalizeRestrictedAccount(item, 'muted'))
      .filter((item) => item.id !== targetUserId);
    const mutedAccount = {
      id: target.id,
      name: target.name,
      username: target.username,
      handle: target.username ? `@${target.username}` : '@account',
      avatarUrl: target.avatar,
      mutedAt: new Date().toISOString(),
      reason: reason?.trim() || null,
      status: 'muted',
    };

    await this.accountStateDatabase.updateSettingsState(actorUserId, {
      'moderation.muted_accounts': [mutedAccount, ...existing],
    });

    return mutedAccount;
  }

  async unmuteAccount(actorUserId: string, targetUserId: string) {
    await this.coreDatabase.getUser(actorUserId);
    const current = (await this.accountStateDatabase.getSettingsState(
      actorUserId,
    )) as Record<string, unknown>;
    const existing = this.readArrayObjects(current['moderation.muted_accounts']).map((item) =>
      this.normalizeRestrictedAccount(item, 'muted'),
    );
    const mutedAccount = existing.find((item) => item.id === targetUserId) ?? null;

    await this.accountStateDatabase.updateSettingsState(actorUserId, {
      'moderation.muted_accounts': existing.filter((item) => item.id !== targetUserId),
    });

    return {
      id: targetUserId,
      removed: true,
      mutedAccount,
    };
  }

  private async buildContext(userId: string): Promise<SettingsContext> {
    const [
      user,
      rawSettingsState,
      blockedUsers,
      bookmarks,
      collections,
      drafts,
      scheduled,
      reports,
      uploads,
      wallet,
      sessions,
    ] =
      await Promise.all([
        this.coreDatabase.getUser(userId),
        this.accountStateDatabase.getSettingsState(userId),
        this.accountStateDatabase.getBlockedUsers(userId),
        this.accountStateDatabase.getBookmarks(userId),
        this.accountStateDatabase.getCollections(userId),
        this.accountStateDatabase.getDrafts(userId),
        this.accountStateDatabase.getScheduledDrafts(userId),
        this.accountStateDatabase.getReportCenter(userId),
        this.uploadsDatabase.getUploads(userId),
        this.monetizationDatabase.getWallet(userId).catch(() => null),
        this.prisma.authSession.count({ where: { userId } }),
      ]);
    const settingsState = rawSettingsState as Record<string, unknown>;

    const creatorAnalytics =
      user.role?.toLowerCase() === 'creator' || user.role?.toLowerCase() === 'business'
        ? await this.accountStateDatabase.getCreatorAnalytics(userId)
        : null;

    return {
      user,
      settingsState,
      blockedUsers,
      bookmarks,
      collections,
      drafts,
      scheduled,
      reports,
      uploads,
      wallet,
      sessions,
      creatorAnalytics,
    };
  }

  private async readAccessibilityCatalog() {
    const rows = await this.prisma.$queryRaw<
      Array<{
        option_key: string;
        title: string;
        setting_key: string | null;
        default_value: Prisma.JsonValue;
      }>
    >`select option_key, title, setting_key, default_value
       from app_accessibility_option_catalog
       where is_active = true
       order by sort_order asc, option_key asc`;

    return rows
      .map((item) => ({
        title: item.title?.trim() || '',
        key: item.setting_key?.trim() || item.option_key?.trim() || '',
        enabledByDefault:
          typeof item.default_value === 'boolean'
            ? item.default_value
            : typeof item.default_value === 'string'
              ? item.default_value.trim().toLowerCase() === 'true'
              : false,
      }))
      .filter((item) => item.title.length > 0 && item.key.length > 0);
  }

  private async readLegalDocumentCatalog() {
    const rows = await this.prisma.$queryRaw<
      Array<{
        document_key: string;
        title: string;
        version: string;
      }>
    >`select document_key, title, version
       from app_legal_document_versions
       where is_active = true
       order by is_required desc, document_key asc, published_at desc nulls last`;

    return rows
      .map((item) => ({
        key: item.document_key?.trim() || '',
        title: item.title?.trim() || '',
        version: item.version?.trim() || '',
      }))
      .filter((item) => item.key.length > 0 && item.title.length > 0);
  }

  private hydrateSection(
    section: SettingsSectionRecord,
    context: SettingsContext,
  ) {
    const sectionOverride = this.toObject(
      context.settingsState[`catalog.section_overrides.${section.key}`],
    );
    return {
      ...section,
      ...sectionOverride,
      items: section.items.map((item) =>
        this.hydrateItem(
          {
            ...item,
            sectionKey: section.key,
            sectionTitle: section.title,
          },
          context,
        ),
      ),
    };
  }

  private hydrateItem(
    item: SettingsItemRecord & {
      sectionKey?: string;
      sectionTitle?: string;
    },
    context: SettingsContext,
  ) {
    const baseData = this.toObject(item.data);
    const itemOverride = this.toObject(
      context.settingsState[`catalog.item_overrides.${item.key}`],
    );
    const dynamicData = this.resolveDynamicItemData(item.key, context);

    return {
      ...item,
      data: {
        ...baseData,
        ...dynamicData,
        ...itemOverride,
      },
    };
  }

  private resolveDynamicItemData(
    itemKey: string,
    context: SettingsContext,
  ) {
    const state = context.settingsState;
    const reportSummary = this.toObject(context.reports.summary);

    switch (itemKey) {
      case 'account-settings':
        return {
          name: context.user.name,
          username: context.user.username,
          accountType: String(context.user.role ?? '').toLowerCase() || 'user',
          state: {
            profile: {
              name: context.user.name,
              username: context.user.username,
              bio: context.user.bio,
              website: context.user.website,
              email: context.user.email,
              location: context.user.location,
              profileType: String(context.user.role ?? '').toLowerCase() || 'user',
              profileImage: context.user.avatar,
            },
          },
        };
      case 'devices-sessions':
        return {
          data: undefined,
          state: {
            currentDevice: 'Current session',
            recentSessions: context.sessions,
            revokeSessionEnabled: context.sessions > 1,
          },
          activeSessions: context.sessions,
          suspiciousSignins: 0,
        };
      case 'privacy':
        return {
          state: {
            profileVisibility: this.readBoolean(state['privacy.profile_private']),
            lastSeen: this.readBoolean(state['privacy.activity_status']),
            readReceipts: this.readBoolean(state['messages.read_receipts']),
            tagPermissions: this.readBoolean(state['privacy.allow_tagging']),
            mentionPermissions: this.readBoolean(state['privacy.allow_mentions']),
            commentPermissions: this.readBoolean(state['privacy.allow_comments']),
            repostPermissions: this.readBoolean(state['privacy.allow_reposts']),
            sensitiveContent: this.readBoolean(state['privacy.hide_sensitive']),
            discoverability: {
              byEmail: this.readBoolean(state['privacy.searchable_by_email'], false),
              byPhone: this.readBoolean(state['privacy.searchable_by_phone'], false),
            },
          },
        };
      case 'advanced-privacy-controls':
        return {
          data: undefined,
          privacy: {
            profilePrivate: this.readBoolean(state['privacy.profile_private']),
            activityStatus: this.readBoolean(state['privacy.activity_status']),
            allowTagging: this.readBoolean(state['privacy.allow_tagging']),
            allowMentions: this.readBoolean(state['privacy.allow_mentions']),
            allowReposts: this.readBoolean(state['privacy.allow_reposts']),
            allowComments: this.readBoolean(state['privacy.allow_comments']),
            hideSensitive: this.readBoolean(state['privacy.hide_sensitive']),
            hideLikes: this.readBoolean(state['privacy.hide_likes']),
          },
          state: {
            controls: [
              {
                title: 'Private account',
                value: this.readBoolean(state['privacy.profile_private']),
              },
              {
                title: 'Allow mentions',
                value: this.readBoolean(state['privacy.allow_mentions']),
              },
              {
                title: 'Allow comments from everyone',
                value: this.readBoolean(state['privacy.allow_comments']),
              },
              {
                title: 'Sensitive content filter',
                value: this.readBoolean(state['privacy.hide_sensitive']),
              },
              {
                title: 'Hide like counts',
                value: this.readBoolean(state['privacy.hide_likes']),
              },
            ],
          },
        };
      case 'blocked-muted-accounts':
        return {
          blockedCount: context.blockedUsers.length,
        };
      case 'safety-privacy':
        return {
          privacy: {
            profilePrivate: this.readBoolean(state['privacy.profile_private']),
            activityStatus: this.readBoolean(state['privacy.activity_status']),
            allowTagging: this.readBoolean(state['privacy.allow_tagging']),
            allowMentions: this.readBoolean(state['privacy.allow_mentions']),
            allowComments: this.readBoolean(state['privacy.allow_comments']),
            hideSensitive: this.readBoolean(state['privacy.hide_sensitive']),
          },
          blockedCount: context.blockedUsers.length,
        };
      case 'report-center':
        return {
          openReports: this.readNumber(reportSummary.openReports, 0),
          resolvedReports: this.readNumber(reportSummary.resolvedReports, 0),
        };
      case 'notifications':
        return {
          state: {
            pushEnabled: this.readBoolean(state['notifications.push_enabled']),
            emailEnabled: this.readBoolean(state['notifications.email_enabled']),
            inAppSounds: this.readBoolean(state['notifications.in_app_sounds']),
            marketing: this.readBoolean(state['notifications.marketing']),
          },
        };
      case 'notification-categories':
        return {
          state: {
            categories: this.resolvePushPreferences(state),
          },
        };
      case 'messages-calls':
        return {
          state: {
            messageRequests: this.readBoolean(state['messages.message_requests']),
            readReceipts: this.readBoolean(state['messages.read_receipts']),
            allowCalls: this.readBoolean(state['messages.allow_calls']),
            autoDownloadMedia: this.readBoolean(state['messages.auto_download']),
          },
        };
      case 'feed-content-preferences':
        return {
          state: {
            autoplay: this.readBoolean(state['feed.autoplay']),
            dataSaver: this.readBoolean(state['feed.data_saver']),
            hideTopics: this.readStringArray(state['feed.hide_topics']),
            resetRecommendations: this.readBoolean(
              state['feed.reset_recommendations'],
            ),
          },
        };
      case 'saved-collections':
        return {
          collectionCount: context.collections.length,
          bookmarkCount: context.bookmarks.length,
        };
      case 'drafts-scheduling':
        return {
          drafts: context.drafts.length,
          scheduled: context.scheduled.length,
          uploadQueue: context.uploads.length,
        };
      case 'creator-professional-tools':
        return {
          state: {
            professionalDashboard: this.readBoolean(
              state['creator.professional_dashboard'],
            ),
            brandedContent: this.readBoolean(state['creator.branded_content']),
            tips: this.readBoolean(state['creator.tips']),
          },
        };
      case 'creator-dashboard':
        return context.creatorAnalytics
          ? {
              period: '7d',
              reach: String(context.creatorAnalytics.engagement.views),
              storyReplies: String(context.creatorAnalytics.totals.stories),
            }
          : {};
      case 'wallet-payments':
        return context.wallet
          ? {
              available: context.wallet.balance,
              pending: 0,
              defaultPayoutMethod: 'wallet',
            }
          : {};
      case 'communities-groups':
        return {
          state: {
            communityInvites: this.readBoolean(state['communities.invites'], true),
            groupMentions: this.readBoolean(
              state['communities.group_mentions'],
              true,
            ),
            eventsReminders: this.readBoolean(
              state['communities.events_reminders'],
              true,
            ),
          },
        };
      case 'language-region':
        return {
          state: {
            language: this.readString(state['locale.language']) ?? 'English',
            region: this.readString(state['locale.region']) ?? 'Bangladesh',
          },
        };
      case 'accessibility':
        return {
          state: {
            captions: this.readBoolean(state['accessibility.captions'], true),
            highContrast: this.readBoolean(
              state['accessibility.high_contrast'],
              false,
            ),
            reduceMotion: this.readBoolean(
              state['accessibility.reduce_motion'],
              false,
            ),
            textSize: this.readString(state['accessibility.text_size']) ?? 'Default',
          },
        };
      case 'localization-support':
        return {
          supportedLocales: this.readStringArray(state['locale.supported_locales']),
          fallbackLocale: this.readString(state['locale.fallback_locale']) ?? '',
        };
      case 'accessibility-support':
        return {
          ...{
            screenReaderHints: this.readBoolean(
              state['accessibility.screen_reader_hints'],
              true,
            ),
            motionPreviewAvailable: this.readBoolean(
              state['accessibility.motion_preview_available'],
              true,
            ),
          },
        };
      case 'data-privacy-center':
        return {
          state: {
            exportRequested: this.readBoolean(state['data.export_requested'], false),
            adPersonalization: this.readBoolean(
              state['data.ad_personalization'],
              false,
            ),
            dataCollection: this.readBoolean(state['data.data_collection'], true),
          },
        };
      case 'legal-compliance':
        return {
          termsAccepted: this.readBoolean(state['legal.terms_accepted'], true),
          privacyAccepted: this.readBoolean(state['legal.privacy_accepted'], true),
          guidelinesAccepted: this.readBoolean(
            state['legal.guidelines_accepted'],
            true,
          ),
        };
      default:
        return {};
    }
  }

  private resolvePushPreferences(settingsState: Record<string, unknown>) {
    const stored = settingsState['preferences.push_categories'];
    if (Array.isArray(stored)) {
      return stored.filter(
        (item): item is { title: string; enabled: boolean } =>
          Boolean(item) &&
          typeof item === 'object' &&
          !Array.isArray(item) &&
          typeof (item as Record<string, unknown>).title === 'string' &&
          typeof (item as Record<string, unknown>).enabled === 'boolean',
      );
    }
    return [];
  }

  private async readArraySetting(key: string) {
    const row = await this.prisma.adminOperationalSetting.findUnique({
      where: { key },
    });
    if (!Array.isArray(row?.value)) {
      return [] as Array<Record<string, unknown>>;
    }
    return row.value
      .filter((item) => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
      .map((item) => item as Record<string, unknown>);
  }

  private isSection(
    value: SettingsSectionRecord | (SettingsItemRecord & { sectionKey?: string }),
  ): value is SettingsSectionRecord {
    return Array.isArray((value as SettingsSectionRecord).items);
  }

  private toObject(value: unknown) {
    return value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  private readBoolean(value: unknown, fallback = false) {
    return typeof value === 'boolean' ? value : fallback;
  }

  private readNumber(value: unknown, fallback = 0) {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  }

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
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

  private normalizeRestrictedAccount(
    value: Record<string, unknown>,
    status: 'blocked' | 'muted',
  ) {
    const username = this.readString(value.username) ?? this.readString(value.handle);
    const normalizedHandle = username
      ? username.startsWith('@')
        ? username
        : `@${username}`
      : '@account';

    return {
      ...value,
      id: this.readString(value.id) ?? '',
      name: this.readString(value.name) ?? this.readString(value.displayName) ?? normalizedHandle,
      username: username?.replace(/^@/, '') ?? '',
      handle: normalizedHandle,
      avatarUrl: this.readString(value.avatarUrl) ?? this.readString(value.avatar) ?? '',
      status,
    };
  }

  private readArrayLength(value: unknown) {
    return Array.isArray(value) ? value.length : 0;
  }

  private jsonStringArray(value: Prisma.JsonValue | unknown) {
    return Array.isArray(value)
      ? value
          .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
          .map((item) => item.trim())
      : [];
  }
}
