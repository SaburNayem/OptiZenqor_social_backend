import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { SettingsDataService } from '../data/settings-data.service';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { successResponse } from '../utils/api-response.util';

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
  @UseGuards(SessionAuthGuard)
  async getAdvancedPrivacyControls(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const item = this.settingsData.getItem('advanced-privacy-controls');
    return {
      success: true,
      message: 'Advanced privacy controls fetched successfully.',
      data: {
        ...item,
        data: {
          ...item.data,
          privacy: await this.accountStateDatabase.getPrivacySnapshot(user.id),
        },
      },
    };
  }

  @Get('safety-privacy')
  @UseGuards(SessionAuthGuard)
  async getSafetyPrivacy(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const [item, blocked] = await Promise.all([
      Promise.resolve(this.settingsData.getItem('safety-privacy')),
      this.accountStateDatabase.getBlockedUsers(user.id),
    ]);
    return successResponse('Safety and privacy fetched successfully.', {
      ...item,
      data: {
        ...item.data,
        privacy: await this.accountStateDatabase.getPrivacySnapshot(user.id),
        blockedCount: blocked.length,
      },
    });
  }

  @Get('accessibility-support')
  getAccessibilitySupport() {
    return successResponse(
      'Accessibility support fetched successfully.',
      this.appExtensionsData.getAccessibilitySupport(),
    );
  }

  @Get('explore-recommendation')
  getExploreRecommendations() {
    return successResponse(
      'Explore recommendations fetched successfully.',
      this.appExtensionsData.getExploreRecommendations(),
    );
  }

  @Get('push-notification-preferences')
  getPushNotificationPreferences() {
    return successResponse(
      'Push notification preferences fetched successfully.',
      this.appExtensionsData.getPushNotificationPreferences(),
    );
  }

  @Get('legal-compliance')
  getLegalCompliance() {
    return successResponse(
      'Legal compliance fetched successfully.',
      this.appExtensionsData.getLegalCompliance(),
    );
  }

  @Get('blocked-muted-accounts')
  @ApiQuery({ name: 'actorId', required: false })
  @UseGuards(SessionAuthGuard)
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
    return successResponse('Blocked and muted accounts fetched successfully.', {
      blocked,
      muted: blockedMuted.mutedAccounts,
      blockedAccounts: blocked,
      ...blockedMuted,
    });
  }
}
