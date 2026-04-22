import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';
import { CreateJobDto } from '../dto/api.dto';

@ApiTags('jobs')
@Controller()
export class JobsController {
  constructor(private readonly ecosystemData: EcosystemDataService) {}

  @Get('jobs')
  getJobs() {
    return this.ecosystemData.getJobs();
  }

  @Get('jobs-networking')
  getJobsNetworking() {
    return this.ecosystemData.getJobsNetworkingOverview();
  }

  @Get('jobs/create')
  getJobCreateOptions() {
    const jobs = this.ecosystemData.getJobs();
    return {
      typeOptions: [...new Set(jobs.map((job) => job.type))],
      experienceLevels: [...new Set(jobs.map((job) => job.experienceLevel))],
      suggestedCompanies: this.ecosystemData.getCompanies(),
    };
  }

  @Get('jobs/detail')
  getJobDetail(@Query('id') id: string) {
    return this.ecosystemData.getJob(id);
  }

  @Get('jobs/detail/:id')
  getJobDetailById(@Param('id') id: string) {
    return this.ecosystemData.getJob(id);
  }

  @Post('jobs/create')
  createJob(@Body() body: CreateJobDto) {
    return this.ecosystemData.createJob(body);
  }

  @Get('jobs/apply')
  getJobApplyState(@Query('id') id: string) {
    return {
      job: this.ecosystemData.getJob(id),
      defaults: {
        applicantName: 'You',
        resumeRequired: true,
        coverLetterOptional: true,
      },
    };
  }

  @Post('jobs/:id/apply')
  applyForJob(@Param('id') id: string, @Body() body: { applicantName: string }) {
    return this.ecosystemData.applyForJob(id, body.applicantName);
  }

  @Post('jobs/apply')
  applyForJobAlias(@Body() body: { jobId: string; applicantName: string }) {
    return this.ecosystemData.applyForJob(body.jobId, body.applicantName);
  }

  @Get('jobs/applications')
  getJobApplications() {
    return this.ecosystemData.getJobApplications();
  }

  @Get('jobs/alerts')
  getJobAlerts() {
    return this.ecosystemData.getJobAlerts();
  }

  @Get('jobs/companies')
  getCompanies() {
    return this.ecosystemData.getCompanies();
  }

  @Get('jobs/profile')
  getCareerProfile() {
    return this.ecosystemData.getCareerProfile();
  }

  @Get('jobs/employer-stats')
  getEmployerStats() {
    return this.ecosystemData.getEmployerStats();
  }

  @Get('jobs/employer-profile')
  getEmployerProfile() {
    return this.ecosystemData.getEmployerProfile();
  }

  @Get('jobs/applicants')
  getApplicants() {
    return this.ecosystemData.getApplicants();
  }

  @Get('jobs/:id')
  getJob(@Param('id') id: string) {
    return this.ecosystemData.getJob(id);
  }

  @Get('professional-profiles')
  getProfessionalProfiles() {
    return this.ecosystemData.getProfessionalProfiles();
  }
}
