import { Controller, Get, Res } from '@nestjs/common';

@Controller()
export class HealthController {
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
    };
  }
}
