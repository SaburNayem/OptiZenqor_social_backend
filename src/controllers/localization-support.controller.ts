import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { SetLocaleDto } from '../dto/api.dto';

@ApiTags('localization-support')
@Controller('localization-support')
export class LocalizationSupportController {
  constructor(private readonly appExtensionsData: AppExtensionsDataService) {}

  @Get()
  getLocalizationSupport() {
    return this.appExtensionsData.getLocalizationSupport();
  }

  @Patch()
  setLocale(@Body() body: SetLocaleDto) {
    return this.appExtensionsData.setLocale(body.localeCode);
  }
}
