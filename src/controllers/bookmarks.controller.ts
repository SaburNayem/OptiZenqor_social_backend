import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import { AddBookmarkDto } from '../dto/api.dto';

@ApiTags('bookmarks')
@Controller('bookmarks')
export class BookmarksController {
  constructor(
    private readonly ecosystemData: EcosystemDataService,
    private readonly platformData: PlatformDataService,
  ) {}

  @Get()
  getBookmarks() {
    return this.ecosystemData.getBookmarks();
  }

  @Get(':id')
  getBookmark(@Param('id') id: string) {
    return this.ecosystemData.getBookmark(id);
  }

  @Post()
  addBookmark(@Body() body: AddBookmarkDto) {
    return this.ecosystemData.addBookmark(body);
  }

  @Post('posts/:postId')
  addBookmarkFromPost(@Param('postId') postId: string) {
    const post = this.platformData.getPost(postId);
    return this.ecosystemData.addBookmark({
      id: post.id,
      title: post.caption,
      type: 'post',
    });
  }

  @Delete(':id')
  removeBookmark(@Param('id') id: string) {
    return this.ecosystemData.removeBookmark(id);
  }
}
