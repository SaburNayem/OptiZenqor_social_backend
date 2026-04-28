import { Body, Controller, Get, Headers, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { SettingsDataService } from '../data/settings-data.service';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('settings')
@Controller('settings')
@UseGuards(SessionAuthGuard)
export class SettingsController {
  constructor(
    private readonly settingsData: SettingsDataService,
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get()
  getSettingsSections() {
    return successResponse('Settings sections fetched successfully.', this.settingsData.getSections());
  }

  @Get('sections')
  getSettingsSectionsAlias() {
    return successResponse('Settings sections fetched successfully.', this.settingsData.getSections());
  }

  @Get('items')
  getSettingsItems() {
    return successResponse('Settings items fetched successfully.', this.settingsData.getItems());
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
  getSettingsItem(@Param('itemKey') itemKey: string) {
    return successResponse(
      'Settings item fetched successfully.',
      this.settingsData.getItem(itemKey),
    );
  }

  @Get(':sectionKey')
  getSettingsSection(@Param('sectionKey') sectionKey: string) {
    return successResponse(
      'Settings section fetched successfully.',
      this.settingsData.getRouteEntry(`/settings/${sectionKey}`),
    );
  }

  @Patch('items/:itemKey')
  updateSettingsItem(
    @Param('itemKey') itemKey: string,
    @Body() body: Record<string, unknown>,
  ) {
    return successResponse(
      'Settings item updated successfully.',
      this.settingsData.updateItem(itemKey, body),
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
  updateSettingsSection(
    @Param('sectionKey') sectionKey: string,
    @Body() body: Record<string, unknown>,
  ) {
    return successResponse(
      'Settings section updated successfully.',
      this.settingsData.updateRouteEntry(`/settings/${sectionKey}`, body),
    );
  }
}
