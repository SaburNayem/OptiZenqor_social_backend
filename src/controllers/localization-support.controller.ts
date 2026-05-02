import { Body, Controller, Get, Headers, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SetLocaleDto } from '../dto/api.dto';
import { AppUtilityDatabaseService } from '../services/app-utility-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('localization-support')
@Controller('localization-support')
export class LocalizationSupportController {
  constructor(private readonly appUtilityDatabase: AppUtilityDatabaseService) {}

  @Get()
  async getLocalizationSupport(@Headers('authorization') authorization?: string) {
    return successResponse(
      'Localization support fetched successfully.',
      await this.appUtilityDatabase.getLocalizationSupport(authorization),
    );
  }

  @Patch()
  async setLocale(
    @Body() body: SetLocaleDto,
    @Headers('authorization') authorization?: string,
  ) {
    return successResponse(
      'Locale updated successfully.',
      await this.appUtilityDatabase.setLocale(body.localeCode, authorization),
    );
  }
}
