import { Controller, Delete, Get, Headers, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { PaginationQueryDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { SocialStateDatabaseService } from '../services/social-state-database.service';

@ApiTags('hidden-posts')
@Controller('hidden-posts')
@UseGuards(SessionAuthGuard)
export class HiddenPostsController {
  constructor(
    private readonly socialStateDatabase: SocialStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get()
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
    return {
      success: true,
      message: 'Hidden posts fetched successfully.',
      ...payload,
      hiddenPosts: payload.items,
    };
  }

  @Get(':targetId')
  async getHiddenPost(
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

  @Delete(':targetId')
  async unhidePost(
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
}
