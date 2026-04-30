import { Body, Controller, Get, Headers, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { ArchiveEntityDto, PaginationQueryDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { SocialStateDatabaseService } from '../services/social-state-database.service';

@ApiTags('archive')
@Controller('archive')
@UseGuards(SessionAuthGuard)
export class ArchiveController {
  constructor(
    private readonly socialStateDatabase: SocialStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get('posts')
  async getArchivedPosts(
    @Query() query: PaginationQueryDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const payload = await this.socialStateDatabase.listArchivedEntities(
      user.id,
      'post',
      query,
    );
    return this.wrapListResponse('Archived posts fetched successfully.', payload);
  }

  @Post('posts')
  async archivePost(
    @Body() body: ArchiveEntityDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId?.trim() || body.actorId?.trim(),
    );
    const archived = await this.socialStateDatabase.archiveEntity(
      user.id,
      'post',
      body.targetId,
    );
    return {
      success: true,
      message: 'Post archived successfully.',
      data: archived,
      archived,
    };
  }

  @Get('stories')
  async getArchivedStories(
    @Query() query: PaginationQueryDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const payload = await this.socialStateDatabase.listArchivedEntities(
      user.id,
      'story',
      query,
    );
    return this.wrapListResponse('Archived stories fetched successfully.', payload);
  }

  @Post('stories')
  async archiveStory(
    @Body() body: ArchiveEntityDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId?.trim() || body.actorId?.trim(),
    );
    const archived = await this.socialStateDatabase.archiveEntity(
      user.id,
      'story',
      body.targetId,
    );
    return {
      success: true,
      message: 'Story archived successfully.',
      data: archived,
      archived,
    };
  }

  @Get('reels')
  async getArchivedReels(
    @Query() query: PaginationQueryDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const payload = await this.socialStateDatabase.listArchivedEntities(
      user.id,
      'reel',
      query,
    );
    return this.wrapListResponse('Archived reels fetched successfully.', payload);
  }

  @Post('reels')
  async archiveReel(
    @Body() body: ArchiveEntityDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId?.trim() || body.actorId?.trim(),
    );
    const archived = await this.socialStateDatabase.archiveEntity(
      user.id,
      'reel',
      body.targetId,
    );
    return {
      success: true,
      message: 'Reel archived successfully.',
      data: archived,
      archived,
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
