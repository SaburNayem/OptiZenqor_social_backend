import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ResolveDeepLinkDto } from '../dto/api.dto';
import { AppUtilityDatabaseService } from '../services/app-utility-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('deep-link-handler')
@Controller('deep-link-handler')
export class DeepLinkHandlerController {
  constructor(private readonly appUtilityDatabase: AppUtilityDatabaseService) {}

  @Get()
  async getDeepLinkState() {
    return successResponse(
      'Deep link handler state fetched successfully.',
      await this.appUtilityDatabase.getDeepLinkHandler(),
    );
  }

  @Post('resolve')
  async resolveLink(@Body() body: ResolveDeepLinkDto) {
    return successResponse(
      'Deep link resolved successfully.',
      await this.appUtilityDatabase.resolveDeepLink(body.url),
    );
  }
}
