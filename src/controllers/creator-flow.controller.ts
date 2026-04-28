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
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDraftDto, UpdateUploadDto } from '../dto/api.dto';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { UploadsDatabaseService } from '../services/uploads-database.service';

@ApiTags('creator-flow')
@Controller()
@UseGuards(JwtAuthGuard)
export class CreatorFlowController {
  constructor(
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
    private readonly uploadsDatabase: UploadsDatabaseService,
  ) {}

  @Get('drafts')
  async getDrafts(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.accountStateDatabase.getDrafts(user.id);
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
    return this.accountStateDatabase.getDraft(user.id, id);
  }

  @Post('drafts')
  async createDraft(
    @Body() body: CreateDraftDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.accountStateDatabase.createDraft(user.id, {
      title: body.title,
      type: body.type,
    });
  }

  @Patch('drafts/:id')
  async updateDraft(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.accountStateDatabase.updateDraft(user.id, id, body);
  }

  @Delete('drafts/:id')
  async deleteDraft(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.accountStateDatabase.deleteDraft(user.id, id);
  }

  @Get('scheduling')
  async getScheduling(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.accountStateDatabase.getScheduledDrafts(user.id);
  }

  @Get('posts/scheduled')
  async getSchedulingViaPostAlias(@Headers('authorization') authorization?: string) {
    return this.getScheduling(authorization);
  }

  @Get('drafts-scheduling')
  async getDraftsScheduling(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      drafts: await this.accountStateDatabase.getDrafts(user.id),
      scheduled: await this.accountStateDatabase.getScheduledDrafts(user.id),
      uploads: await this.uploadsDatabase.getUploads(user.id),
    };
  }

  @Get('upload-manager')
  getUploads() {
    return this.uploadsDatabase.getUploads();
  }

  @Get('upload-manager/:id')
  getUpload(@Param('id') id: string) {
    return this.uploadsDatabase.getUpload(id);
  }

  @Patch('upload-manager/:id')
  updateUpload(@Param('id') id: string, @Body() body: UpdateUploadDto) {
    return this.uploadsDatabase.updateUploadStatus(id, body.action);
  }
}
