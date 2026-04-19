import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';

@ApiTags('creator-flow')
@Controller()
export class CreatorFlowController {
  constructor(private readonly extendedData: ExtendedDataService) {}

  @Get('drafts')
  getDrafts() {
    return this.extendedData.getDrafts();
  }

  @Post('drafts')
  createDraft(@Body() body: { title: string; type: string }) {
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

  @Patch('upload-manager/:id')
  updateUpload(@Param('id') id: string, @Body() body: { action: 'retry' | 'cancel' | 'pause' }) {
    return this.extendedData.updateUpload(id, body.action);
  }
}
