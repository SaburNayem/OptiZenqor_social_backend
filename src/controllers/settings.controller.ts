import { Body, Controller, Get, Headers, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { SettingsDatabaseService } from '../services/settings-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('settings')
@Controller('settings')
@UseGuards(SessionAuthGuard)
export class SettingsController {
  constructor(
    private readonly settingsDatabase: SettingsDatabaseService,
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get()
  async getSettingsSections(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Settings sections fetched successfully.',
      await this.settingsDatabase.getSections(user.id),
    );
  }

  @Get('sections')
  async getSettingsSectionsAlias(@Headers('authorization') authorization?: string) {
    return this.getSettingsSections(authorization);
  }

  @Get('items')
  async getSettingsItems(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Settings items fetched successfully.',
      await this.settingsDatabase.getItems(user.id),
    );
  }

  @Get('state')
  async getSettingsState(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Settings state fetched successfully.',
      await this.accountStateDatabase.getSettingsState(user.id),
    );
  }

  @Get('items/:itemKey')
  async getSettingsItem(
    @Param('itemKey') itemKey: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Settings item fetched successfully.',
      await this.settingsDatabase.getItem(user.id, itemKey),
    );
  }

  @Get(':sectionKey')
  async getSettingsSection(
    @Param('sectionKey') sectionKey: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Settings section fetched successfully.',
      await this.settingsDatabase.getRouteEntry(user.id, `/settings/${sectionKey}`),
    );
  }

  @Patch('items/:itemKey')
  async updateSettingsItem(
    @Param('itemKey') itemKey: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Settings item updated successfully.',
      await this.settingsDatabase.updateItem(user.id, itemKey, body),
    );
  }

  @Patch('state')
  async updateSettingsState(
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Settings state updated successfully.',
      await this.accountStateDatabase.updateSettingsState(user.id, body),
    );
  }

  @Patch(':sectionKey')
  async updateSettingsSection(
    @Param('sectionKey') sectionKey: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Settings section updated successfully.',
      await this.settingsDatabase.updateRouteEntry(
        user.id,
        `/settings/${sectionKey}`,
        body,
      ),
    );
  }
}
