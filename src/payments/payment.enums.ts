export enum PaymentStatus {
  Pending = 'PENDING',
  Paid = 'PAID',
  Failed = 'FAILED',
  Cancelled = 'CANCELLED',
  Refunded = 'REFUNDED',
}

export enum PaymentGateway {
  SSLCommerz = 'SSLCOMMERZ',
  TwoCheckout = 'TWO_CHECKOUT',
}

export enum PaymentCurrency {
  BDT = 'BDT',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
}

export enum PaymentRegion {
  Local = 'local',
  Global = 'global',
}
