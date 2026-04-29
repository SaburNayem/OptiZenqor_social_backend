import { Body, Controller, Get, Headers, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  SubmitVerificationRequestDto,
  ToggleVerificationDocumentDto,
  UpdateVerificationStatusDto,
} from '../dto/api.dto';
import { AppExtensionsDatabaseService } from '../services/app-extensions-database.service';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('verification-request')
@Controller('verification-request')
export class VerificationRequestController {
  constructor(
    private readonly appExtensionsDatabase: AppExtensionsDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  async getVerificationRequest(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.appExtensionsDatabase.getVerificationRequest(user.id);
  }

  @UseGuards(SessionAuthGuard)
  @Get('status')
  async getVerificationRequestStatus(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.appExtensionsDatabase.getVerificationRequestStatus(user.id);
  }

  @UseGuards(SessionAuthGuard)
  @Get('documents')
  async getVerificationDocuments(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.appExtensionsDatabase.getVerificationDocuments(user.id);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('documents')
  async toggleDocument(
    @Body() body: ToggleVerificationDocumentDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.appExtensionsDatabase.toggleVerificationDocument(
      user.id,
      body.documentName,
    );
  }

  @UseGuards(SessionAuthGuard)
  @Post('submit')
  async submitVerificationRequest(
    @Body() body: SubmitVerificationRequestDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.appExtensionsDatabase.submitVerificationRequest(user.id, body.documents);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('status')
  async updateStatus(
    @Body() body: UpdateVerificationStatusDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.appExtensionsDatabase.updateVerificationStatus(user.id, body.status);
  }
}
