import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { HideItemDto } from '../dto/api.dto';

@ApiTags('hide')
@Controller('hide')
export class HideController {
  constructor(private readonly ecosystemData: EcosystemDataService) {}

  @Get()
  getHiddenItems() {
    return this.ecosystemData.getHiddenItems();
  }

  @Get('posts/all')
  getHiddenPosts() {
    return this.ecosystemData
      .getHiddenItems()
      .filter((item) => item.targetType === 'post');
  }

  @Get('/hidden-posts')
  getHiddenPostsAlias() {
    return this.getHiddenPosts();
  }

  @Post()
  hideItem(@Body() body: HideItemDto) {
    return this.ecosystemData.hideItem(body);
  }

  @Post('posts/:postId')
  hidePost(@Param('postId') postId: string) {
    return this.ecosystemData.hideItem({
      targetId: postId,
      targetType: 'post',
    });
  }

  @Delete('posts/:postId')
  unhidePost(@Param('postId') postId: string) {
    return this.ecosystemData.unhideItem(postId);
  }

  @Get('/hidden-posts/:targetId')
  getHiddenPostAlias(@Param('targetId') targetId: string) {
    return this.ecosystemData.getHiddenItem(targetId);
  }

  @Delete('/hidden-posts/:targetId')
  unhidePostAlias(@Param('targetId') targetId: string) {
    return this.ecosystemData.unhideItem(targetId);
  }

  @Get(':targetId')
  getHiddenItem(@Param('targetId') targetId: string) {
    return this.ecosystemData.getHiddenItem(targetId);
  }

  @Delete(':targetId')
  unhideItem(@Param('targetId') targetId: string) {
    return this.ecosystemData.unhideItem(targetId);
  }
}
