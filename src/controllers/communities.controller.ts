import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { CreatePageDto } from '../dto/api.dto';

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

  @Get('pages/create')
  getCreatePageOptions() {
    return {
      categories: [...new Set(this.ecosystemData.getPages().map((page) => page.category))],
      ownerSuggestions: ['u1', 'u2', 'u4', 'u5'],
      locations: ['Dhaka, Bangladesh', 'Remote', 'Global'],
    };
  }

  @Get('pages/detail')
  getPageDetail(@Query('id') id: string) {
    return this.ecosystemData.getPage(id);
  }

  @Get('pages/detail/:id')
  getPageDetailById(@Param('id') id: string) {
    return this.ecosystemData.getPage(id);
  }

  @Post('pages/create')
  createPage(@Body() body: CreatePageDto) {
    return this.ecosystemData.createPage(body);
  }

  @Patch('pages/:id/follow')
  followPage(@Param('id') id: string) {
    return this.ecosystemData.togglePageFollow(id);
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

  @Get('groups/:id')
  getGroup(@Param('id') id: string) {
    return this.ecosystemData.getCommunity(id);
  }

  @Get('groups/:id/posts')
  getGroupPosts(@Param('id') id: string) {
    return this.ecosystemData.getCommunity(id).posts;
  }

  @Get('groups/:id/members')
  getGroupMembers(@Param('id') id: string) {
    return this.ecosystemData.getCommunity(id).members;
  }
}
