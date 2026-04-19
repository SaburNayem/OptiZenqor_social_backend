import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';

@ApiTags('content')
@Controller()
export class ContentController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get('feed')
  getFeed() {
    return this.platformData.getFeed();
  }

  @Get('posts')
  getPosts() {
    return this.platformData.getPosts();
  }

  @Get('posts/:id')
  getPost(@Param('id') id: string) {
    return this.platformData.getPost(id);
  }

  @Post('posts')
  createPost(
    @Body()
    body: {
      authorId: string;
      caption: string;
      media?: string[];
      tags?: string[];
    },
  ) {
    return this.platformData.createPost({
      authorId: body.authorId,
      caption: body.caption,
      media: body.media ?? [],
      tags: body.tags ?? [],
    });
  }

  @Patch('posts/:id/like')
  likePost(@Param('id') id: string) {
    return this.platformData.toggleLike(id);
  }

  @Get('stories')
  getStories() {
    return this.platformData.getStories();
  }

  @Post('stories')
  createStory(@Body() body: { userId: string; text?: string; media?: string }) {
    return this.platformData.createStory(body);
  }

  @Get('reels')
  getReels() {
    return this.platformData.getReels();
  }

  @Post('reels')
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
}
