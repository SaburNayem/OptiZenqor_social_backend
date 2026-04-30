import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CommunityRecord } from '../data/ecosystem-data.service';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CommunitiesQueryDto, CreatePageDto, PagesQueryDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { ExperienceDatabaseService } from '../services/experience-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('communities')
@Controller()
export class CommunitiesController {
  constructor(
    private readonly experienceDatabase: ExperienceDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get('communities')
  async getCommunities(@Query() query: CommunitiesQueryDto) {
    const payload = await this.experienceDatabase.getCommunities(query);
    return {
      ...successResponse('Communities fetched successfully.', payload, payload.pagination),
      items: payload.items,
      results: payload.results,
      communities: payload.communities,
    };
  }

  @Get('communities/:id')
  getCommunity(@Param('id') id: string) {
    return this.experienceDatabase.getCommunity(id);
  }

  @Get('communities/:id/posts')
  async getCommunityPosts(@Param('id') id: string) {
    const community = await this.experienceDatabase.getCommunity(id);
    return community.posts;
  }

  @Get('communities/:id/members')
  async getCommunityMembers(@Param('id') id: string) {
    const community = await this.experienceDatabase.getCommunity(id);
    return community.members;
  }

  @Get('communities/:id/events')
  async getCommunityEvents(@Param('id') id: string) {
    const community = await this.experienceDatabase.getCommunity(id);
    return community.events;
  }

  @Get('communities/:id/pinned-posts')
  async getCommunityPinnedPosts(@Param('id') id: string) {
    const community = await this.experienceDatabase.getCommunity(id);
    return community.pinnedPosts;
  }

  @Get('communities/:id/trending-posts')
  async getCommunityTrendingPosts(@Param('id') id: string) {
    const community = await this.experienceDatabase.getCommunity(id);
    return community.trendingPosts;
  }

  @Get('communities/:id/announcements')
  async getCommunityAnnouncements(@Param('id') id: string) {
    const community = await this.experienceDatabase.getCommunity(id);
    return community.announcements;
  }

  @UseGuards(SessionAuthGuard)
  @Post('communities/:id/join')
  async joinCommunity(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      this.readString(body.userId) ?? this.readString(body.actorId),
    );
    const result = await this.experienceDatabase.joinCommunity(id, actor.id);
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

  @UseGuards(SessionAuthGuard)
  @Post('communities/:id/leave')
  async leaveCommunity(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      this.readString(body.userId) ?? this.readString(body.actorId),
    );
    const result = await this.experienceDatabase.leaveCommunity(id, actor.id);
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

  @UseGuards(SessionAuthGuard)
  @Post('communities')
  async createCommunity(
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const owner = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      this.readString(body.ownerId),
    );
    const community = await this.experienceDatabase.createCommunity({
      ...this.normalizeCommunityCreateInput(body),
      ownerId: owner.id,
    });
    return {
      success: true,
      message: 'Community created successfully.',
      community,
      data: community,
    };
  }

  @UseGuards(SessionAuthGuard)
  @Patch('communities/:id')
  async updateCommunity(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      this.readString(body.ownerId) ?? this.readString(body.userId),
    );
    const existing = await this.experienceDatabase.getCommunity(id);
    if (existing.ownerId !== actor.id) {
      throw new ForbiddenException('Only the community owner can update this community.');
    }
    const community = await this.experienceDatabase.updateCommunity(
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
  async getPages(@Query() query: PagesQueryDto) {
    const payload = await this.experienceDatabase.getPages(query);
    return {
      ...successResponse('Pages fetched successfully.', payload, payload.pagination),
      items: payload.items,
      results: payload.results,
      pages: payload.pages,
    };
  }

  @Get('pages/create')
  async getCreatePageOptions() {
    const payload = await this.experienceDatabase.getPages();
    const pages = payload.pages;
    return {
      success: true,
      message: 'Page creation options fetched successfully.',
      requiredProfileType: 'creator',
      categories: [
        ...new Set(
          pages.map(
            (page: { category: string }) => page.category,
          ),
        ),
      ],
      ownerSuggestions: ['u1', 'u2', 'u4', 'u5'],
      locations: ['Dhaka, Bangladesh', 'Remote', 'Global'],
      data: {
        requiredProfileType: 'creator',
        categories: [...new Set(pages.map((page: { category: string }) => page.category))],
        ownerSuggestions: ['u1', 'u2', 'u4', 'u5'],
        locations: ['Dhaka, Bangladesh', 'Remote', 'Global'],
      },
    };
  }

  @Get('pages/detail')
  getPageDetail(@Query('id') id: string) {
    return this.experienceDatabase.getPage(id);
  }

  @Get('pages/detail/:id')
  getPageDetailById(@Param('id') id: string) {
    return this.experienceDatabase.getPage(id);
  }

  @UseGuards(SessionAuthGuard)
  @Post('pages/create')
  async createPage(
    @Body() body: CreatePageDto,
    @Headers('authorization') authorization?: string,
  ) {
    const owner = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.ownerId,
    );
    this.coreDatabase.assertUserCanCreatePages(owner);
    return successResponse(
      'Page created successfully.',
      await this.experienceDatabase.createPage({
        ...body,
        ownerId: owner.id,
      }),
    );
  }

  @UseGuards(SessionAuthGuard)
  @Patch('pages/:id/follow')
  async followPage(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      this.readString(body.userId),
    );
    return this.experienceDatabase.togglePageFollow(id, user.id);
  }

  @Get('pages/:id')
  getPage(@Param('id') id: string) {
    return this.experienceDatabase.getPage(id);
  }

  @Get('groups')
  async getGroups() {
    const communities = (await this.experienceDatabase.getCommunities()).communities;
    const groups = communities.map((community) => ({
      id: community.id,
      name: community.name,
      description: community.description,
      memberCount: community.memberCount,
      privacy: community.privacy,
    }));
    return successResponse('Groups fetched successfully.', {
      items: groups,
      results: groups,
      groups,
    });
  }

  @Get('groups/:id')
  getGroup(@Param('id') id: string) {
    return this.experienceDatabase.getCommunity(id);
  }

  @Get('groups/:id/posts')
  async getGroupPosts(@Param('id') id: string) {
    const community = await this.experienceDatabase.getCommunity(id);
    return community.posts;
  }

  @Get('groups/:id/members')
  async getGroupMembers(@Param('id') id: string) {
    const community = await this.experienceDatabase.getCommunity(id);
    return community.members;
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
