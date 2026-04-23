import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { SetActiveAccountDto } from '../dto/api.dto';

@ApiTags('account-switching')
@Controller('account-switching')
export class AccountSwitchingController {
  constructor(private readonly appExtensionsData: AppExtensionsDataService) {}

  @Get()
  getAccounts() {
    return this.appExtensionsData.getAccountSwitching();
  }

  @Get('active')
  getActiveAccount() {
    return this.appExtensionsData.getActiveAccount();
  }

  @Patch('active')
  setActiveAccount(@Body() body: SetActiveAccountDto) {
    return this.appExtensionsData.setActiveAccount(body.accountId);
  }

  @Post('active')
  setActiveAccountPost(@Body() body: SetActiveAccountDto) {
    return this.appExtensionsData.setActiveAccount(body.accountId);
  }
}
