import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { SubmitReportDto } from '../dto/api.dto';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('report-center')
@Controller('report-center')
@UseGuards(SessionAuthGuard)
export class ReportCenterController {
  constructor(
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get('options')
  @ApiOperation({ summary: 'Get report target and reason options' })
  getReportOptions() {
    return successResponse(
      'Report options fetched successfully.',
      this.accountStateDatabase.getReportOptions(),
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get the authenticated user report center' })
  async getReportCenter(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Reports fetched successfully.',
      await this.accountStateDatabase.getReportCenter(user.id),
    );
  }

  @Post()
  @ApiOperation({ summary: 'Submit a report for a person, post, comment, or other target' })
  async submitReport(
    @Body() body: SubmitReportDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Report submitted successfully.',
      await this.accountStateDatabase.submitReport({
        reporterUserId: user.id,
        reason: body.reason,
        details: body.details,
        targetType: body.targetType,
        targetId: body.targetId,
        targetUserId: body.targetUserId,
        targetEntityId: body.targetEntityId,
        targetEntityType: body.targetEntityType,
      }),
    );
  }
}
