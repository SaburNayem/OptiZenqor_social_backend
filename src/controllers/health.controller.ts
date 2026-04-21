import { Controller, Get, Res } from '@nestjs/common';
import { DatabaseService } from '../services/database.service';

@Controller()
export class HealthController {
  constructor(private readonly databaseService: DatabaseService) {}

  @Get()
  root(@Res() res: { redirect: (url: string) => unknown }) {
    return res.redirect('/docs');
  }

  @Get('health')
  health() {
    return {
      status: 'ok',
      service: 'socity-backend',
      timestamp: new Date().toISOString(),
      database: this.databaseService.getHealth(),
    };
  }

  @Get('health/database')
  healthDatabase() {
    return this.databaseService.getHealth();
  }
}
