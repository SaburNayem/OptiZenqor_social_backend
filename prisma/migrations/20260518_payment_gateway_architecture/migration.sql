CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');
CREATE TYPE "PaymentGateway" AS ENUM ('SSLCOMMERZ', 'TWO_CHECKOUT');
CREATE TYPE "PaymentCurrency" AS ENUM ('BDT', 'USD', 'EUR', 'GBP');
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'REFUNDED');

CREATE TABLE "payment_orders" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "item_type" TEXT NOT NULL,
  "item_id" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "amount" DECIMAL(12, 2) NOT NULL,
  "currency" "PaymentCurrency" NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payments" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "gateway" "PaymentGateway" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DECIMAL(12, 2) NOT NULL,
  "currency" "PaymentCurrency" NOT NULL,
  "provider_session_id" TEXT,
  "provider_transaction_id" TEXT,
  "checkout_url" TEXT,
  "provider_payload" JSONB NOT NULL DEFAULT '{}',
  "metadata" JSONB NOT NULL DEFAULT '{}',
  "paid_at" TIMESTAMPTZ(6),
  "failed_at" TIMESTAMPTZ(6),
  "cancelled_at" TIMESTAMPTZ(6),
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_events" (
  "id" TEXT NOT NULL,
  "payment_id" TEXT,
  "order_id" TEXT,
  "gateway" "PaymentGateway" NOT NULL,
  "event_type" TEXT NOT NULL,
  "event_id" TEXT,
  "idempotency_key" TEXT NOT NULL,
  "provider_transaction_id" TEXT,
  "status" TEXT NOT NULL DEFAULT 'received',
  "raw_payload" JSONB NOT NULL,
  "headers" JSONB NOT NULL DEFAULT '{}',
  "processing_status" TEXT NOT NULL DEFAULT 'received',
  "error_message" TEXT,
  "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "processed_at" TIMESTAMPTZ(6),
  CONSTRAINT "payment_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "payment_events_idempotency_key_key" ON "payment_events"("idempotency_key");
CREATE INDEX "payment_orders_user_id_created_at_idx" ON "payment_orders"("user_id", "created_at" DESC);
CREATE INDEX "payment_orders_status_created_at_idx" ON "payment_orders"("status", "created_at" DESC);
CREATE INDEX "payments_order_id_idx" ON "payments"("order_id");
CREATE INDEX "payments_user_id_created_at_idx" ON "payments"("user_id", "created_at" DESC);
CREATE INDEX "payments_gateway_status_idx" ON "payments"("gateway", "status");
CREATE INDEX "payments_provider_transaction_id_idx" ON "payments"("provider_transaction_id");
CREATE INDEX "payment_events_payment_id_received_at_idx" ON "payment_events"("payment_id", "received_at" DESC);
CREATE INDEX "payment_events_order_id_received_at_idx" ON "payment_events"("order_id", "received_at" DESC);
CREATE INDEX "payment_events_gateway_event_type_idx" ON "payment_events"("gateway", "event_type");
CREATE INDEX "payment_events_provider_transaction_id_idx" ON "payment_events"("provider_transaction_id");

ALTER TABLE "payment_orders"
  ADD CONSTRAINT "payment_orders_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "payment_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payments"
  ADD CONSTRAINT "payments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "payment_events"
  ADD CONSTRAINT "payment_events_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "payment_events"
  ADD CONSTRAINT "payment_events_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "payment_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
