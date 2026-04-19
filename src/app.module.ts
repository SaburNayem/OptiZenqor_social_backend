import { Module } from '@nestjs/common';
import { AccountOpsController } from './controllers/account-ops.controller';
import { AdminOpsController } from './controllers/admin-ops.controller';
import { ConfigModule } from '@nestjs/config';
import { AdminController } from './controllers/admin.controller';
import { AuthController } from './controllers/auth.controller';
import { BootstrapController } from './controllers/bootstrap.controller';
import { ChatController } from './controllers/chat.controller';
import { CommunitiesController } from './controllers/communities.controller';
import { ContentController } from './controllers/content.controller';
import { CreatorFlowController } from './controllers/creator-flow.controller';
import { DiscoveryController } from './controllers/discovery.controller';
import { EngagementController } from './controllers/engagement.controller';
import { EventsController } from './controllers/events.controller';
import { HealthController } from './controllers/health.controller';
import { JobsController } from './controllers/jobs.controller';
import { MarketplaceController } from './controllers/marketplace.controller';
import { MonetizationController } from './controllers/monetization.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { OnboardingController } from './controllers/onboarding.controller';
import { PostDetailController } from './controllers/post-detail.controller';
import { RealtimeController } from './controllers/realtime.controller';
import { SupportController } from './controllers/support.controller';
import { UsersController } from './controllers/users.controller';
import { AdminOpsDataService } from './data/admin-ops-data.service';
import { EcosystemDataService } from './data/ecosystem-data.service';
import { ExtendedDataService } from './data/extended-data.service';
import { PlatformDataService } from './data/platform-data.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [
    HealthController,
    BootstrapController,
    AuthController,
    OnboardingController,
    UsersController,
    ContentController,
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
    AdminController,
  ],
  providers: [
    PlatformDataService,
    EcosystemDataService,
    ExtendedDataService,
    AdminOpsDataService,
  ],
})
export class AppModule {}
