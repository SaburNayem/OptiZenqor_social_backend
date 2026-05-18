# OptiZenqor Social Backend

NestJS backend API for the Flutter app `OptiZenqor_social`.

This repo is in active migration from older seeded/static demo flows to a real `Prisma + PostgreSQL` backend. The goal is for Flutter to use the backend as the single source of truth, with no runtime mock or in-memory state for production features.

## Current state

Database-backed now:

- auth sessions and OTP codes
- users and profile basics
- follows
- posts, comments, replies, reactions
- stories, story comments, reactions, views
- reels, reel comments, reactions
- uploads metadata
- notifications inbox and read state
- bookmarks, reports, blocks
- settings and privacy state
- drafts and scheduled posts
- marketplace products and orders
- marketplace drafts, seller follows, chat, and offers
- jobs and job applications
- events and RSVPs
- communities, members, pages, page follows
- wallet accounts and wallet transactions
- premium plans, subscriptions, notification campaigns
- support FAQs, tickets, conversations, and messages
- chat preferences and chat thread archive/mute/pin state
- hidden posts and archived post/story/reel state
- live stream sessions, comments, and reactions
- call sessions and call signals
- payment orders, payment records, and gateway webhook/IPN logs
- admin users and admin sessions
- moderation cases and admin audit logs
- admin operational settings

Persisted discovery datasets now exist for:

- `trending` entries
- `hashtags` entries

Still partially or fully static/mock-backed:

- some support/help utility surfaces beyond the now-durable FAQs, tickets, and conversations
- some accessibility/localization/preference helper surfaces
- some admin analytics/configuration surfaces are still derived summaries rather than full CRUD modules
- advanced moderation workflows beyond the new persisted case/audit baseline
- push device registration routes are not exposed yet even though persistence tables now exist

## Main backend rules

- PostgreSQL is the source of truth for production data.
- Seed data is allowed only through the optional development seed script, not runtime startup.
- Existing mobile route names are kept where possible.
- Responses should follow `{ success, message, data }` with compatibility aliases where Flutter still needs them.

## Run locally

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run typecheck
npm run seed:dev
npm run start:dev
```

Server defaults:

- API: `http://localhost:3000`
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`

## Environment

Copy `.env.example` to `.env` and set at minimum:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/socity_backend?sslmode=disable
JWT_SECRET=replace_with_long_random_secret
JWT_REFRESH_SECRET=replace_with_long_random_refresh_secret
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM=no-reply@example.com
```

Optional but recommended:

- Cloudinary or S3 storage credentials
- CORS origins
- frontend URLs
- rate-limit configuration
- `ADMIN_BOOTSTRAP_EMAIL`, `ADMIN_BOOTSTRAP_PASSWORD`, `ADMIN_BOOTSTRAP_NAME`, and `ADMIN_BOOTSTRAP_ROLE` for a permanent admin panel account
- `ADMIN_BOOTSTRAP_FORCE_SYNC=true` only when you want startup to reset that admin's password/name/role from `.env`
- `AUTH_EXPOSE_TEST_ACCOUNTS=true` only for controlled local QA if `/auth/demo-accounts` is explicitly needed
- support contact configuration for `/support-help/mail`

Role model:

- app users: `user`, `creator`, `business`
- admin panel users: `admin`, `superadmin`
- `creator` can create pages and communities
- `business` can create marketplace products, jobs, and communities
- regular users can still create normal group chats
- `superadmin` can manage and remove `admin` accounts through the admin staff routes

## Vercel setup

This backend repo is already linked to a Vercel project. To connect both your web app and admin dashboard to it, add the production URLs in the backend Vercel dashboard so CORS and Swagger use the right hosts.

Set these environment variables in the backend Vercel project:

