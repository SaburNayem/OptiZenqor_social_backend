import { Module } from '@nestjs/common';
import { AdminOpsController } from '../controllers/admin-ops.controller';
import { AdminController } from '../controllers/admin.controller';

@Module({
  controllers: [AdminOpsController, AdminController],
})
export class AdminApiModule {}
