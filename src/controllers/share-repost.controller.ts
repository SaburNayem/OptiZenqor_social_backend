import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { ShareRepostTrackDto } from '../dto/api.dto';

@ApiTags('share-repost')
@Controller('share-repost')
export class ShareRepostController {
  constructor(private readonly appExtensionsData: AppExtensionsDataService) {}

  @Get('options')
  getShareOptions() {
    return this.appExtensionsData.getShareRepostOptions();
  }

  @Post('track')
  trackShareOption(@Body() body: ShareRepostTrackDto) {
    return this.appExtensionsData.trackShareRepost(body.targetId, body.option);
  }
}
