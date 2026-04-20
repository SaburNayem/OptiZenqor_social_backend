import { Module } from '@nestjs/common';
import { BlockController } from '../controllers/block.controller';
import { BookmarksController } from '../controllers/bookmarks.controller';
import { CommunitiesController } from '../controllers/communities.controller';
import { DiscoveryController } from '../controllers/discovery.controller';
import { EngagementController } from '../controllers/engagement.controller';
import { EventsController } from '../controllers/events.controller';
import { HideController } from '../controllers/hide.controller';
import { InviteFriendsController } from '../controllers/invite-friends.controller';
import { JobsController } from '../controllers/jobs.controller';
import { MarketplaceController } from '../controllers/marketplace.controller';
import { MonetizationController } from '../controllers/monetization.controller';
import { NotificationsController } from '../controllers/notifications.controller';
import { PremiumPlansController } from '../controllers/premium-plans.controller';
import { SettingsController } from '../controllers/settings.controller';
import { SupportController } from '../controllers/support.controller';
import { WalletController } from '../controllers/wallet.controller';

@Module({
  controllers: [
    BlockController,
    BookmarksController,
    HideController,
    DiscoveryController,
    CommunitiesController,
    EventsController,
    JobsController,
    EngagementController,
    SupportController,
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
