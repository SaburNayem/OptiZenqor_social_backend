import { Body, Controller, Get, Patch } from '@nestjs/common';
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

  @Patch('active')
  setActiveAccount(@Body() body: SetActiveAccountDto) {
    return this.appExtensionsData.setActiveAccount(body.accountId);
  }
}