```env
DATABASE_URL=your_pooled_postgres_url
DIRECT_URL=your_direct_postgres_url
JWT_SECRET=replace_with_long_random_secret
JWT_REFRESH_SECRET=replace_with_long_random_refresh_secret
VERCEL_URL=your-backend-project.vercel.app
FRONTEND_URL=https://your-web-project.vercel.app
CLIENT_URL=https://your-dashboard-project.vercel.app
WEB_FRONTEND_URL=https://your-web-project.vercel.app
DASHBOARD_URL=https://your-dashboard-project.vercel.app
CORS_ORIGIN=https://your-web-project.vercel.app
CORS_ORIGINS=https://your-web-project.vercel.app,https://your-dashboard-project.vercel.app,https://your-backend-project.vercel.app
```

Use these values in your frontend Vercel projects:

- Web app API base URL: `https://your-backend-project.vercel.app`
- Dashboard API base URL: `https://your-backend-project.vercel.app`
- Web Swagger/docs URL: `https://your-backend-project.vercel.app/docs`
- Health check: `https://your-backend-project.vercel.app/health`

If you deploy preview environments for web or dashboard, either add their preview domains to `CORS_ORIGINS` or keep the built-in `*.vercel.app` fallback enabled.

## Key routes

System:

- `GET /health`
- `GET /app/bootstrap`
- `GET /app/config`
- `POST /app/session-init`

Auth:

- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/send-otp`
- `POST /auth/resend-otp`
- `POST /auth/verify-otp`
- `POST /auth/verify-email/confirm`

Content:

- `GET /feed`
- `GET /posts`
- `POST /posts`
- `GET /stories`
- `POST /stories`
- `GET /reels`
- `POST /reels`
- `GET /chat/threads`
- `GET /chat/threads/:id/messages`
- `POST /chat/threads/:id/messages`

Experience:

- `GET /marketplace/products`
- supports `page`, `limit`, `search`, `category`, `status`, `sellerId`, `sort`, `order`
- `POST /marketplace/products`
- `POST /marketplace/checkout`

Payments:

- `POST /payments/create`
- `POST /payments/sslcommerz/ipn`
- `POST /payments/2checkout/webhook`
- `GET /payments/success`
- `GET /payments/fail`
- `GET /payments/cancel`
- `GET /payments/:id/status`

## Payment Setup

The payment system is backend-owned. React and Flutter never receive gateway secrets; they only call `POST /payments/create` and open the returned `checkoutUrl`.

Supported gateways:

- Bangladesh/local payments: SSLCommerz for bKash, Nagad, Rocket, local cards
- Global cards: 2Checkout / Verifone hosted checkout

Backend environment:

```env
PAYMENT_PUBLIC_BASE_URL=https://your-backend.example.com
PAYMENT_FRONTEND_RETURN_URL=https://your-web.example.com
SSLCOMMERZ_SANDBOX=true
SSLCOMMERZ_STORE_ID=your_sslcommerz_store_id
SSLCOMMERZ_STORE_PASSWORD=your_sslcommerz_store_password
TWOCHECKOUT_SANDBOX=true
TWOCHECKOUT_MERCHANT_CODE=your_2checkout_merchant_code
TWOCHECKOUT_SECRET_WORD=your_2checkout_buy_link_secret_word
TWOCHECKOUT_SECRET_KEY=your_2checkout_ipn_secret_key
TWOCHECKOUT_CHECKOUT_URL=https://secure.2checkout.com/checkout/buy
```

Database:

```bash
npm run prisma:generate
npm run prisma:migrate
```

Flow:

1. App or web sends `POST /payments/create` with amount, currency, item details, and customer info.
2. Backend chooses gateway automatically: `BDT` or `region=local` uses SSLCommerz, otherwise 2Checkout.
3. Backend creates `Order` and `Payment` with `PENDING` status.
4. Backend returns `checkoutUrl`.
5. Frontend opens the checkout URL.
6. Gateway sends IPN/webhook to backend.
7. Backend verifies signature/validation API, amount, currency, gateway transaction ID, and order ID.
8. Backend marks the payment `PAID`, `FAILED`, `CANCELLED`, or `REFUNDED` and stores the raw event in `payment_events`.

Webhook URLs to configure in gateway dashboards:

- SSLCommerz IPN: `https://your-backend.example.com/payments/sslcommerz/ipn`
- 2Checkout webhook/IPN: `https://your-backend.example.com/payments/2checkout/webhook`

