import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommunityRecord, EcosystemDataService } from '../data/ecosystem-data.service';
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

  @Post('communities/:id/join')
  async joinCommunity(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const result = await this.ecosystemData.joinCommunity(
      id,
      this.readString(body.userId) ?? this.readString(body.actorId) ?? 'u1',
      this.readString(body.name) ?? this.readString(body.userName) ?? 'Maya Quinn',
    );
    return {
      success: true,
      joined: result.joined,
      memberCount: result.memberCount,
      community: result.community,
      data: {
        joined: result.joined,
        memberCount: result.memberCount,
        community: result.community,
      },
    };
  }

  @Post('communities/:id/leave')
  async leaveCommunity(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const result = await this.ecosystemData.leaveCommunity(
      id,
      this.readString(body.userId) ?? this.readString(body.actorId) ?? 'u1',
    );
    return {
      success: true,
      joined: result.joined,
      memberCount: result.memberCount,
      community: result.community,
      data: {
        joined: result.joined,
        memberCount: result.memberCount,
        community: result.community,
      },
    };
  }

  @Post('communities')
  async createCommunity(@Body() body: Record<string, unknown>) {
    const community = await this.ecosystemData.createCommunity(
      this.normalizeCommunityCreateInput(body),
    );
    return {
      success: true,
      message: 'Community created successfully.',
      community,
      data: community,
    };
  }

  @Patch('communities/:id')
  async updateCommunity(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    const community = await this.ecosystemData.updateCommunity(
      id,
      this.normalizeCommunityPatch(body),
    );
    return {
      success: true,
      message: 'Community updated successfully.',
      community,
      data: community,
    };
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

  private normalizeCommunityPatch(body: Record<string, unknown>) {
    return {
      name: this.readString(body.name),
      description: this.readString(body.description),
      privacy: this.readPrivacy(body.privacy),
      category: this.readString(body.category),
      location: this.readString(body.location),
      tags: this.readStringArray(body.tags),
      rules: this.readStringArray(body.rules),
      links: this.readStringArray(body.links),
      contactInfo: this.readString(body.contactInfo),
      coverColors: this.readNumberArray(body.coverColors),
      avatarColor: this.readNumber(body.avatarColor),
      approvalRequired: this.readBoolean(body.approvalRequired),
      allowEvents: this.readBoolean(body.allowEvents),
      allowLive: this.readBoolean(body.allowLive),
      allowPolls: this.readBoolean(body.allowPolls),
      allowMarketplace: this.readBoolean(body.allowMarketplace),
      allowChatRoom: this.readBoolean(body.allowChatRoom),
      notificationLevel: this.readNotificationLevel(body.notificationLevel),
      ownerId: this.readString(body.ownerId),
      ownerName: this.readString(body.ownerName) ?? this.readString(body.name),
    };
  }

  private normalizeCommunityCreateInput(body: Record<string, unknown>) {
    const patch = this.normalizeCommunityPatch(body);
    return {
      ...patch,
      name: patch.name ?? 'New Community',
      description:
        patch.description ?? 'Community created from the updated mobile flow.',
    };
  }

  private readString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : undefined;
  }

  private readBoolean(value: unknown) {
    return typeof value === 'boolean' ? value : undefined;
  }

  private readNumber(value: unknown) {
    return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
  }

  private readStringArray(value: unknown) {
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      : undefined;
  }

  private readNumberArray(value: unknown) {
    return Array.isArray(value)
      ? value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item))
      : undefined;
  }

  private readPrivacy(value: unknown) {
    return value === 'public' || value === 'private' || value === 'hidden'
      ? (value as CommunityRecord['privacy'])
      : undefined;
  }

  private readNotificationLevel(value: unknown) {
    return value === 'all' || value === 'highlights' || value === 'off'
      ? (value as CommunityRecord['notificationLevel'])
      : undefined;
  }
}
