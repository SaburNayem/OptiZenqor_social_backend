import { Module } from '@nestjs/common';
import { AccountSwitchingController } from '../controllers/account-switching.controller';
import { ArchiveController } from '../controllers/archive.controller';
import { ActivitySessionsController } from '../controllers/activity-sessions.controller';
import { BlockController } from '../controllers/block.controller';
import { BookmarksController } from '../controllers/bookmarks.controller';
import { CommunitiesController } from '../controllers/communities.controller';
import { DeepLinkHandlerController } from '../controllers/deep-link-handler.controller';
import { DiscoveryController } from '../controllers/discovery.controller';
import { EngagementController } from '../controllers/engagement.controller';
import { EventsController } from '../controllers/events.controller';
import { HiddenPostsController } from '../controllers/hidden-posts.controller';
import { HideController } from '../controllers/hide.controller';
import { InviteFriendsController } from '../controllers/invite-friends.controller';
import { JobsController } from '../controllers/jobs.controller';
import { LearningCoursesController } from '../controllers/learning-courses.controller';
import { LocalizationSupportController } from '../controllers/localization-support.controller';
import { MaintenanceModeController } from '../controllers/maintenance-mode.controller';
import { MarketplaceController } from '../controllers/marketplace.controller';
import { MonetizationController } from '../controllers/monetization.controller';
import { NotificationsController } from '../controllers/notifications.controller';
import { OfflineSyncController } from '../controllers/offline-sync.controller';
import { PersonalizationOnboardingController } from '../controllers/personalization-onboarding.controller';
import { PollsSurveysController } from '../controllers/polls-surveys.controller';
import { PreferencesController } from '../controllers/preferences.controller';
import { PremiumPlansController } from '../controllers/premium-plans.controller';
import { ProfilesController } from '../controllers/profiles.controller';
import { ReportCenterController } from '../controllers/report-center.controller';
import { SettingsController } from '../controllers/settings.controller';
import { ShareRepostController } from '../controllers/share-repost.controller';
import { SupportController } from '../controllers/support.controller';
import { VerificationRequestController } from '../controllers/verification-request.controller';
import { WalletController } from '../controllers/wallet.controller';
import { AppUpdateFlowController } from '../controllers/app-update-flow.controller';

@Module({
  controllers: [
    AccountSwitchingController,
    ActivitySessionsController,
    AppUpdateFlowController,
    ArchiveController,
    BlockController,
    BookmarksController,
    DeepLinkHandlerController,
    HiddenPostsController,
    HideController,
    DiscoveryController,
    CommunitiesController,
    EventsController,
    JobsController,
    EngagementController,
    LearningCoursesController,
    LocalizationSupportController,
    MaintenanceModeController,
    OfflineSyncController,
    PersonalizationOnboardingController,
    PollsSurveysController,
    PreferencesController,
    ReportCenterController,
    ProfilesController,
    ShareRepostController,
    SupportController,
    VerificationRequestController,
    MarketplaceController,
    MonetizationController,
    NotificationsController,
    InviteFriendsController,
    WalletController,
    PremiumPlansController,
    SettingsController,
  ],
})
export class ExperienceApiModule {}
