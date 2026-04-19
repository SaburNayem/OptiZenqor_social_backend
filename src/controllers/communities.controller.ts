import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';

@ApiTags('communities')
@Controller()
export class CommunitiesController {
  constructor(private readonly ecosystemData: EcosystemDataService) {}

  @Get('communities')
  getCommunities() {
    return this.ecosystemData.getCommunities();
  }

  @Get('communities/:id')
  getCommunity(@Param('id') id: string) {
    return this.ecosystemData.getCommunity(id);
  }

  @Get('pages')
  getPages() {
    return this.ecosystemData.getPages();
  }

  @Get('pages/:id')
  getPage(@Param('id') id: string) {
    return this.ecosystemData.getPage(id);
  }

  @Get('groups')
  getGroups() {
    return this.ecosystemData.getCommunities().map((community) => ({
      id: community.id,
      name: community.name,
      description: community.description,
      memberCount: community.memberCount,
      privacy: community.privacy,
    }));
  }
}
