import { Module } from '@nestjs/common';
import { AccountOpsController } from '../controllers/account-ops.controller';
import { AuthController } from '../controllers/auth.controller';
import { BootstrapController } from '../controllers/bootstrap.controller';
import { HealthController } from '../controllers/health.controller';
import { OnboardingController } from '../controllers/onboarding.controller';

@Module({
  controllers: [
    HealthController,
    BootstrapController,
    AuthController,
    OnboardingController,
    AccountOpsController,
  ],
})
export class SystemApiModule {}
