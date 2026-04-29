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
import { AddBookmarkDto } from '../dto/api.dto';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('bookmarks')
@Controller('bookmarks')
@UseGuards(SessionAuthGuard)
export class BookmarksController {
  constructor(
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
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
    @Body() body: AddBookmarkDto & {
      items?: Array<{
        id: string;
        title?: string;
        type?: 'post' | 'reel' | 'product';
      }>;
    },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);

    if (Array.isArray(body.items) && body.items.length > 0) {
      const bookmarks = await Promise.all(
        body.items
          .filter((item) => item?.id?.trim())
          .map((item) =>
            this.accountStateDatabase.addBookmark(user.id, {
              entityId: item.id,
              title: item.title,
              type: item.type,
            }),
          ),
      );
      return successResponse('Bookmarks synced successfully.', bookmarks);
    }

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
    const post = await this.coreDatabase.getPost(postId);
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
