import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CreateJobDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { ExperienceDatabaseService } from '../services/experience-database.service';

@ApiTags('jobs')
@Controller()
export class JobsController {
  constructor(
    private readonly experienceDatabase: ExperienceDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get('jobs')
  getJobs() {
    return this.experienceDatabase.getJobs();
  }

  @Get('jobs-networking')
  async getJobsNetworking() {
    const jobs = await this.experienceDatabase.getJobs();
    return {
      totalJobs: jobs.length,
      openJobs: jobs.filter((job) => job.status === 'open').length,
      jobs,
    };
  }

  @Get('jobs/create')
  async getJobCreateOptions() {
    const jobs = await this.experienceDatabase.getJobs();
    return {
      typeOptions: [...new Set(jobs.map((job) => job.type))],
      experienceLevels: [...new Set(jobs.map((job) => job.experienceLevel))],
      suggestedCompanies: [...new Set(jobs.map((job) => job.company))],
    };
  }

  @Get('jobs/detail')
  getJobDetail(@Query('id') id: string) {
    return this.experienceDatabase.getJob(id);
  }

  @Get('jobs/detail/:id')
  getJobDetailById(@Param('id') id: string) {
    return this.experienceDatabase.getJob(id);
  }

  @UseGuards(SessionAuthGuard)
  @Post('jobs/create')
  async createJob(
    @Body() body: CreateJobDto,
    @Headers('authorization') authorization?: string,
  ) {
    const recruiter = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.experienceDatabase.createJob(recruiter.id, body);
  }

  @Get('jobs/apply')
  async getJobApplyState(@Query('id') id: string) {
    return {
      job: await this.experienceDatabase.getJob(id),
      defaults: {
        applicantName: 'You',
        resumeRequired: true,
        coverLetterOptional: true,
      },
    };
  }

  @UseGuards(SessionAuthGuard)
  @Post('jobs/:id/apply')
  async applyForJob(
    @Param('id') id: string,
    @Body() body: { applicantName: string; applicantId?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.applicantId,
    );
    return this.experienceDatabase.applyForJob(id, user.id, body.applicantName || user.name);
  }

  @UseGuards(SessionAuthGuard)
  @Post('jobs/apply')
  async applyForJobAlias(
    @Body() body: { jobId: string; applicantName: string; applicantId?: string },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.applicantId,
    );
    return this.experienceDatabase.applyForJob(
      body.jobId,
      user.id,
      body.applicantName || user.name,
    );
  }

  @Get('jobs/applications')
  getJobApplications(@Query('applicantId') applicantId?: string) {
    return this.experienceDatabase.getJobApplications(applicantId);
  }

  @Get('jobs/alerts')
  getJobAlerts() {
    return [];
  }

  @Get('jobs/companies')
  async getCompanies() {
    const jobs = await this.experienceDatabase.getJobs();
    return [...new Set(jobs.map((job) => job.company))];
  }

  @Get('jobs/profile')
  getCareerProfile() {
    return { message: 'Career profile will be populated from profile and applications data.' };
  }

  @Get('jobs/employer-stats')
  async getEmployerStats() {
    const jobs = await this.experienceDatabase.getJobs();
    return {
      totalJobs: jobs.length,
      openJobs: jobs.filter((job) => job.status === 'open').length,
    };
  }

  @Get('jobs/employer-profile')
  getEmployerProfile() {
    return { message: 'Employer profile will be composed from user and job data.' };
  }

  @Get('jobs/applicants')
  getApplicants() {
    return this.experienceDatabase.getJobApplications();
  }

  @Get('jobs/:id')
  getJob(@Param('id') id: string) {
    return this.experienceDatabase.getJob(id);
  }

  @Get('professional-profiles')
  getProfessionalProfiles() {
    return { message: 'Professional profile presets are now expected from real user/profile data.' };
  }
}
