import { Controller, Delete, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';

@ApiTags('hidden-posts')
@Controller('hidden-posts')
export class HiddenPostsController {
  constructor(private readonly ecosystemData: EcosystemDataService) {}

  @Get()
  getHiddenPosts() {
    return this.ecosystemData
      .getHiddenItems()
      .filter((item) => item.targetType === 'post');
  }

  @Get(':targetId')
  getHiddenPost(@Param('targetId') targetId: string) {
    return this.ecosystemData.getHiddenItem(targetId);
  }

  @Delete(':targetId')
  unhidePost(@Param('targetId') targetId: string) {
    return this.ecosystemData.unhideItem(targetId);
  }
}
