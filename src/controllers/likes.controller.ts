import { Body, Controller, Get, Headers, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PostReactionDto, UserActorDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { listResponse, successResponse } from '../utils/api-response.util';

@ApiTags('likes')
@Controller('posts')
export class LikesController {
  constructor(private readonly coreDatabase: CoreDatabaseService) {}

  @Get(':id/reactions')
  async getPostReactions(@Param('id') id: string) {
    const reactions = await this.coreDatabase.getPostReactions(id);
    return listResponse('Post reactions fetched successfully.', reactions);
  }

  @Post(':id/reactions')
  async reactToPost(
    @Param('id') id: string,
    @Body() body: PostReactionDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const result = await this.coreDatabase.reactToPost(id, actor.id, body.reaction);
    return successResponse('Post reaction updated successfully.', result);
  }

  @Patch(':id/like')
  async likePost(
    @Param('id') id: string,
    @Body() body: UserActorDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const result = await this.coreDatabase.reactToPost(id, actor.id, 'like');
    return successResponse('Post liked successfully.', result);
  }

  @Patch(':id/unlike')
  async unlikePost(
    @Param('id') id: string,
    @Body() body: UserActorDto,
    @Headers('authorization') authorization?: string,
  ) {
    const actor = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.userId,
    );
    const result = await this.coreDatabase.unlikePost(id, actor.id);
    return successResponse('Post unliked successfully.', result);
  }
}