Example request:

```bash
curl -X POST "$API_URL/payments/create" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "itemType": "premium_plan",
    "itemId": "monthly",
    "title": "Premium monthly plan",
    "amount": 499,
    "currency": "BDT",
    "region": "local",
    "customer": {
      "name": "Sabur",
      "email": "customer@example.com",
      "phone": "+8801700000000",
      "city": "Dhaka",
      "country": "Bangladesh"
    }
  }'
```
- `GET /marketplace/drafts`
- `POST /marketplace/drafts`
- `PATCH /marketplace/drafts/:id`
- `DELETE /marketplace/drafts/:id`
- `GET /marketplace/seller-follows`
- `POST /marketplace/sellers/:sellerId/follow`
- `DELETE /marketplace/sellers/:sellerId/follow`
- `GET /marketplace/products/:id/chat`
- `POST /marketplace/products/:id/chat/messages`
- `GET /marketplace/products/:id/offers`
- `POST /marketplace/products/:id/offers`
- `PATCH /marketplace/offers/:id`
- `GET /jobs`
- supports `page`, `limit`, `search`, `status`, `type`, `userId`, `sort`, `order`
- `POST /jobs/create`
- `POST /jobs/:id/apply`
- `GET /events`
- supports `page`, `limit`, `search`, `status`, `category`, `userId`, `sort`, `order`
- `POST /events`
- `PATCH /events/:id/rsvp`
- `GET /communities`
- supports `page`, `limit`, `search`, `category`, `privacy`, `userId`, `sort`, `order`
- `POST /communities`
- `GET /pages`
- supports `page`, `limit`, `search`, `category`, `ownerId`, `sort`, `order`
- `POST /pages/create`

Support and discovery:

- `GET /support/faqs`
- `GET /support/tickets`
- `POST /support/tickets`
- `GET /support-help`
- `GET /support-help/faq`
- `GET /support-help/chat`
- `POST /support-help/chat`
- `GET /support-help/mail`
- `GET /hashtags`
- `POST /hashtags/refresh`
- `GET /trending`
- `POST /trending/refresh`
- `GET /global-search`
- `GET /search-discovery`

Account and settings:

- `GET /bookmarks`
- `GET /drafts`
- `GET /settings/state`
- `PATCH /settings/state`
- `GET /notifications`
- `PATCH /notifications/:id/read`
- `GET /wallet`
- `GET /monetization/overview`
- `GET /premium-plans`

## Documentation files

- [BACKEND_API_CONTRACT.md](g:/My%20Project/Socity_backend/BACKEND_API_CONTRACT.md:1)
- [FLUTTER_BACKEND_CONTRACT.md](g:/My%20Project/Socity_backend/FLUTTER_BACKEND_CONTRACT.md:1)
- [BACKEND_CURL_REFERENCE.md](g:/My%20Project/Socity_backend/BACKEND_CURL_REFERENCE.md:1)
- [FRONTEND_NO_MOCK_DATABASE_DOCUMENTATION.md](g:/My%20Project/Socity_backend/FRONTEND_NO_MOCK_DATABASE_DOCUMENTATION.md:1)
- [BACKEND_STATIC_DATA_CHECKLIST.md](g:/My%20Project/Socity_backend/BACKEND_STATIC_DATA_CHECKLIST.md:1)

## Important note

This backend is no longer accurately described as fully “seeded in-memory”, but it is also not fully production-complete yet. Several major mobile-facing modules are already database-backed, while a remaining set of admin/support/discovery utility flows still needs the same treatment.
