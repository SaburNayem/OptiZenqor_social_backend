import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';

@ApiTags('jobs')
@Controller()
export class JobsController {
  constructor(private readonly ecosystemData: EcosystemDataService) {}

  @Get('jobs')
  getJobs() {
    return this.ecosystemData.getJobs();
  }

  @Get('jobs/:id')
  getJob(@Param('id') id: string) {
    return this.ecosystemData.getJob(id);
  }

  @Post('jobs/:id/apply')
  applyForJob(@Param('id') id: string, @Body() body: { applicantName: string }) {
    return this.ecosystemData.applyForJob(id, body.applicantName);
  }

  @Get('professional-profiles')
  getProfessionalProfiles() {
    return this.ecosystemData.getProfessionalProfiles();
  }
}
