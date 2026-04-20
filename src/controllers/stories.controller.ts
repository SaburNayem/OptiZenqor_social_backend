import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';

@ApiTags('stories')
@Controller('stories')
export class StoriesController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get()
  getStories() {
    return this.platformData.getStories();
  }

  @Post()
  createStory(@Body() body: { userId: string; text?: string; media?: string }) {
    return this.platformData.createStory(body);
  }

  @Delete(':id')
  deleteStory(@Param('id') id: string) {
    return this.platformData.deleteStory(id);
  }
}
