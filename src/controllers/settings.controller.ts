import { Body, Controller, Get, Headers, Param, Patch, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SettingsDataService } from '../data/settings-data.service';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('settings')
@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(
    private readonly settingsData: SettingsDataService,
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get()
  getSettingsSections() {
    return this.settingsData.getSections();
  }

  @Get('sections')
  getSettingsSectionsAlias() {
    return this.settingsData.getSections();
  }

  @Get('items')
  getSettingsItems() {
    return this.settingsData.getItems();
  }

  @Get('state')
  async getSettingsState(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.accountStateDatabase.getSettingsState(user.id);
  }

  @Get('items/:itemKey')
  getSettingsItem(@Param('itemKey') itemKey: string) {
    return this.settingsData.getItem(itemKey);
  }

  @Get(':sectionKey')
  getSettingsSection(@Param('sectionKey') sectionKey: string) {
    return this.settingsData.getRouteEntry(`/settings/${sectionKey}`);
  }

  @Patch('items/:itemKey')
  updateSettingsItem(
    @Param('itemKey') itemKey: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.settingsData.updateItem(itemKey, body);
  }

  @Patch('state')
  async updateSettingsState(
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.accountStateDatabase.updateSettingsState(user.id, body);
  }

  @Patch(':sectionKey')
  updateSettingsSection(
    @Param('sectionKey') sectionKey: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.settingsData.updateRouteEntry(`/settings/${sectionKey}`, body);
  }
}
