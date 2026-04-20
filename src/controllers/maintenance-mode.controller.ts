import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';

@ApiTags('maintenance-mode')
@Controller('maintenance-mode')
export class MaintenanceModeController {
  constructor(private readonly appExtensionsData: AppExtensionsDataService) {}

  @Get()
  getMaintenanceMode() {
    return this.appExtensionsData.getMaintenanceMode();
  }

  @Post('retry')
  retryMaintenance() {
    return this.appExtensionsData.retryMaintenance();
  }
}
