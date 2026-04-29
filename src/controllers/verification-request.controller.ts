import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  SubmitVerificationRequestDto,
  ToggleVerificationDocumentDto,
  UpdateVerificationStatusDto,
} from '../dto/api.dto';
import { AppExtensionsDatabaseService } from '../services/app-extensions-database.service';

@ApiTags('verification-request')
@Controller('verification-request')
export class VerificationRequestController {
  constructor(private readonly appExtensionsDatabase: AppExtensionsDatabaseService) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  async getVerificationRequest(@CurrentUser() user: { id: string }) {
    return this.appExtensionsDatabase.getVerificationRequest(user.id);
  }

  @UseGuards(SessionAuthGuard)
  @Get('status')
  async getVerificationRequestStatus(@CurrentUser() user: { id: string }) {
    return this.appExtensionsDatabase.getVerificationRequestStatus(user.id);
  }

  @UseGuards(SessionAuthGuard)
  @Get('documents')
  async getVerificationDocuments(@CurrentUser() user: { id: string }) {
    return this.appExtensionsDatabase.getVerificationDocuments(user.id);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('documents')
  async toggleDocument(
    @Body() body: ToggleVerificationDocumentDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.appExtensionsDatabase.toggleVerificationDocument(
      user.id,
      body.documentName,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Post('submit')
  async submitVerificationRequest(
    @Body() body: SubmitVerificationRequestDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.appExtensionsDatabase.submitVerificationRequest(user.id, body.documents);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('status')
  async updateStatus(
    @Body() body: UpdateVerificationStatusDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.appExtensionsDatabase.updateVerificationStatus(user.id, body.status);
  }
}
