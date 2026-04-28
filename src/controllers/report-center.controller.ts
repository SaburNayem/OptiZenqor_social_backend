import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SubmitReportDto } from '../dto/api.dto';
import { AccountStateDatabaseService } from '../services/account-state-database.service';
import { CoreDatabaseService } from '../services/core-database.service';
import { successResponse } from '../utils/api-response.util';

@ApiTags('report-center')
@Controller('report-center')
@UseGuards(JwtAuthGuard)
export class ReportCenterController {
  constructor(
    private readonly accountStateDatabase: AccountStateDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get()
  async getReportCenter(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Reports fetched successfully.',
      await this.accountStateDatabase.getReportCenter(user.id),
    );
  }

  @Post()
  async submitReport(
    @Body() body: SubmitReportDto & {
      targetUserId?: string;
      targetEntityId?: string;
      targetEntityType?: string;
      details?: string;
    },
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return successResponse(
      'Report submitted successfully.',
      await this.accountStateDatabase.submitReport({
        reporterUserId: user.id,
        reason: body.reason,
        details: body.details,
        targetUserId: body.targetUserId,
        targetEntityId: body.targetEntityId,
        targetEntityType: body.targetEntityType,
      }),
    );
  }
}
