import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';

@ApiTags('bookmarks')
@Controller('bookmarks')
export class BookmarksController {
  constructor(private readonly ecosystemData: EcosystemDataService) {}

  @Get()
  getBookmarks() {
    return this.ecosystemData.getBookmarks();
  }

  @Post()
  addBookmark(
    @Body()
    body: {
      id: string;
      title: string;
      type: 'post' | 'reel' | 'product';
    },
  ) {
    return this.ecosystemData.addBookmark(body);
  }

  @Delete(':id')
  removeBookmark(@Param('id') id: string) {
    return this.ecosystemData.removeBookmark(id);
  }
}
