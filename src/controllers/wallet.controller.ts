import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { EcosystemDataService } from '../data/ecosystem-data.service';

@ApiTags('wallet')
@Controller('wallet')
export class WalletController {
  constructor(private readonly ecosystemData: EcosystemDataService) {}

  @Get()
  getWallet() {
    return this.ecosystemData.getWallet();
  }
}
