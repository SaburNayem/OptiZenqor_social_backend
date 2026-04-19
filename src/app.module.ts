import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminController } from './controllers/admin.controller';
import { AuthController } from './controllers/auth.controller';
import { ChatController } from './controllers/chat.controller';
import { ContentController } from './controllers/content.controller';
import { EventsController } from './controllers/events.controller';
import { HealthController } from './controllers/health.controller';
import { MarketplaceController } from './controllers/marketplace.controller';
import { MonetizationController } from './controllers/monetization.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { UsersController } from './controllers/users.controller';
import { PlatformDataService } from './data/platform-data.service';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  controllers: [
    HealthController,
    AuthController,
    UsersController,
    ContentController,
    ChatController,
    EventsController,
    MarketplaceController,
    MonetizationController,
    NotificationsController,
    AdminController,
  ],
  providers: [PlatformDataService],
})
export class AppModule {}
