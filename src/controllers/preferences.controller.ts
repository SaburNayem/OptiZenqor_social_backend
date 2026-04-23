import { Controller, Get, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import { SettingsDataService } from '../data/settings-data.service';

@ApiTags('preferences')
@Controller()
export class PreferencesController {
  constructor(
    private readonly settingsData: SettingsDataService,
    private readonly platformData: PlatformDataService,
    private readonly appExtensionsData: AppExtensionsDataService,
  ) {}

  @Get('advanced-privacy-controls')
  getAdvancedPrivacyControls() {
    return this.settingsData.getItem('advanced-privacy-controls');
  }

  @Get('safety-privacy')
  getSafetyPrivacy() {
    return this.settingsData.getItem('safety-privacy');
  }

  @Get('accessibility-support')
  getAccessibilitySupport() {
    return this.appExtensionsData.getAccessibilitySupport();
  }

  @Get('explore-recommendation')
  getExploreRecommendations() {
    return this.appExtensionsData.getExploreRecommendations();
  }

  @Get('push-notification-preferences')
  getPushNotificationPreferences() {
    return this.appExtensionsData.getPushNotificationPreferences();
  }

  @Get('legal-compliance')
  getLegalCompliance() {
    return this.appExtensionsData.getLegalCompliance();
  }

  @Get('blocked-muted-accounts')
  @ApiQuery({ name: 'actorId', required: false })
  getBlockedMutedAccounts(@Query('actorId') actorId?: string) {
    const blocked = this.platformData.getBlockedUsers(actorId);
    const blockedMuted = this.appExtensionsData.getBlockedMutedAccounts();
    return {
      success: true,
      blocked,
      muted: blockedMuted.mutedAccounts,
      blockedAccounts: blocked,
      ...blockedMuted,
      data: {
        blocked,
        muted: blockedMuted.mutedAccounts,
        blockedAccounts: blocked,
        ...blockedMuted,
      },
    };
  }
}
