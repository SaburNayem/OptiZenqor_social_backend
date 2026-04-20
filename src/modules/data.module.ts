import { Global, Module } from '@nestjs/common';
import { AdminOpsDataService } from '../data/admin-ops-data.service';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { ExtendedDataService } from '../data/extended-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import { SettingsDataService } from '../data/settings-data.service';
import { MailService } from '../services/mail.service';

@Global()
@Module({
  providers: [
    PlatformDataService,
    EcosystemDataService,
    ExtendedDataService,
    AdminOpsDataService,
    AppExtensionsDataService,
    SettingsDataService,
    MailService,
  ],
  exports: [
    PlatformDataService,
    EcosystemDataService,
    ExtendedDataService,
    AdminOpsDataService,
    AppExtensionsDataService,
    SettingsDataService,
    MailService,
  ],
})
export class DataModule {}
