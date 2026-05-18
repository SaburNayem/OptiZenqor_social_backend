import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { SSLCommerzProvider } from './providers/sslcommerz.provider';
import { TwoCheckoutProvider } from './providers/twocheckout.provider';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, SSLCommerzProvider, TwoCheckoutProvider],
  exports: [PaymentService],
})
export class PaymentModule {}
