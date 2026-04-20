import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import {
  ToggleVerificationDocumentDto,
  UpdateVerificationStatusDto,
} from '../dto/api.dto';

@ApiTags('verification-request')
@Controller('verification-request')
export class VerificationRequestController {
  constructor(private readonly appExtensionsData: AppExtensionsDataService) {}

  @Get()
  getVerificationRequest() {
    return this.appExtensionsData.getVerificationRequest();
  }

  @Patch('documents')
  toggleDocument(@Body() body: ToggleVerificationDocumentDto) {
    return this.appExtensionsData.toggleVerificationDocument(body.documentName);
  }

  @Post('submit')
  submitVerificationRequest() {
    return this.appExtensionsData.submitVerificationRequest();
  }

  @Patch('status')
  updateStatus(@Body() body: UpdateVerificationStatusDto) {
    return this.appExtensionsData.updateVerificationStatus(body.status);
  }
}
