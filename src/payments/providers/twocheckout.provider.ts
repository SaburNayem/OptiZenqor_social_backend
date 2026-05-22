import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable, Logger, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { PaymentCurrency, PaymentGateway, PaymentStatus } from '../payment.enums';
import {
  CheckoutSession,
  CreateCheckoutInput,
  PaymentProvider,
  ProviderValidationResult,
  WebhookInput,
} from '../payment-provider.interface';

@Injectable()
export class TwoCheckoutProvider implements PaymentProvider {
  readonly gateway = PaymentGateway.TwoCheckout;
  private readonly logger = new Logger(TwoCheckoutProvider.name);

  async createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession> {
    const merchantCode = this.requiredEnv('TWOCHECKOUT_MERCHANT_CODE');
    const secretWord = this.requiredEnv('TWOCHECKOUT_SECRET_WORD');
    const checkoutBase = process.env.TWOCHECKOUT_CHECKOUT_URL?.trim()
      || 'https://secure.2checkout.com/checkout/buy';
    const publicBaseUrl = this.publicBaseUrl();
    const params: Record<string, string> = {
      merchant: merchantCode,
      dynamic: '1',
      qty: '1',
      type: 'digital',
      prod: input.title,
      price: input.amount.toFixed(2),
      currency: input.currency,
      'order-ext-ref': input.orderId,
      'customer-ext-ref': input.userId,
      'return-url': `${publicBaseUrl}/payments/success?paymentId=${encodeURIComponent(input.paymentId)}`,
      'return-type': 'redirect',
      email: input.customer.email,
      name: input.customer.name,
      phone: input.customer.phone,
      country: input.customer.country || 'US',
      city: input.customer.city || 'N/A',
      address: input.customer.address || 'N/A',
      zip: input.customer.postalCode || '00000',
    };

    params.signature = this.signBuyLink(params, secretWord);
    const url = new URL(checkoutBase);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));

    return {
      checkoutUrl: url.toString(),
      providerTransactionId: input.orderId,
      rawPayload: {
        checkoutBase,
        params: this.redact(params),
      },
    };
  }

  async validateWebhook(input: WebhookInput): Promise<ProviderValidationResult> {
    const body = input.body;
    this.assertWebhookSignature(body);

    const eventType =
      this.asString(body.message_type) ||
      this.asString(body.MESSAGE_TYPE) ||
      this.asString(body.event_type) ||
      '2checkout.webhook';
    const eventId =
      this.asString(body.message_id) ||
      this.asString(body.MESSAGE_ID) ||
      this.asString(body.REFNO) ||
      this.asString(body.sale_id) ||
      this.hashPayload(body);
    const orderId =
      this.asString(body.order_ext_ref) ||
      this.asString(body['order-ext-ref']) ||
      this.asString(body.REFNOEXT) ||
      this.asString(body.vendor_order_id);
    const providerTransactionId =
      this.asString(body.REFNO) ||
      this.asString(body.sale_id) ||
      this.asString(body.order_ref) ||
      this.asString(body.invoice_id);
    const status = this.normalizeStatus(body);

    return {
      gateway: this.gateway,
      eventType,
      eventId,
      status,
      orderId,
      providerTransactionId,
      amount: this.asNumber(
        body.invoice_list_amount ??
        body.IPN_TOTAL ??
        body.total ??
        body.price ??
        body.ORDER_TOTAL,
      ),
      currency: this.asCurrency(
        body.list_currency ??
        body.CURRENCY ??
        body.currency ??
        body.ORDER_CURRENCY,
      ),
      verified: true,
      rawPayload: body,
      responseBody: `<EPAYMENT>${this.computeIpnResponseHash(body)}</EPAYMENT>`,
    };
  }

  private signBuyLink(params: Record<string, string>, secretWord: string) {
    const signedKeys = Object.keys(params).sort();
    const payload = signedKeys
      .map((key) => `${Buffer.byteLength(params[key], 'utf8')}${params[key]}`)
      .join('');
    return createHmac('sha256', secretWord).update(payload).digest('hex');
  }

  private assertWebhookSignature(body: Record<string, unknown>) {
    const supplied =
      this.asString(body.HASH) ||
      this.asString(body.hash) ||
      this.asString(body.SIGNATURE) ||
      this.asString(body.signature);
    if (!supplied) {
      throw new UnauthorizedException('2Checkout webhook signature is missing.');
    }

    const secretKey =
      process.env.TWOCHECKOUT_SECRET_KEY?.trim() ||
      process.env.TWOCHECKOUT_SECRET_WORD?.trim();
    if (!secretKey) {
      throw new ServiceUnavailableException('2Checkout webhook secret is not configured.');
    }

    const candidates = [
      this.signWebhookPayload(body, secretKey, 'sha256'),
      this.signWebhookPayload(body, secretKey, 'md5'),
    ];
    const valid = candidates.some((candidate) => this.safeEqual(candidate, supplied));
    if (!valid) {
      this.logger.warn('Rejected 2Checkout webhook with invalid signature.');
      throw new UnauthorizedException('Invalid 2Checkout webhook signature.');
    }
  }

  private signWebhookPayload(body: Record<string, unknown>, secretKey: string, algorithm: 'sha256' | 'md5') {
    const payload = Object.entries(body)
      .filter(([key]) => !['HASH', 'hash', 'SIGNATURE', 'signature'].includes(key))
      .map(([, value]) => {
        const normalized = this.asString(value);
        return `${Buffer.byteLength(normalized, 'utf8')}${normalized}`;
      })
      .join('');

    if (algorithm === 'md5') {
      return createHmac('md5', secretKey).update(payload).digest('hex').toUpperCase();
    }
    return createHmac('sha256', secretKey).update(payload).digest('hex').toUpperCase();
  }

  private computeIpnResponseHash(body: Record<string, unknown>) {
    const secretKey =
      process.env.TWOCHECKOUT_SECRET_KEY?.trim() ||
      process.env.TWOCHECKOUT_SECRET_WORD?.trim() ||
      '';
    const date = this.asString(body.IPN_DATE) || this.asString(body.date) || '';
    const refNo = this.asString(body.REFNO) || this.asString(body.sale_id) || '';
    return createHmac('md5', secretKey)
      .update(`${Buffer.byteLength(date)}${date}${Buffer.byteLength(refNo)}${refNo}`)
      .digest('hex')
      .toUpperCase();
  }

  private normalizeStatus(body: Record<string, unknown>) {
    const value = [
      body.invoice_status,
      body.ORDERSTATUS,
      body.STATUS,
      body.status,
      body.message_type,
      body.MESSAGE_TYPE,
    ]
      .map((item) => this.asString(item).toLowerCase())
      .find(Boolean) ?? '';

    if (value.includes('refund')) {
      return PaymentStatus.Refunded;
    }
    if (value.includes('complete') || value.includes('approved') || value.includes('deposited')) {
      return PaymentStatus.Paid;
    }
    if (value.includes('declined') || value.includes('failed') || value.includes('chargeback')) {
      return PaymentStatus.Failed;
    }
    if (value.includes('cancel')) {
      return PaymentStatus.Cancelled;
    }
    return PaymentStatus.Pending;
  }

  private publicBaseUrl() {
    const configured =
      process.env.PAYMENT_PUBLIC_BASE_URL ??
      process.env.BACKEND_PUBLIC_URL ??
      process.env.VERCEL_URL ??
      'https://opti-zenqor-social-backend.vercel.app';
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

  private safeEqual(left: string, right: string) {
    const leftBuffer = Buffer.from(left.toUpperCase());
    const rightBuffer = Buffer.from(right.toUpperCase());
    return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
  }

  private hashPayload(body: Record<string, unknown>) {
    return createHmac('sha256', 'payment-event').update(JSON.stringify(body)).digest('hex');
  }

  private redact(params: Record<string, string>) {
    return Object.fromEntries(
      Object.entries(params).map(([key, value]) => [
        key,
        key.toLowerCase().includes('signature') ? '[redacted]' : value,
      ]),
    );
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
