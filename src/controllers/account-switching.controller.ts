import { Body, Controller, Get, Headers, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { SetActiveAccountDto } from '../dto/api.dto';
import { AppExtensionsDatabaseService } from '../services/app-extensions-database.service';
import { CoreDatabaseService } from '../services/core-database.service';

@ApiTags('account-switching')
@Controller('account-switching')
export class AccountSwitchingController {
  constructor(
    private readonly appExtensionsDatabase: AppExtensionsDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  async getAccounts(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.appExtensionsDatabase.getAccountSwitching(user.id);
  }

  @UseGuards(SessionAuthGuard)
  @Get('active')
  async getActiveAccount(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.appExtensionsDatabase.getActiveAccount(user.id);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('active')
  async setActiveAccount(
    @Body() body: SetActiveAccountDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.appExtensionsDatabase.setActiveAccount(user.id, body.accountId);
  }

  @UseGuards(SessionAuthGuard)
  @Post('active')
  async setActiveAccountPost(
    @Body() body: SetActiveAccountDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return this.appExtensionsDatabase.setActiveAccount(user.id, body.accountId);
  }
}
