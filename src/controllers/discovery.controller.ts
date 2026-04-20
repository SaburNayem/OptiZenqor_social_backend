import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';

@ApiTags('discovery')
@Controller()
export class DiscoveryController {
  constructor(private readonly ecosystemData: EcosystemDataService) {}

  @Get('hashtags')
  getHashtags() {
    return this.ecosystemData.getHashtags();
  }

  @Get('trending')
  getTrending() {
    return this.ecosystemData.getTrending();
  }

  @Get('search')
  search(@Query('q') q?: string) {
    return this.ecosystemData.search(q);
  }

  @Get('search-discovery')
  @ApiQuery({ name: 'q', required: false })
  getSearchDiscovery(@Query('q') q?: string) {
    return {
      query: q ?? '',
      results: this.ecosystemData.search(q),
      trending: this.ecosystemData.getTrending(),
      hashtags: this.ecosystemData.getHashtags(),
    };
  }

  @Get('saved-collections')
  getCollections() {
    return this.ecosystemData.getCollections();
  }

  @Get('saved-collections/:id')
  getCollection(@Param('id') id: string) {
    return this.ecosystemData.getCollection(id);
  }

  @Post('saved-collections')
  createCollection(@Body() body: { name: string }) {
    return this.ecosystemData.createCollection(body.name);
  }

  @Patch('saved-collections')
  addItemToCollection(@Body() body: { collectionId: string; itemId: string }) {
    return this.ecosystemData.addItemToCollection(body.collectionId, body.itemId);
  }

  @Patch('saved-collections/:id')
  updateCollection(
    @Param('id') id: string,
    @Body() body: { name?: string; privacy?: string; itemId?: string },
  ) {
    return this.ecosystemData.updateCollection(id, body);
  }

  @Delete('saved-collections/:id')
  deleteCollection(@Param('id') id: string) {
    return this.ecosystemData.deleteCollection(id);
  }
}
