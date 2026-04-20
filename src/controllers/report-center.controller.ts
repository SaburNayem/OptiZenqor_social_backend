import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { SubmitReportDto } from '../dto/api.dto';

@ApiTags('report-center')
@Controller('report-center')
export class ReportCenterController {
  constructor(private readonly appExtensionsData: AppExtensionsDataService) {}

  @Get()
  getReportCenter() {
    return this.appExtensionsData.getReportCenter();
  }

  @Post()
  submitReport(@Body() body: SubmitReportDto) {
    return this.appExtensionsData.submitReport(body.reason);
  }
}
