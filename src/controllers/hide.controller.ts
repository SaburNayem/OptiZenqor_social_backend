import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';

@ApiTags('hide')
@Controller('hide')
export class HideController {
  constructor(private readonly ecosystemData: EcosystemDataService) {}

  @Get()
  getHiddenItems() {
    return this.ecosystemData.getHiddenItems();
  }

  @Post()
  hideItem(
    @Body()
    body: {
      targetId: string;
      targetType: 'post' | 'reel' | 'story' | 'comment';
    },
  ) {
    return this.ecosystemData.hideItem(body);
  }

  @Delete(':targetId')
  unhideItem(@Param('targetId') targetId: string) {
    return this.ecosystemData.unhideItem(targetId);
  }
}
