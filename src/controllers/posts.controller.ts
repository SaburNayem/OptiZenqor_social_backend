import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(private readonly platformData: PlatformDataService) {}

  @Get()
  getPosts() {
    return this.platformData.getPosts();
  }

  @Get(':id')
  getPost(@Param('id') id: string) {
    return this.platformData.getPost(id);
  }

  @Post()
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

  @Patch(':id')
  updatePost(
    @Param('id') id: string,
    @Body()
    body: {
      caption?: string;
      media?: string[];
      tags?: string[];
      status?: 'Visible' | 'Featured' | 'Under review' | 'Muted reach';
    },
  ) {
    return this.platformData.updatePost(id, body);
  }

  @Delete(':id')
  deletePost(@Param('id') id: string) {
    return this.platformData.deletePost(id);
  }
}
