import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { SettingsDataService } from '../data/settings-data.service';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('preferences')
@Controller()
export class PreferencesController {
  constructor(
    private readonly settingsData: SettingsDataService,
    private readonly appExtensionsData: AppExtensionsDataService,
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get('advanced-privacy-controls')
  @UseGuards(JwtAuthGuard)
  async getAdvancedPrivacyControls(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const item = this.settingsData.getItem('advanced-privacy-controls');
    return {
      ...item,
      data: {
        ...item.data,
        privacy: await this.accountStateDatabase.getPrivacySnapshot(user.id),
      },
    };
  }

  @Get('safety-privacy')
  @UseGuards(JwtAuthGuard)
  async getSafetyPrivacy(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const [item, blocked] = await Promise.all([
      Promise.resolve(this.settingsData.getItem('safety-privacy')),
      this.accountStateDatabase.getBlockedUsers(user.id),
    ]);
    return {
      ...item,
      data: {
        ...item.data,
        privacy: await this.accountStateDatabase.getPrivacySnapshot(user.id),
        blockedCount: blocked.length,
      },
    };
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
  @UseGuards(JwtAuthGuard)
  async getBlockedMutedAccounts(
    @Query('actorId') actorId?: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      actorId,
    );
    const blocked = await this.accountStateDatabase.getBlockedUsers(user.id);
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
