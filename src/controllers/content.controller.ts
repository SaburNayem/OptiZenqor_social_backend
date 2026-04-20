import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';

@ApiTags('feed')
@Controller()
export class ContentController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get('feed')
  getFeed() {
    return this.platformData.getFeed();
  }
}
