import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PaymentCurrency, PaymentGateway, PaymentStatus } from '../payment.enums';
import {
  CheckoutSession,
  CreateCheckoutInput,
  PaymentProvider,
  ProviderValidationResult,
  WebhookInput,
} from '../payment-provider.interface';

@Injectable()
export class SSLCommerzProvider implements PaymentProvider {
  readonly gateway = PaymentGateway.SSLCommerz;
  private readonly logger = new Logger(SSLCommerzProvider.name);

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession> {
    const storeId = this.requiredEnv('SSLCOMMERZ_STORE_ID');
    const storePassword = this.requiredEnv('SSLCOMMERZ_STORE_PASSWORD');
    const publicBaseUrl = this.publicBaseUrl();
    const sessionUrl = this.sessionUrl();

    const form = new URLSearchParams({
      store_id: storeId,
      store_passwd: storePassword,
      total_amount: input.amount.toFixed(2),
      currency: input.currency,
      tran_id: input.paymentId,
      success_url: `${publicBaseUrl}/payments/success?paymentId=${encodeURIComponent(input.paymentId)}`,
      fail_url: `${publicBaseUrl}/payments/fail?paymentId=${encodeURIComponent(input.paymentId)}`,
      cancel_url: `${publicBaseUrl}/payments/cancel?paymentId=${encodeURIComponent(input.paymentId)}`,
      ipn_url: `${publicBaseUrl}/payments/sslcommerz/ipn`,
      product_name: input.title,
      product_category: String(input.metadata?.itemType ?? 'digital'),
      product_profile: 'general',
      cus_name: input.customer.name,
      cus_email: input.customer.email,
      cus_phone: input.customer.phone,
      cus_add1: input.customer.address || 'N/A',
      cus_city: input.customer.city || 'Dhaka',
      cus_country: input.customer.country || 'Bangladesh',
      cus_postcode: input.customer.postalCode || '1000',
      shipping_method: 'NO',
      num_of_item: '1',
      value_a: input.orderId,
      value_b: input.userId,
      value_c: input.paymentId,
    });

    const response = await fetch(sessionUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    const checkoutUrl = String(payload.GatewayPageURL ?? payload.gatewayPageURL ?? '');
    if (!response.ok || !checkoutUrl) {
      this.logger.error(`SSLCommerz session creation failed: ${JSON.stringify(payload)}`);
      throw new ServiceUnavailableException('Unable to create SSLCommerz checkout session.');
    }

    return {
      checkoutUrl,
      providerSessionId: this.asString(payload.sessionkey ?? payload.sessionKey),
      providerTransactionId: input.paymentId,
      rawPayload: payload,
    };
  }

  async validateWebhook(input: WebhookInput): Promise<ProviderValidationResult> {
    const body = input.body;
    const paymentId = this.asString(body.tran_id ?? body.value_c);
    const orderId = this.asString(body.value_a);
    const valId = this.asString(body.val_id);
    const status = this.normalizeStatus(this.asString(body.status));
    let validationPayload: Record<string, unknown> = {};
    let verified = false;

    if (valId && status === PaymentStatus.Paid) {
      validationPayload = await this.validateOrder(valId);
      const validationStatus = this.asString(validationPayload.status);
      verified = ['VALID', 'VALIDATED'].includes(validationStatus.toUpperCase());
    }

    return {
      gateway: this.gateway,
      eventType: this.asString(body.status) || 'sslcommerz.ipn',
      eventId: valId || paymentId || this.asString(body.bank_tran_id) || '',
      status,
      orderId,
      paymentId,
      providerTransactionId: this.asString(body.bank_tran_id) || paymentId,
      amount: this.asNumber(validationPayload.amount ?? body.amount),
      currency: this.asCurrency(validationPayload.currency ?? body.currency),
      verified: status === PaymentStatus.Paid ? verified : true,
      rawPayload: {
        ipn: body,
        validation: validationPayload,
      },
    };
  }

  private async validateOrder(valId: string) {
    const url = new URL(this.validationUrl());
    url.searchParams.set('val_id', valId);
    url.searchParams.set('store_id', this.requiredEnv('SSLCOMMERZ_STORE_ID'));
    url.searchParams.set('store_passwd', this.requiredEnv('SSLCOMMERZ_STORE_PASSWORD'));
    url.searchParams.set('format', 'json');

    const response = await fetch(url);
    const payload = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) {
      this.logger.error(`SSLCommerz validation API failed: ${JSON.stringify(payload)}`);
      return {};
    }
    return payload;
  }

  private normalizeStatus(value?: string) {
    switch ((value ?? '').trim().toUpperCase()) {
      case 'VALID':
      case 'VALIDATED':
        return PaymentStatus.Paid;
      case 'FAILED':
        return PaymentStatus.Failed;
      case 'CANCELLED':
      case 'CANCELED':
        return PaymentStatus.Cancelled;
      default:
        return PaymentStatus.Pending;
    }
  }

  private sessionUrl() {
    return this.envFlag('SSLCOMMERZ_SANDBOX', true)
      ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
      : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';
  }

  private validationUrl() {
    return this.envFlag('SSLCOMMERZ_SANDBOX', true)
      ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
      : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php';
  }

  private publicBaseUrl() {
    const configured =
      process.env.PAYMENT_PUBLIC_BASE_URL ??
      process.env.BACKEND_PUBLIC_URL ??
      process.env.VERCEL_URL ??
      'http://localhost:3000';
    const normalized = configured.trim();
    const withProtocol = /^https?:\/\//i.test(normalized) ? normalized : `https://${normalized}`;
    return withProtocol.replace(/\/+$/, '');
  }

  private requiredEnv(key: string) {
    const value = process.env[key]?.trim();
    if (!value) {
      throw new ServiceUnavailableException(`${key} is not configured.`);
    }
    return value;
  }

  private envFlag(key: string, fallback: boolean) {
    const value = process.env[key]?.trim().toLowerCase();
    if (!value) {
      return fallback;
    }
    return ['1', 'true', 'yes', 'sandbox'].includes(value);
  }

  private asString(value: unknown) {
    return typeof value === 'string' || typeof value === 'number' ? String(value).trim() : '';
  }

  private asNumber(value: unknown) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  }

  private asCurrency(value: unknown) {
    const normalized = this.asString(value).toUpperCase();
    return Object.values(PaymentCurrency).includes(normalized as PaymentCurrency)
      ? normalized as PaymentCurrency
      : undefined;
  }
}
