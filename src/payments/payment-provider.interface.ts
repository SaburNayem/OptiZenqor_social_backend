import { PaymentCurrency, PaymentGateway, PaymentStatus } from './payment.enums';

export type PaymentCustomer = {
  name: string;
  email: string;
  phone: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
};

export type CreateCheckoutInput = {
  paymentId: string;
  orderId: string;
  userId: string;
  title: string;
  description?: string;
  amount: number;
  currency: PaymentCurrency;
  customer: PaymentCustomer;
  metadata?: Record<string, unknown>;
};

export type CheckoutSession = {
  checkoutUrl: string;
  providerSessionId?: string;
  providerTransactionId?: string;
  rawPayload: Record<string, unknown>;
};

export type WebhookInput = {
  body: Record<string, unknown>;
  headers: Record<string, unknown>;
};

export type ProviderValidationResult = {
  gateway: PaymentGateway;
  eventType: string;
  eventId: string;
  status: PaymentStatus;
  orderId?: string;
  paymentId?: string;
  providerTransactionId?: string;
  amount?: number;
  currency?: PaymentCurrency;
  verified: boolean;
  rawPayload: Record<string, unknown>;
  responseBody?: string;
};

export interface PaymentProvider {
  readonly gateway: PaymentGateway;
  createCheckoutSession(input: CreateCheckoutInput): Promise<CheckoutSession>;
  validateWebhook(input: WebhookInput): Promise<ProviderValidationResult>;
}
