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

  @Get(':sectionKey')
  getSettingsSection(@Param('sectionKey') sectionKey: string) {
    return this.settingsData.getSection(sectionKey);
  }

  @Patch(':sectionKey')
  updateSettingsSection(
    @Param('sectionKey') sectionKey: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.settingsData.updateSection(sectionKey, body);
  }
}
