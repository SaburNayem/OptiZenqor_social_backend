import { Global, Module } from '@nestjs/common';
import { AdminOpsDataService } from '../data/admin-ops-data.service';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { ExtendedDataService } from '../data/extended-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import { SettingsDataService } from '../data/settings-data.service';
import { CloudinaryUploadService } from '../services/cloudinary-upload.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { DatabaseService } from '../services/database.service';
import { MailService } from '../services/mail.service';
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
    CloudinaryUploadService,
    DatabaseService,
    CoreDatabaseService,
    RealtimeStateService,
    StateSnapshotService,
    MailService,
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
    CloudinaryUploadService,
    DatabaseService,
    CoreDatabaseService,
    RealtimeStateService,
    StateSnapshotService,
    MailService,
    StoriesDatabaseService,
    UploadsDatabaseService,
    ReelsDatabaseService,
  ],
})
export class DataModule {}
