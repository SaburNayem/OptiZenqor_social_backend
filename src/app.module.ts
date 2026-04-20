import { Module } from '@nestjs/common';
import { AccountOpsController } from './controllers/account-ops.controller';
import { AdminOpsController } from './controllers/admin-ops.controller';
import { ConfigModule } from '@nestjs/config';
import { AdminController } from './controllers/admin.controller';
import { AuthController } from './controllers/auth.controller';
import { BlockController } from './controllers/block.controller';
import { BookmarksController } from './controllers/bookmarks.controller';
import { BootstrapController } from './controllers/bootstrap.controller';
import { ChatController } from './controllers/chat.controller';
import { CommentsController } from './controllers/comments.controller';
import { CommunitiesController } from './controllers/communities.controller';
import { ContentController } from './controllers/content.controller';
import { CreatorFlowController } from './controllers/creator-flow.controller';
import { DiscoveryController } from './controllers/discovery.controller';
import { EngagementController } from './controllers/engagement.controller';
import { EventsController } from './controllers/events.controller';
import { HealthController } from './controllers/health.controller';
import { HideController } from './controllers/hide.controller';
import { JobsController } from './controllers/jobs.controller';
import { LikesController } from './controllers/likes.controller';
import { MarketplaceController } from './controllers/marketplace.controller';
import { MonetizationController } from './controllers/monetization.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { OnboardingController } from './controllers/onboarding.controller';
import { PostDetailController } from './controllers/post-detail.controller';
import { PostsController } from './controllers/posts.controller';
import { PremiumPlansController } from './controllers/premium-plans.controller';
import { RealtimeController } from './controllers/realtime.controller';
import { ReelsController } from './controllers/reels.controller';
import { SettingsController } from './controllers/settings.controller';
import { StoriesController } from './controllers/stories.controller';
import { SupportController } from './controllers/support.controller';
import { UsersController } from './controllers/users.controller';
import { WalletController } from './controllers/wallet.controller';
import { InviteFriendsController } from './controllers/invite-friends.controller';
import { AdminOpsDataService } from './data/admin-ops-data.service';
import { EcosystemDataService } from './data/ecosystem-data.service';
import { ExtendedDataService } from './data/extended-data.service';
import { PlatformDataService } from './data/platform-data.service';
import { SettingsDataService } from './data/settings-data.service';
import { MailService } from './services/mail.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [
    HealthController,
    BootstrapController,
    AuthController,
    BlockController,
    BookmarksController,
    OnboardingController,
    UsersController,
    ContentController,
    HideController,
    PostsController,
    LikesController,
    StoriesController,
    ReelsController,
    CommentsController,
    PostDetailController,
    CreatorFlowController,
    AccountOpsController,
    ChatController,
    AdminOpsController,
    EventsController,
    DiscoveryController,
    CommunitiesController,
    JobsController,
    EngagementController,
    SupportController,
    RealtimeController,
    MarketplaceController,
    MonetizationController,
    NotificationsController,
    InviteFriendsController,
    WalletController,
    PremiumPlansController,
    SettingsController,
    AdminController,
  ],
  providers: [
    PlatformDataService,
    EcosystemDataService,
    ExtendedDataService,
    AdminOpsDataService,
    SettingsDataService,
    MailService,
  ],
})
export class AppModule {}
