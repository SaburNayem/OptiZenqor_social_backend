import { Body, Controller, Get, Headers, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SessionInitDto } from '../dto/api.dto';
import { CoreDatabaseService } from '../services/core-database.service';
import { ExperienceDatabaseService } from '../services/experience-database.service';

@ApiTags('bootstrap')
@Controller('app')
export class BootstrapController {
  constructor(
    private readonly experienceDatabase: ExperienceDatabaseService,
    private readonly coreDatabase: CoreDatabaseService,
  ) {}

  @Get('bootstrap')
  async getBootstrap(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase
      .requireUserFromAuthorization(authorization)
      .catch(() => null);
    return this.experienceDatabase.getBootstrap(user?.id);
  }

  @Get('config')
  async getConfig(@Headers('authorization') authorization?: string) {
    const user = await this.coreDatabase
      .requireUserFromAuthorization(authorization)
      .catch(() => null);
    return this.experienceDatabase.getBootstrap(user?.id);
  }

  @Post('session-init')
  async sessionInit(
    @Body() body: SessionInitDto,
    @Headers('authorization') authorization?: string,
  ) {
    const user = await this.coreDatabase
      .requireUserFromAuthorization(authorization)
      .catch(() => null);
    return {
      tokenReceived: Boolean(body.token),
      bootstrap: await this.experienceDatabase.getBootstrap(user?.id),
    };
  }
}
