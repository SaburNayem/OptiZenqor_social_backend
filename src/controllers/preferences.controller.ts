import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { SettingsDatabaseService } from '../services/settings-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('preferences')
@Controller()
export class PreferencesController {
  constructor(
    private readonly settingsDatabase: SettingsDatabaseService,
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get('advanced-privacy-controls')
  @UseGuards(SessionAuthGuard)
  async getAdvancedPrivacyControls(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Advanced privacy controls fetched successfully.',
      await this.settingsDatabase.getAdvancedPrivacyControls(user.id),
    );
  }

  @Get('safety-privacy')
  @UseGuards(SessionAuthGuard)
  async getSafetyPrivacy(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Safety and privacy fetched successfully.',
      await this.settingsDatabase.getSafetyPrivacy(user.id),
    );
  }

  @Get('accessibility-support')
  @UseGuards(SessionAuthGuard)
  async getAccessibilitySupport(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Accessibility support fetched successfully.',
      await this.settingsDatabase.getAccessibilitySupport(user.id),
    );
  }

  @Get('explore-recommendation')
  @UseGuards(SessionAuthGuard)
  async getExploreRecommendations(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Explore recommendations fetched successfully.',
      await this.settingsDatabase.getExploreRecommendations(user.id),
    );
  }

  @Get('push-notification-preferences')
  @UseGuards(SessionAuthGuard)
  async getPushNotificationPreferences(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Push notification preferences fetched successfully.',
      await this.settingsDatabase.getPushNotificationPreferences(user.id),
    );
  }

  @Get('legal-compliance')
  @UseGuards(SessionAuthGuard)
  async getLegalCompliance(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Legal compliance fetched successfully.',
      await this.settingsDatabase.getLegalCompliance(user.id),
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
    return successResponse(
      'Blocked and muted accounts fetched successfully.',
      await this.settingsDatabase.getBlockedMutedAccounts(user.id),
    );
  }
}
