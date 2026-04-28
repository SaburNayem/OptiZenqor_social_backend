import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CreateDraftDto, UpdateUploadDto } from '../dto/api.dto';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { UploadsDatabaseService } from '../services/uploads-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('creator-flow')
@Controller()
@UseGuards(SessionAuthGuard)
export class CreatorFlowController {
  constructor(
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly uploadsDatabase: UploadsDatabaseService,
  ) {}

  @Get('drafts')
  async getDrafts(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Drafts fetched successfully.',
      await this.accountStateDatabase.getDrafts(user.id),
    );
  }

  @Get('posts/drafts')
  async getDraftsViaPostAlias(@Headers('authorization') authorization?: string) {
    return this.getDrafts(authorization);
  }

  @Get('drafts/:id')
  async getDraft(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Draft fetched successfully.',
      await this.accountStateDatabase.getDraft(user.id, id),
    );
  }

  @Post('drafts')
  async createDraft(
    @Body() body: CreateDraftDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Draft created successfully.',
      await this.accountStateDatabase.createDraft(user.id, {
        title: body.title,
        type: body.type,
      }),
    );
  }

  @Patch('drafts/:id')
  async updateDraft(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Draft updated successfully.',
      await this.accountStateDatabase.updateDraft(user.id, id, body),
    );
  }

  @Delete('drafts/:id')
  async deleteDraft(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Draft deleted successfully.',
      await this.accountStateDatabase.deleteDraft(user.id, id),
    );
  }

  @Get('scheduling')
  async getScheduling(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Scheduled drafts fetched successfully.',
      await this.accountStateDatabase.getScheduledDrafts(user.id),
    );
  }

  @Get('posts/scheduled')
  async getSchedulingViaPostAlias(@Headers('authorization') authorization?: string) {
    return this.getScheduling(authorization);
  }

  @Get('drafts-scheduling')
  async getDraftsScheduling(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse('Draft and scheduling state fetched successfully.', {
      drafts: await this.accountStateDatabase.getDrafts(user.id),
      scheduled: await this.accountStateDatabase.getScheduledDrafts(user.id),
      uploads: await this.uploadsDatabase.getUploads(user.id),
    });
  }

  @Get('upload-manager')
  async getUploads(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Uploads fetched successfully.',
      await this.uploadsDatabase.getUploads(user.id),
    );
  }

  @Get('upload-manager/:id')
  async getUpload(@Param('id') id: string) {
    return successResponse(
      'Upload fetched successfully.',
      await this.uploadsDatabase.getUpload(id),
    );
  }

  @Patch('upload-manager/:id')
  async updateUpload(@Param('id') id: string, @Body() body: UpdateUploadDto) {
    return successResponse(
      'Upload updated successfully.',
      await this.uploadsDatabase.updateUploadStatus(id, body.action),
    );
  }
}
