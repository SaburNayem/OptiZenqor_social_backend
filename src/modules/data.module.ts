import { Global, Module } from '@nestjs/common';
import { AdminOpsDataService } from '../data/admin-ops-data.service';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { ExtendedDataService } from '../data/extended-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import { SettingsDataService } from '../data/settings-data.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CloudinaryUploadService } from '../services/cloudinary-upload.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { DatabaseService } from '../services/database.service';
import { MailService } from '../services/mail.service';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { RealtimeStateService } from '../services/realtime-state.service';
import { ReelsDatabaseService } from '../services/reels-database.service';
import { StateSnapshotService } from '../services/state-snapshot.service';
import { StoriesDatabaseService } from '../services/stories-database.service';
import { UploadsDatabaseService } from '../services/uploads-database.service';

@Global()
@Module({
  providers: [
    PlatformDataService,
    EcosystemDataService,
    ExtendedDataService,
    AdminOpsDataService,
    AppExtensionsDataService,
    SettingsDataService,
    JwtAuthGuard,
    RolesGuard,
    CloudinaryUploadService,
    DatabaseService,
    CoreDatabaseService,
    RealtimeStateService,
    StateSnapshotService,
    MailService,
    AccountStateDatabaseService,
    StoriesDatabaseService,
    UploadsDatabaseService,
    ReelsDatabaseService,
  ],
  exports: [
    PlatformDataService,
    EcosystemDataService,
    ExtendedDataService,
    AdminOpsDataService,
    AppExtensionsDataService,
    SettingsDataService,
    JwtAuthGuard,
    RolesGuard,
    CloudinaryUploadService,
    DatabaseService,
    CoreDatabaseService,
    RealtimeStateService,
    StateSnapshotService,
    MailService,
    AccountStateDatabaseService,
    StoriesDatabaseService,
    UploadsDatabaseService,
    ReelsDatabaseService,
  ],
})
export class DataModule {}
