import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlatformDataService } from '../data/platform-data.service';
import { AddBookmarkDto } from '../dto/api.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('bookmarks')
@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly platformData: PlatformDataService,
  ) {}

  @Get()
  async getBookmarks(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Bookmarks fetched successfully.',
      await this.accountStateDatabase.getBookmarks(user.id),
    );
  }

  @Get(':id')
  async getBookmark(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Bookmark fetched successfully.',
      await this.accountStateDatabase.getBookmark(user.id, id),
    );
  }

  @Post()
  async addBookmark(
    @Body() body: AddBookmarkDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Bookmark added successfully.',
      await this.accountStateDatabase.addBookmark(user.id, {
        entityId: body.id,
        title: body.title,
        type: body.type,
      }),
    );
  }

  @Post('posts/:postId')
  async addBookmarkFromPost(
    @Param('postId') postId: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    const post = this.platformData.getPost(postId);
    return successResponse(
      'Bookmark added successfully.',
      await this.accountStateDatabase.addBookmark(user.id, {
        entityId: post.id,
        title: post.caption,
        type: 'post',
      }),
    );
  }

  @Delete(':id')
  async removeBookmark(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Bookmark removed successfully.',
      await this.accountStateDatabase.removeBookmark(user.id, id),
    );
  }
}
