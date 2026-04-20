import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';

@ApiTags('reels')
@Controller('reels')
export class ReelsController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get()
  getReels() {
    return this.platformData.getReels();
  }

  @Post()
  createReel(
    @Body()
    body: {
      authorId: string;
      caption: string;
      audioName: string;
      thumbnail: string;
      videoUrl: string;
    },
  ) {
    return this.platformData.createReel(body);
  }

  @Delete(':id')
  deleteReel(@Param('id') id: string) {
    return this.platformData.deleteReel(id);
  }
}
