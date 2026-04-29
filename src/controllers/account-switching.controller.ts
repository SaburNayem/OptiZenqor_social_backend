import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { SetActiveAccountDto } from '../dto/api.dto';
import { AppExtensionsDatabaseService } from '../services/app-extensions-database.service';

@ApiTags('account-switching')
@Controller('account-switching')
export class AccountSwitchingController {
  constructor(private readonly appExtensionsDatabase: AppExtensionsDatabaseService) {}

  @UseGuards(SessionAuthGuard)
  @Get()
  async getAccounts(@CurrentUser() user: { id: string }) {
    return this.appExtensionsDatabase.getAccountSwitching(user.id);
  }

  @UseGuards(SessionAuthGuard)
  @Get('active')
  async getActiveAccount(@CurrentUser() user: { id: string }) {
    return this.appExtensionsDatabase.getActiveAccount(user.id);
  }

  @UseGuards(SessionAuthGuard)
  @Patch('active')
  async setActiveAccount(@Body() body: SetActiveAccountDto, @CurrentUser() user: { id: string }) {
    return this.appExtensionsDatabase.setActiveAccount(user.id, body.accountId);
  }

  @UseGuards(SessionAuthGuard)
  @Post('active')
  async setActiveAccountPost(
    @Body() body: SetActiveAccountDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.appExtensionsDatabase.setActiveAccount(user.id, body.accountId);
  }
}
