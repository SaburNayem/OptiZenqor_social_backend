# Socity Backend

NestJS backend API for the `OptiZenqor_social` mobile app and the `OptiZenqor_social_dashboard` admin panel.

## What is included

- Auth endpoints for login, signup, forgot password, and reset password
- User APIs for profile lookup plus follow and block actions
- Social content APIs for feed, posts, stories, and reels
- Chat APIs for threads and sending messages
- Events, marketplace, monetization, and notification campaign APIs
- Admin APIs for dashboard stats, users, content, reports, analytics, roles, settings, and audit logs
- Seeded in-memory data derived from the referenced frontend repos so both clients can integrate immediately

## Run

```bash
npm run start:dev
```

The server runs on `http://localhost:3000` by default.
Swagger UI is available at `http://localhost:3000/docs`.
Raw OpenAPI JSON is available at `http://localhost:3000/docs-json`.

## Email OTP Setup

To send real 6-digit verification codes by email, add SMTP settings to `.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hossennayem099@gmail.com
SMTP_PASS=YOUR_GMAIL_APP_PASSWORD
SMTP_FROM=hossennayem099@gmail.com
SMTP_SECURE=false
```

Notes:

- For Gmail, use an App Password instead of your normal Gmail password.
- Without SMTP settings, the backend falls back to development mode and does not send a real email.

## Main routes

```text
GET    /health
GET    /app/bootstrap
GET    /app/config
POST   /app/session-init

GET    /onboarding/slides
GET    /onboarding/state
GET    /onboarding/interests
POST   /onboarding/complete

POST   /auth/login
POST   /auth/signup
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/send-otp
POST   /auth/resend-otp
POST   /auth/verify-otp
GET    /auth/demo-accounts
POST   /auth/verify-email/confirm
GET    /auth/me

GET    /users
GET    /users/:id
PATCH  /users/:id/follow
PATCH  /users/:id/block

GET    /feed
GET    /posts
GET    /posts/:id
POST   /posts
PATCH  /posts/:id/like
GET    /posts/:id/detail
PATCH  /posts/:id/detail
DELETE /posts/:id/detail
GET    /posts/:id/comments
POST   /posts/:id/comments
GET    /stories
POST   /stories
GET    /reels
POST   /reels

GET    /drafts
POST   /drafts
PATCH  /drafts/:id
DELETE /drafts/:id
GET    /scheduling
GET    /upload-manager
PATCH  /upload-manager/:id

GET    /chat/threads
GET    /chat/threads/:id
POST   /chat/threads/:id/messages
PATCH  /chat/threads/:id/archive
PATCH  /chat/threads/:id/mute
PATCH  /chat/threads/:id/pin
PATCH  /chat/threads/:id/unread
DELETE /chat/threads/:id/clear
GET    /chat/presence
GET    /chat/preferences

GET    /events
POST   /events

GET    /marketplace/products
POST   /marketplace/products

GET    /monetization/overview
GET    /monetization/wallet
GET    /monetization/subscriptions
GET    /monetization/plans

GET    /notifications/campaigns
POST   /notifications/campaigns
GET    /notifications/inbox

GET    /hashtags
GET    /trending
GET    /search?q=
GET    /bookmarks
GET    /saved-collections
POST   /saved-collections
PATCH  /saved-collections
PATCH  /saved-collections/:id
DELETE /saved-collections/:id

GET    /communities
GET    /communities/:id
GET    /pages
GET    /pages/:id
GET    /groups

GET    /jobs
GET    /jobs/:id
POST   /jobs/:id/apply
GET    /professional-profiles

GET    /invite-referral
GET    /premium-membership
GET    /wallet-payments
GET    /subscriptions
GET    /wallet/ledger

GET    /recommendations
GET    /notification-preferences
PATCH  /notification-preferences
GET    /settings/sections
GET    /safety/config
GET    /support/faqs
GET    /support/tickets
POST   /support/tickets
GET    /support/chat

GET    /group-chat
GET    /calls
GET    /live-stream
GET    /socket/contract

GET    /master-data
GET    /legal/consents
PATCH  /legal/consents
POST   /legal/account-deletion
POST   /legal/data-export
GET    /security/state
POST   /security/logout-all

GET    /admin/dashboard
POST   /admin/auth/login
GET    /admin/auth/demo-accounts
GET    /admin/auth/me
GET    /admin/auth/sessions
PATCH  /admin/auth/sessions/:id/revoke
GET    /admin/users
GET    /admin/verification-queue
PATCH  /admin/verification-queue/:id
GET    /admin/content
GET    /admin/content-operations
GET    /admin/reports
GET    /admin/moderation-cases
PATCH  /admin/moderation-cases/:id
GET    /admin/chat-cases
GET    /admin/chat-control
PATCH  /admin/chat-control/:id
GET    /admin/events
GET    /admin/monetization
GET    /admin/commerce-risk
GET    /admin/notifications
GET    /admin/broadcast-campaigns
POST   /admin/broadcast-campaigns
GET    /admin/audience-segments
GET    /admin/analytics
GET    /admin/analytics-pipeline
GET    /admin/roles
GET    /admin/rbac
GET    /admin/settings
GET    /admin/operational-settings
PATCH  /admin/operational-settings
GET    /admin/audit-logs
GET    /admin/audit-log-system
GET    /admin/support-operations
```

## Notes

- This first backend pass uses in-memory seeded data, so it is frontend-ready for integration and demos but not yet persistent.
- The next production step would be adding a database layer, JWT auth, file uploads, and socket gateways for chat/live updates.
