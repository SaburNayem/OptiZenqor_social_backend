import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminApiModule } from './modules/admin-api.module';
import { ContentApiModule } from './modules/content-api.module';
import { DataModule } from './modules/data.module';
import { ExperienceApiModule } from './modules/experience-api.module';
import { SystemApiModule } from './modules/system-api.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DataModule,
    SystemApiModule,
    ContentApiModule,
    ExperienceApiModule,
    AdminApiModule,
  ],
})
export class AppModule {}
