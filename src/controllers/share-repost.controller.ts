import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ShareRepostTrackDto } from '../dto/api.dto';
import { AppUtilityDatabaseService } from '../services/app-utility-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('share-repost')
@Controller('share-repost')
export class ShareRepostController {
  constructor(private readonly appUtilityDatabase: AppUtilityDatabaseService) {}

  @Get('options')
  async getShareOptions() {
    return successResponse(
      'Share and repost options fetched successfully.',
      await this.appUtilityDatabase.getShareRepostOptions(),
    );
  }

  @Post('track')
  async trackShareOption(@Body() body: ShareRepostTrackDto) {
    return successResponse(
      'Share and repost action tracked successfully.',
      await this.appUtilityDatabase.trackShareRepost(body.targetId, body.option),
    );
  }
}
