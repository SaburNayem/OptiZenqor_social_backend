import { Body, Controller, Get, Headers, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CreateJobDto, JobsQueryDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { ExperienceDatabaseService } from '../services/experience-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('jobs')
@Controller()
export class JobsController {
  constructor(
    private readonly experienceDatabase: ExperienceDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get('jobs')
  async getJobs(@Query() query: JobsQueryDto) {
    const payload = await this.experienceDatabase.getJobs(query);
    return {
      ...successResponse('Jobs fetched successfully.', payload, payload.pagination),
      items: payload.items,
      results: payload.results,
      jobs: payload.jobs,
    };
  }

  @Get('jobs-networking')
  async getJobsNetworking() {
    const jobsPayload = await this.experienceDatabase.getJobs();
    const jobs = jobsPayload.jobs;
    return {
      success: true,
      message: 'Jobs networking overview fetched successfully.',
      totalJobs: jobs.length,
      openJobs: jobs.filter((job) => job.status === 'open').length,
      jobs,
      data: {
        totalJobs: jobs.length,
        openJobs: jobs.filter((job) => job.status === 'open').length,
        jobs,
      },
    };
  }

  @Get('jobs/create')
  async getJobCreateOptions() {
    const jobs = (await this.experienceDatabase.getJobs()).jobs;
    return {
      success: true,
      message: 'Job creation options fetched successfully.',
      typeOptions: [...new Set(jobs.map((job) => job.type))],
      experienceLevels: [...new Set(jobs.map((job) => job.experienceLevel))],
      suggestedCompanies: [...new Set(jobs.map((job) => job.company))],
      data: {
        typeOptions: [...new Set(jobs.map((job) => job.type))],
        experienceLevels: [...new Set(jobs.map((job) => job.experienceLevel))],
        suggestedCompanies: [...new Set(jobs.map((job) => job.company))],
      },
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
  async getJobApplications(@Query('applicantId') applicantId?: string) {
    const items = await this.experienceDatabase.getJobApplications(applicantId);
    return {
      ...successResponse('Job applications fetched successfully.', {
        items,
        results: items,
        applications: items,
      }),
      items,
      results: items,
      applications: items,
    };
  }

  @Get('jobs/alerts')
  getJobAlerts() {
    return successResponse('Job alerts fetched successfully.', {
      items: [],
      results: [],
      alerts: [],
    });
  }

  @Get('jobs/companies')
  async getCompanies() {
    const jobs = (await this.experienceDatabase.getJobs()).jobs;
    const companies = [...new Set(jobs.map((job) => job.company))];
    return successResponse('Job companies fetched successfully.', {
      items: companies,
      results: companies,
      companies,
    });
  }

  @Get('jobs/profile')
  getCareerProfile() {
    return { message: 'Career profile will be populated from profile and applications data.' };
  }

  @Get('jobs/employer-stats')
  async getEmployerStats() {
    const jobs = (await this.experienceDatabase.getJobs()).jobs;
    return successResponse('Employer stats fetched successfully.', {
      totalJobs: jobs.length,
      openJobs: jobs.filter((job) => job.status === 'open').length,
    });
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
