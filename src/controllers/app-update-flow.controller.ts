import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';

@ApiTags('app-update-flow')
@Controller('app-update-flow')
export class AppUpdateFlowController {
  constructor(private readonly appExtensionsData: AppExtensionsDataService) {}

  @Get()
  getAppUpdateFlow() {
    return this.appExtensionsData.getAppUpdateFlow();
  }

  @Post('start')
  startUpdate() {
    return this.appExtensionsData.startAppUpdate();
  }
}
