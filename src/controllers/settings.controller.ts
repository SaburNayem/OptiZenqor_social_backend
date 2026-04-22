import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SettingsDataService } from '../data/settings-data.service';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsData: SettingsDataService) {}

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
  getSettingsState() {
    return this.settingsData.getState();
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
  updateSettingsState(@Body() body: Record<string, unknown>) {
    return this.settingsData.updateState(body);
  }

  @Patch(':sectionKey')
  updateSettingsSection(
    @Param('sectionKey') sectionKey: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.settingsData.updateRouteEntry(`/settings/${sectionKey}`, body);
  }
}
