import { Controller, Get, Headers, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CoreDatabaseService } from '../services/core-database.service';
import { MonetizationDatabaseService } from '../services/monetization-database.service';

@ApiTags('wallet')
@Controller('wallet')
@UseGuards(SessionAuthGuard)
export class WalletController {
  constructor(
    private readonly coreDatabase: CoreDatabaseService,
    private readonly monetizationDatabase: MonetizationDatabaseService,
  ) {}

  @Get()
  async getWallet(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase.requireUserFromAuthorization(authorization);
    return {
      success: true,
      message: 'Wallet fetched successfully.',
      data: await this.monetizationDatabase.getWallet(user.id),
    };
  }
}
