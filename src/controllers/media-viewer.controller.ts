import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppUtilityDatabaseService } from '../services/app-utility-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('media-viewer')
@Controller('media-viewer')
export class MediaViewerController {
  constructor(private readonly appUtilityDatabase: AppUtilityDatabaseService) {}

  @Get()
  async getMediaViewerItems() {
    return successResponse(
      'Media viewer items fetched successfully.',
      await this.appUtilityDatabase.getMediaViewerItems(),
    );
  }

  @Get(':id')
  async getMediaViewerItem(@Param('id') id: string) {
    return successResponse(
      'Media viewer item fetched successfully.',
      await this.appUtilityDatabase.getMediaViewerItem(id),
    );
  }
}
