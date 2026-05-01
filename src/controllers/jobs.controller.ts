import { Body, Controller, Delete, Get, Headers, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  CreateJobAlertDto,
  CreateJobDto,
  JobsQueryDto,
  ToggleCompanyFollowDto,
  UpdateJobAlertDto,
  UpdateJobApplicationStatusDto,
  WithdrawJobApplicationDto,
} from '../dto/api.dto';
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
  async getJobsNetworking(@Headers('authorization') authorization?: string) {
    const viewer = await this.resolveViewer(authorization);
    const payload = await this.experienceDatabase.getJobsNetworkingOverview(viewer?.id);
    return {
      ...successResponse('Jobs networking overview fetched successfully.', payload),
      totalJobs: payload.totalJobs,
      openJobs: payload.openJobs,
      jobs: payload.jobs,
      myJobs: payload.myJobs,
      applications: payload.applications,
      alerts: payload.alerts,
      companies: payload.companies,
      profile: payload.profile,
      employerStats: payload.employerStats,
      employerProfile: payload.employerProfile,
      applicants: payload.applicants,
    };
  }

  @Get('jobs/create')
  async getJobCreateOptions() {
    const jobs = (await this.experienceDatabase.getJobs()).jobs;
    return {
      success: true,
      message: 'Job creation options fetched successfully.',
      requiredProfileType: 'business',
      typeOptions: [...new Set(jobs.map((job) => job.type))],
      experienceLevels: [...new Set(jobs.map((job) => job.experienceLevel))],
      suggestedCompanies: [...new Set(jobs.map((job) => job.company))],
      data: {
        requiredProfileType: 'business',
        typeOptions: [...new Set(jobs.map((job) => job.type))],
        experienceLevels: [...new Set(jobs.map((job) => job.experienceLevel))],
        suggestedCompanies: [...new Set(jobs.map((job) => job.company))],
      },
    };
  }

  @Get('jobs/detail')
  async getJobDetail(@Query('id') id: string) {
    return successResponse('Job fetched successfully.', await this.experienceDatabase.getJob(id));
  }

  @Get('jobs/detail/:id')
  async getJobDetailById(@Param('id') id: string) {
    return successResponse('Job fetched successfully.', await this.experienceDatabase.getJob(id));
  }

  @UseGuards(SessionAuthGuard)
  @Post('jobs/create')
  async createJob(
    @Body() body: CreateJobDto,
    @Headers('authorization') authorization?: string,
  ) {
    const recruiter = await this.coreDatabase.requireUserFromAuthorization(authorization);
    this.coreDatabase.assertUserCanCreateJobs(recruiter);
    return successResponse(
      'Job created successfully.',
      await this.experienceDatabase.createJob(recruiter.id, body),
    );
  }

  @Get('jobs/apply')
  async getJobApplyState(@Query('id') id: string) {
    return successResponse('Job application state fetched successfully.', {
      job: await this.experienceDatabase.getJob(id),
      defaults: {
        applicantName: 'You',
        resumeRequired: true,
        coverLetterOptional: true,
      },
    });
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
    return successResponse(
      'Job application submitted successfully.',
      await this.experienceDatabase.applyForJob(id, user.id, body.applicantName || user.name),
    );
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
    return successResponse(
      'Job application submitted successfully.',
      await this.experienceDatabase.applyForJob(
        body.jobId,
        user.id,
        body.applicantName || user.name,
      ),
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
  async getJobAlerts(
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization, userId);
    const alerts = await this.experienceDatabase.getJobAlerts(user.id);
    return {
      ...successResponse('Job alerts fetched successfully.', {
        items: alerts,
        results: alerts,
        alerts,
      }),
      items: alerts,
      results: alerts,
      alerts,
    };
  }

  @Post('jobs/alerts')
  @UseGuards(SessionAuthGuard)
  async createJobAlert(
    @Body() body: CreateJobAlertDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Job alert created successfully.',
      await this.experienceDatabase.createJobAlert(user.id, body),
    );
  }

  @Patch('jobs/alerts/:id')
  @UseGuards(SessionAuthGuard)
  async updateJobAlert(
    @Param('id') id: string,
    @Body() body: UpdateJobAlertDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Job alert updated successfully.',
      await this.experienceDatabase.updateJobAlert(user.id, id, body),
    );
  }

  @Delete('jobs/alerts/:id')
  @UseGuards(SessionAuthGuard)
  async deleteJobAlert(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Job alert deleted successfully.',
      await this.experienceDatabase.deleteJobAlert(user.id, id),
    );
  }

  @Get('jobs/companies')
  async getCompanies(
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const viewer = await this.coreDatabase
      .requireUserFromAuthorization(authorization, userId)
      .catch(() => null);
    const companies = await this.experienceDatabase.getJobCompanies(viewer?.id);
    return {
      ...successResponse('Job companies fetched successfully.', {
        items: companies,
        results: companies,
        companies,
      }),
      items: companies,
      results: companies,
      companies,
    };
  }

  @Patch('jobs/companies/:companyId/follow')
  @UseGuards(SessionAuthGuard)
  async toggleCompanyFollow(
    @Param('companyId') companyId: string,
    @Body() body: ToggleCompanyFollowDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Company follow status updated successfully.',
      await this.experienceDatabase.toggleJobCompanyFollow(user.id, companyId, body.followed),
    );
  }

  @Get('jobs/profile')
  async getCareerProfile(
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization, userId);
    return successResponse(
      'Career profile fetched successfully.',
      await this.experienceDatabase.getCareerProfile(user.id),
    );
  }

  @Get('jobs/employer-stats')
  async getEmployerStats(
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization, userId);
    return successResponse(
      'Employer stats fetched successfully.',
      await this.experienceDatabase.getEmployerStats(user.id),
    );
  }

  @Get('jobs/employer-profile')
  async getEmployerProfile(
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization, userId);
    return successResponse(
      'Employer profile fetched successfully.',
      await this.experienceDatabase.getEmployerProfile(user.id),
    );
  }

  @Get('jobs/applicants')
  async getApplicants(
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization, userId);
    const applicants = await this.experienceDatabase.getApplicantsForRecruiter(user.id);
    return {
      ...successResponse('Job applicants fetched successfully.', {
        items: applicants,
        results: applicants,
        applicants,
      }),
      items: applicants,
      results: applicants,
      applicants,
    };
  }

  @Patch('jobs/applications/:id/withdraw')
  @UseGuards(SessionAuthGuard)
  async withdrawApplication(
    @Param('id') id: string,
    @Body() body: WithdrawJobApplicationDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(
      authorization,
      body.applicantId,
    );
    return successResponse(
      'Job application withdrawn successfully.',
      await this.experienceDatabase.withdrawJobApplication(id, user.id),
    );
  }

  @Patch('jobs/applications/:id/status')
  @UseGuards(SessionAuthGuard)
  async updateApplicationStatus(
    @Param('id') id: string,
    @Body() body: UpdateJobApplicationStatusDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Job application status updated successfully.',
      await this.experienceDatabase.updateJobApplicationStatus(id, user.id, body.status),
    );
  }

  @Patch('jobs/:id/save')
  @UseGuards(SessionAuthGuard)
  async toggleSavedJob(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Job saved state updated successfully.',
      await this.experienceDatabase.toggleSavedJob(user.id, id),
    );
  }

  @Delete('jobs/:id')
  @UseGuards(SessionAuthGuard)
  async deleteJob(
    @Param('id') id: string,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Job deleted successfully.',
      await this.experienceDatabase.deleteJob(id, user.id),
    );
  }

  @Get('jobs/:id')
  async getJob(@Param('id') id: string) {
    return successResponse('Job fetched successfully.', await this.experienceDatabase.getJob(id));
  }

  @Get('professional-profiles')
  async getProfessionalProfiles(
    @Headers('authorization') authorization?: string,
    @Query('userId') userId?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization, userId);
    return successResponse(
      'Professional profile fetched successfully.',
      await this.experienceDatabase.getCareerProfile(user.id),
    );
  }

  private async resolveViewer(authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    return this.coreDatabase.resolveUserFromAccessToken(token);
  }
}
