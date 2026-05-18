import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { createHash } from 'crypto';
import { makeId } from '../common/id.util';
import { PrismaService } from '../services/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentCurrency, PaymentGateway, PaymentRegion, PaymentStatus } from './payment.enums';
import { PaymentProvider, ProviderValidationResult, WebhookInput } from './payment-provider.interface';
import { SSLCommerzProvider } from './providers/sslcommerz.provider';
import { TwoCheckoutProvider } from './providers/twocheckout.provider';

type AuthenticatedPaymentUser = {
  id: string;
  name?: string;
  email?: string;
};

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);
  private readonly providers: Record<PaymentGateway, PaymentProvider>;

  constructor(
    private readonly prisma: PrismaService,
    sslCommerzProvider: SSLCommerzProvider,
    twoCheckoutProvider: TwoCheckoutProvider,
  ) {
    this.providers = {
      [PaymentGateway.SSLCommerz]: sslCommerzProvider,
      [PaymentGateway.TwoCheckout]: twoCheckoutProvider,
    };
  }

  async createPayment(input: CreatePaymentDto, user: AuthenticatedPaymentUser) {
    const gateway = this.resolveGateway(input);
    const provider = this.providers[gateway];
    const orderId = makeId('order');
    const paymentId = makeId('payment');
    const amount = this.normalizeAmount(input.amount);
    const metadata = {
      ...(input.metadata ?? {}),
      itemType: input.itemType,
      itemId: input.itemId ?? null,
      requestedGateway: input.gateway ?? 'auto',
      requestedRegion: input.region ?? null,
    };
    const metadataJson = this.toPrismaJson(metadata);

    await this.prisma.order.create({
      data: {
        id: orderId,
        userId: user.id,
        itemType: input.itemType.trim(),
        itemId: input.itemId?.trim() || null,
        title: input.title.trim(),
        description: input.description?.trim() || '',
        amount,
        currency: input.currency,
        metadata: metadataJson,
        payments: {
          create: {
            id: paymentId,
            userId: user.id,
            gateway,
            status: PaymentStatus.Pending,
            amount,
            currency: input.currency,
            metadata: metadataJson,
          },
        },
      },
    });

    const checkoutSession = await provider.createCheckoutSession({
      paymentId,
      orderId,
      userId: user.id,
      title: input.title.trim(),
      description: input.description?.trim(),
      amount,
      currency: input.currency,
      customer: {
        name: input.customer.name.trim() || user.name || 'Customer',
        email: input.customer.email.trim() || user.email || '',
        phone: input.customer.phone.trim(),
        city: input.customer.city?.trim(),
        country: input.customer.country?.trim(),
        address: input.customer.address?.trim(),
        postalCode: input.customer.postalCode?.trim(),
      },
      metadata,
    });

    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: {
        checkoutUrl: checkoutSession.checkoutUrl,
        providerSessionId: checkoutSession.providerSessionId,
        providerTransactionId: checkoutSession.providerTransactionId,
        providerPayload: this.toPrismaJson(checkoutSession.rawPayload),
      },
    });

    this.logger.log(`Created ${gateway} payment ${paymentId} for order ${orderId}.`);
    return this.mapPayment(payment, orderId);
  }

  async handleWebhook(gateway: PaymentGateway, input: WebhookInput) {
    const provider = this.providers[gateway];
    const validation = await provider.validateWebhook(input);
    const idempotencyKey = this.buildIdempotencyKey(validation);
    const existingEvent = await this.prisma.paymentEvent.findUnique({
      where: { idempotencyKey },
    });
    if (existingEvent?.processingStatus === 'processed') {
      this.logger.log(`Skipped duplicate ${gateway} event ${idempotencyKey}.`);
      return {
        duplicate: true,
        paymentId: existingEvent.paymentId,
        orderId: existingEvent.orderId,
        status: existingEvent.status,
        responseBody: validation.responseBody,
      };
    }

    const event = existingEvent ?? await this.prisma.paymentEvent.create({
      data: {
        id: makeId('payment_event'),
        gateway,
        eventType: validation.eventType,
        eventId: validation.eventId || null,
        idempotencyKey,
        providerTransactionId: validation.providerTransactionId || null,
        rawPayload: this.toPrismaJson(validation.rawPayload),
        headers: this.toPrismaJson(input.headers),
        status: validation.status,
      },
    });

    try {
      const payment = await this.resolvePayment(validation);
      this.assertGatewayMatches(payment.gateway, gateway);
      this.assertOrderMatches(payment.orderId, validation.orderId);
      this.assertAmountMatches(Number(payment.amount), validation.amount);
      this.assertCurrencyMatches(payment.currency as PaymentCurrency, validation.currency);
      if (!validation.verified) {
        throw new BadRequestException('Gateway verification failed.');
      }

      const nextStatus = validation.status;
      const timestampPatch = this.timestampPatch(nextStatus);
      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: nextStatus,
          providerTransactionId: validation.providerTransactionId || payment.providerTransactionId,
          providerPayload: this.toPrismaJson(validation.rawPayload),
          ...timestampPatch,
          order: {
            update: { status: this.paymentStatusToOrderStatus(nextStatus) },
          },
        },
      });

      await this.prisma.paymentEvent.update({
        where: { id: event.id },
        data: {
          paymentId: updated.id,
          orderId: updated.orderId,
          status: nextStatus,
          processingStatus: 'processed',
          processedAt: new Date(),
          errorMessage: null,
        },
      });

      this.logger.log(`Processed ${gateway} event ${idempotencyKey} as ${nextStatus}.`);
      return {
        duplicate: false,
        paymentId: updated.id,
        orderId: updated.orderId,
        status: updated.status,
        responseBody: validation.responseBody,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Payment webhook processing failed.';
      await this.prisma.paymentEvent.update({
        where: { id: event.id },
        data: {
          processingStatus: 'failed',
          processedAt: new Date(),
          errorMessage: message,
        },
      });
      this.logger.error(`Payment webhook failed: ${message}`);
      throw error;
    }
  }

  async markReturnState(paymentId: string, state: 'success' | 'fail' | 'cancel') {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found.`);
    }

    if (payment.status === PaymentStatus.Paid) {
      return payment;
    }

    if (state === 'fail') {
      return this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.Failed,
          failedAt: new Date(),
          order: { update: { status: 'FAILED' } },
        },
      });
    }

    if (state === 'cancel') {
      return this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: PaymentStatus.Cancelled,
          cancelledAt: new Date(),
          order: { update: { status: 'CANCELLED' } },
        },
      });
    }

    return payment;
  }

  async getPaymentStatus(paymentId: string, userId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId,
      },
      include: {
        order: true,
        events: {
          orderBy: { receivedAt: 'desc' },
          take: 5,
        },
      },
    });
    if (!payment) {
      throw new NotFoundException(`Payment ${paymentId} not found.`);
    }
    return {
      ...this.mapPayment(payment, payment.orderId),
      events: payment.events.map((event) => ({
        id: event.id,
        eventType: event.eventType,
        status: event.status,
        processingStatus: event.processingStatus,
        receivedAt: event.receivedAt.toISOString(),
        processedAt: event.processedAt?.toISOString() ?? null,
      })),
    };
  }

  private resolveGateway(input: CreatePaymentDto) {
    if (input.gateway) {
      return input.gateway;
    }
    if (input.currency === PaymentCurrency.BDT || input.region === PaymentRegion.Local) {
      return PaymentGateway.SSLCommerz;
    }
    return PaymentGateway.TwoCheckout;
  }

  private async resolvePayment(validation: ProviderValidationResult) {
    if (validation.paymentId) {
      const payment = await this.prisma.payment.findUnique({
        where: { id: validation.paymentId },
      });
      if (payment) {
        return payment;
      }
    }

    if (validation.orderId) {
      const payment = await this.prisma.payment.findFirst({
        where: {
          orderId: validation.orderId,
          gateway: validation.gateway,
        },
        orderBy: { createdAt: 'desc' },
      });
      if (payment) {
        return payment;
      }
    }

    throw new NotFoundException('Payment record not found for webhook.');
  }

  private buildIdempotencyKey(validation: ProviderValidationResult) {
    const eventId = validation.eventId || this.hashJson(validation.rawPayload);
    return `${validation.gateway}:${validation.eventType}:${eventId}`;
  }

  private assertGatewayMatches(paymentGateway: unknown, gateway: PaymentGateway) {
    if (paymentGateway !== gateway) {
      throw new BadRequestException('Gateway mismatch.');
    }
  }

  private assertOrderMatches(paymentOrderId: string, gatewayOrderId?: string) {
    if (gatewayOrderId && paymentOrderId !== gatewayOrderId) {
      throw new BadRequestException('Order ID mismatch.');
    }
  }

  private assertAmountMatches(expectedAmount: number, gatewayAmount?: number) {
    if (gatewayAmount == null) {
      throw new BadRequestException('Gateway amount is missing.');
    }
    if (Math.abs(expectedAmount - gatewayAmount) > 0.01) {
      throw new BadRequestException('Payment amount mismatch.');
    }
  }

  private assertCurrencyMatches(expectedCurrency: PaymentCurrency, gatewayCurrency?: PaymentCurrency) {
    if (!gatewayCurrency) {
      throw new BadRequestException('Gateway currency is missing.');
    }
    if (expectedCurrency !== gatewayCurrency) {
      throw new BadRequestException('Payment currency mismatch.');
    }
  }

  private timestampPatch(status: PaymentStatus) {
    const now = new Date();
    switch (status) {
      case PaymentStatus.Paid:
        return { paidAt: now };
      case PaymentStatus.Failed:
        return { failedAt: now };
      case PaymentStatus.Cancelled:
        return { cancelledAt: now };
      default:
        return {};
    }
  }

  private paymentStatusToOrderStatus(status: PaymentStatus) {
    switch (status) {
      case PaymentStatus.Paid:
        return 'PAID';
      case PaymentStatus.Failed:
        return 'FAILED';
      case PaymentStatus.Cancelled:
        return 'CANCELLED';
      case PaymentStatus.Refunded:
        return 'REFUNDED';
      default:
        return 'PENDING';
    }
  }

  private normalizeAmount(value: number) {
    return Math.round(value * 100) / 100;
  }

  private hashJson(value: unknown) {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex');
  }

  private toPrismaJson(value: unknown): Prisma.InputJsonValue {
    return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
  }

  private mapPayment(payment: {
    id: string;
    orderId: string;
    gateway: unknown;
    status: unknown;
    amount: unknown;
    currency: unknown;
    checkoutUrl?: string | null;
    providerTransactionId?: string | null;
    createdAt: Date;
    updatedAt: Date;
  }, orderId: string) {
    return {
      paymentId: payment.id,
      orderId,
      gateway: payment.gateway,
      status: payment.status,
      amount: Number(payment.amount),
      currency: payment.currency,
      checkoutUrl: payment.checkoutUrl ?? null,
      providerTransactionId: payment.providerTransactionId ?? null,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    };
  }
}
