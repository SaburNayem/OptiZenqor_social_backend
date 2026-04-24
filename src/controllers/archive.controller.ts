import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import { PlatformDataService } from '../data/platform-data.service';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('archive')
@Controller('archive')
export class ArchiveController {
  constructor(
    private readonly extendedData: ExtendedDataService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly platformData: PlatformDataService,
  ) {}

  @Get('posts')
  async getArchivedPosts() {
    const items = await Promise.all(
      this.extendedData.getArchivedPostIds().map(async (postId) => {
        const post = await this.coreDatabase.getPost(postId);
        const author = await this.coreDatabase.getUser(post.authorId);
        return {
          ...post,
          author: {
            id: author.id,
            name: author.name,
            username: author.username,
            avatar: author.avatar,
            avatarUrl: author.avatarUrl,
          },
        };
      }),
    );

    return this.wrapListResponse('Archived posts fetched successfully.', items);
  }

  @Get('stories')
  getArchivedStories() {
    const items = this.extendedData
      .getArchivedStoryIds()
      .map((storyId) => this.platformData.getStory(storyId));
    return this.wrapListResponse('Archived stories fetched successfully.', items);
  }

  @Get('reels')
  getArchivedReels() {
    const items = this.extendedData
      .getArchivedReelIds()
      .map((reelId) => this.platformData.getReel(reelId));
    return this.wrapListResponse('Archived reels fetched successfully.', items);
  }

  private wrapListResponse(message: string, items: unknown[]) {
    return {
      success: true,
      message,
      data: items,
      items,
      results: items,
      count: items.length,
    };
  }
}
