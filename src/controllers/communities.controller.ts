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

  @Get('communities/:id/posts')
  getCommunityPosts(@Param('id') id: string) {
    return this.ecosystemData.getCommunity(id).posts;
  }

  @Get('communities/:id/members')
  getCommunityMembers(@Param('id') id: string) {
    return this.ecosystemData.getCommunity(id).members;
  }

  @Get('communities/:id/events')
  getCommunityEvents(@Param('id') id: string) {
    return this.ecosystemData.getCommunity(id).events;
  }

  @Get('communities/:id/pinned-posts')
  getCommunityPinnedPosts(@Param('id') id: string) {
    return this.ecosystemData.getCommunity(id).pinnedPosts;
  }

  @Get('communities/:id/trending-posts')
  getCommunityTrendingPosts(@Param('id') id: string) {
    return this.ecosystemData.getCommunity(id).trendingPosts;
  }

  @Get('communities/:id/announcements')
  getCommunityAnnouncements(@Param('id') id: string) {
    return this.ecosystemData.getCommunity(id).announcements;
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
