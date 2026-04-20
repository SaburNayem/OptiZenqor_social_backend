import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AppExtensionsDataService } from '../data/app-extensions-data.service';
import { ResolveDeepLinkDto } from '../dto/api.dto';

@ApiTags('deep-link-handler')
@Controller('deep-link-handler')
export class DeepLinkHandlerController {
  constructor(private readonly appExtensionsData: AppExtensionsDataService) {}

  @Get()
  getDeepLinkState() {
    return this.appExtensionsData.getDeepLinkHandler();
  }

  @Post('resolve')
  resolveLink(@Body() body: ResolveDeepLinkDto) {
    return this.appExtensionsData.resolveDeepLink(body.url);
  }
}
