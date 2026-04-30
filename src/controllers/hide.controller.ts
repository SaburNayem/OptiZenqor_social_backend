import { Body, Controller, Delete, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { HideItemDto, PaginationQueryDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { SocialStateDatabaseService } from '../services/social-state-database.service';

@ApiTags('hide')
@Controller('hide')
@UseGuards(SessionAuthGuard)
export class HideController {
  constructor(
    private readonly socialStateDatabase: SocialStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get()
  async getHiddenItems(
    @Query() query: PaginationQueryDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const payload = await this.socialStateDatabase.listHiddenEntities(
      user.id,
      undefined,
      query,
    );
    return this.wrapListResponse('Hidden items fetched successfully.', payload);
  }

  @Get('posts/all')
  async getHiddenPosts(
    @Query() query: PaginationQueryDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const payload = await this.socialStateDatabase.listHiddenEntities(
      user.id,
      'post',
      query,
    );
    return this.wrapListResponse('Hidden posts fetched successfully.', payload);
  }

  @Get('/hidden-posts')
  async getHiddenPostsAlias(
    @Query() query: PaginationQueryDto,
    @Headers('authorization') authorization?: string,
  ) {
    return this.getHiddenPosts(query, authorization);
  }

  @Post()
  async hideItem(
    @Body() body: HideItemDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const hidden = await this.socialStateDatabase.hideEntity(
      user.id,
      body.targetType,
      body.targetId,
      body.reason,
    );
    return {
      success: true,
      message: 'Item hidden successfully.',
      data: hidden,
      hidden,
    };
  }

  @Post('posts/:postId')
  async hidePost(
    @Param('postId') postId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const hidden = await this.socialStateDatabase.hideEntity(
      user.id,
      'post',
      postId,
    );
    return {
      success: true,
      message: 'Post hidden successfully.',
      data: hidden,
      hidden,
    };
  }

  @Delete('posts/:postId')
  async unhidePost(
    @Param('postId') postId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const hidden = await this.socialStateDatabase.unhideEntity(user.id, postId, 'post');
    return {
      success: true,
      message: 'Post unhidden successfully.',
      data: hidden,
      hidden,
    };
  }

  @Get('/hidden-posts/:targetId')
  async getHiddenPostAlias(
    @Param('targetId') targetId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const hidden = await this.socialStateDatabase.getHiddenEntity(
      user.id,
      targetId,
      'post',
    );
    return {
      success: true,
      message: 'Hidden post fetched successfully.',
      data: hidden,
      hidden,
    };
  }

  @Delete('/hidden-posts/:targetId')
  async unhidePostAlias(
    @Param('targetId') targetId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const hidden = await this.socialStateDatabase.unhideEntity(user.id, targetId, 'post');
    return {
      success: true,
      message: 'Hidden post removed successfully.',
      data: hidden,
      hidden,
    };
  }

  @Get(':targetId')
  async getHiddenItem(
    @Param('targetId') targetId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const hidden = await this.socialStateDatabase.getHiddenEntity(user.id, targetId);
    return {
      success: true,
      message: 'Hidden item fetched successfully.',
      data: hidden,
      hidden,
    };
  }

  @Delete(':targetId')
  async unhideItem(
    @Param('targetId') targetId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const hidden = await this.socialStateDatabase.unhideEntity(user.id, targetId);
    return {
      success: true,
      message: 'Item unhidden successfully.',
      data: hidden,
      hidden,
    };
  }

  private wrapListResponse(message: string, payload: Record<string, unknown>) {
    return {
      success: true,
      message,
      ...payload,
    };
  }
}
