import { Controller, Get, Res } from '@nestjs/common';
import { DatabaseService } from '../services/database.service';
import { CloudinaryUploadService } from '../services/cloudinary-upload.service';

@Controller()
export class HealthController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly cloudinaryUploadService: CloudinaryUploadService,
  ) {}

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
      uploads: {
        cloudinaryConfigured: this.cloudinaryUploadService.isConfigured(),
      },
    };
  }

  @Get('health/database')
  healthDatabase() {
    return this.databaseService.getHealth();
  }
}
