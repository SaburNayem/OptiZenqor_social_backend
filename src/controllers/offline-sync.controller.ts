import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';

@ApiTags('offline-sync')
@Controller('offline-sync')
export class OfflineSyncController {
  constructor(private readonly appExtensionsData: AppExtensionsDataService) {}

  @Get()
  getOfflineSync() {
    return this.appExtensionsData.getOfflineSync();
  }

  @Post('retry')
  retryOfflineSync() {
    return this.appExtensionsData.retryOfflineSync();
  }
}
