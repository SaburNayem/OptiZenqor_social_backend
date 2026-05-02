import { Global, Module } from '@nestjs/common';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { SettingsDataService } from '../data/settings-data.service';
import { AdminSessionGuard } from '../auth/admin-session.guard';
import { RolesGuard } from '../auth/roles.guard';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CloudinaryUploadService } from '../services/cloudinary-upload.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { DatabaseService } from '../services/database.service';
import { ExperienceDatabaseService } from '../services/experience-database.service';
import { JwtTokenService } from '../services/jwt-token.service';
import { MailService } from '../services/mail.service';
import { MonetizationDatabaseService } from '../services/monetization-database.service';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { RealtimeStateService } from '../services/realtime-state.service';
import { ReelsDatabaseService } from '../services/reels-database.service';
import { PrismaService } from '../services/prisma.service';
import { StateSnapshotService } from '../services/state-snapshot.service';
import { StoriesDatabaseService } from '../services/stories-database.service';
import { UploadsDatabaseService } from '../services/uploads-database.service';
import { SettingsDatabaseService } from '../services/settings-database.service';
import { DiscoveryDatabaseService } from '../services/discovery-database.service';
import { ProfilesDatabaseService } from '../services/profiles-database.service';
import { SupportDatabaseService } from '../services/support-database.service';
import { AppExtensionsDatabaseService } from '../services/app-extensions-database.service';
import { SocialStateDatabaseService } from '../services/social-state-database.service';
import { AdminDatabaseService } from '../services/admin-database.service';
import { AppUtilityDatabaseService } from '../services/app-utility-database.service';

@Global()
@Module({
  providers: [
    EcosystemDataService,
    AppExtensionsDataService,
    SettingsDataService,
    AdminSessionGuard,
    RolesGuard,
    SessionAuthGuard,
    CloudinaryUploadService,
    DatabaseService,
    PrismaService,
    JwtTokenService,
    CoreDatabaseService,
    MonetizationDatabaseService,
    ExperienceDatabaseService,
    RealtimeStateService,
    StateSnapshotService,
    MailService,
    AccountStateDatabaseService,
    StoriesDatabaseService,
    UploadsDatabaseService,
    ReelsDatabaseService,
    SettingsDatabaseService,
    DiscoveryDatabaseService,
    ProfilesDatabaseService,
    SupportDatabaseService,
    AppExtensionsDatabaseService,
    SocialStateDatabaseService,
    AdminDatabaseService,
    AppUtilityDatabaseService,
  ],
  exports: [
    EcosystemDataService,
    AppExtensionsDataService,
    SettingsDataService,
    AdminSessionGuard,
    RolesGuard,
    SessionAuthGuard,
    CloudinaryUploadService,
    DatabaseService,
    PrismaService,
    JwtTokenService,
    CoreDatabaseService,
    MonetizationDatabaseService,
    ExperienceDatabaseService,
    RealtimeStateService,
    StateSnapshotService,
    MailService,
    AccountStateDatabaseService,
    StoriesDatabaseService,
    UploadsDatabaseService,
    ReelsDatabaseService,
    SettingsDatabaseService,
    DiscoveryDatabaseService,
    ProfilesDatabaseService,
    SupportDatabaseService,
    AppExtensionsDatabaseService,
    SocialStateDatabaseService,
    AdminDatabaseService,
    AppUtilityDatabaseService,
  ],
})
export class DataModule {}
