import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ExtendedDataService } from '../data/extended-data.service';
import { SessionInitDto } from '../dto/api.dto';

@ApiTags('bootstrap')
@Controller('app')
export class BootstrapController {
  constructor(private readonly extendedData: ExtendedDataService) {}

  @Get('bootstrap')
  getBootstrap() {
    return this.extendedData.getBootstrap();
  }

  @Get('config')
  getConfig() {
    return this.extendedData.getBootstrap();
  }

  @Post('session-init')
  sessionInit(@Body() body: SessionInitDto) {
    return {
      tokenReceived: Boolean(body.token),
      bootstrap: this.extendedData.getBootstrap(),
    };
  }
}
