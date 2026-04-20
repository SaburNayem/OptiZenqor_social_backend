import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';

@ApiTags('media-viewer')
@Controller('media-viewer')
export class MediaViewerController {
  constructor(private readonly appExtensionsData: AppExtensionsDataService) {}

  @Get()
  getMediaViewerItems() {
    return this.appExtensionsData.getMediaViewerItems();
  }

  @Get(':id')
  getMediaViewerItem(@Param('id') id: string) {
    return this.appExtensionsData.getMediaViewerItem(id);
  }
}
