import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import { CreateDraftDto, UpdateUploadDto } from '../dto/api.dto';

@ApiTags('creator-flow')
@Controller()
export class CreatorFlowController {
  constructor(private readonly extendedData: ExtendedDataService) {}

  @Get('drafts')
  getDrafts() {
    return this.extendedData.getDrafts();
  }

  @Get('drafts/:id')
  getDraft(@Param('id') id: string) {
    return this.extendedData.getDraft(id);
  }

  @Post('drafts')
  createDraft(@Body() body: CreateDraftDto) {
    return this.extendedData.createDraft(body.title, body.type);
  }

  @Patch('drafts/:id')
  updateDraft(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return this.extendedData.updateDraft(id, body);
  }

  @Delete('drafts/:id')
  deleteDraft(@Param('id') id: string) {
    return this.extendedData.deleteDraft(id);
  }

  @Get('scheduling')
  getScheduling() {
    return this.extendedData.getScheduledPosts();
  }

  @Get('upload-manager')
  getUploads() {
    return this.extendedData.getUploads();
  }

  @Get('upload-manager/:id')
  getUpload(@Param('id') id: string) {
    return this.extendedData.getUpload(id);
  }

  @Patch('upload-manager/:id')
  updateUpload(@Param('id') id: string, @Body() body: UpdateUploadDto) {
    return this.extendedData.updateUpload(id, body.action);
  }
}
