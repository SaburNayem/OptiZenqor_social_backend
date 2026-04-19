# OptiZenqor Social Backend Documentation

## Overview

This backend is a NestJS API built for two client applications:

- `OptiZenqor_social` Flutter mobile app
- `OptiZenqor_social_dashboard` React/Vite admin dashboard

The API is modeled directly from the features, route names, mock models, and admin data found in those two repos. At the current stage, the backend is feature-rich and integration-friendly, but it is still seeded in-memory rather than fully persistent.

This means:

- the route surface is broad enough for frontend integration
- JSON responses are shaped around the app and dashboard code
- Swagger is available for testing
- data resets when the server restarts

## Tech Stack

- NestJS
- TypeScript
- Express platform
- Swagger / OpenAPI

## Current Project Structure

```text
src/
  app.module.ts
  main.ts
  controllers/
  data/
README.md
BACKEND_DOCUMENTATION.md
```

### Bootstrap files

- `src/main.ts`: app bootstrap, CORS, Swagger setup, server binding
- `src/app.module.ts`: controller/provider registration

### Data layer

The backend currently uses seeded services instead of a database:

- `platform-data.service.ts`
- `ecosystem-data.service.ts`
- `extended-data.service.ts`
- `admin-ops-data.service.ts`

These services act like temporary repositories and domain stores.

## Run the Backend

```powershell
npm.cmd install --include=dev
npm.cmd run start:dev
```

Default URLs:

- API root: `http://localhost:3000/`
- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/docs-json`

If port `3000` is busy:

```powershell
$env:PORT=3001; npm.cmd run start:dev
```

## Runtime Behavior

- `/` redirects to `/docs`
- `/health` returns server health metadata
- all data is in-memory
- no JWT, database, queue, or object storage is active yet

## Architecture Summary

The backend is grouped into four practical layers:

1. App foundation
2. User-facing product APIs
3. Realtime and communication APIs
4. Admin and operations APIs

## App Foundation APIs

These APIs control startup, onboarding, app config, and general boot behavior.

### App bootstrap

- `GET /app/bootstrap`
- `GET /app/config`
- `POST /app/session-init`

Used for:

- splash route decision
- remote config
- force update checks
- maintenance mode
- locale bootstrap
- session bootstrap

### Onboarding

- `GET /onboarding/slides`
- `GET /onboarding/state`
- `GET /onboarding/interests`
- `POST /onboarding/complete`

Used for:

- first launch flow
- onboarding completion tracking
- interest selection
- suggested entities after signup

### Health and documentation

- `GET /`
- `GET /health`
- `GET /docs`
- `GET /docs-json`

## Authentication and Account APIs

### User auth

- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`

### OTP and verification support

- `POST /auth/send-otp`
- `POST /auth/resend-otp`
- `POST /auth/verify-otp`

These support:

- email OTP
- phone OTP
- forgot-password verification
- OTP resend cooldown behavior

### Users

- `GET /users`
- `GET /users/:id`
- `PATCH /users/:id/follow`
- `PATCH /users/:id/block`

These cover:

- profile lookup
- social graph actions
- basic block/follow behavior

## Content and Feed APIs

### Feed and posts

- `GET /feed`
- `GET /posts`
- `GET /posts/:id`
- `POST /posts`
- `PATCH /posts/:id/like`

### Post detail

- `GET /posts/:id/detail`
- `PATCH /posts/:id/detail`
- `DELETE /posts/:id/detail`
- `GET /posts/:id/comments`
- `POST /posts/:id/comments`

These support:

- single post screen
- engagement summary
- comment thread loading
- post update/delete placeholders

### Stories

- `GET /stories`
- `POST /stories`

### Reels

- `GET /reels`
- `POST /reels`

## Creator Flow APIs

These APIs support the creation pipeline around drafts, scheduling, and uploads.

### Drafts and scheduling

- `GET /drafts`
- `POST /drafts`
- `PATCH /drafts/:id`
- `DELETE /drafts/:id`
- `GET /scheduling`

### Upload manager

- `GET /upload-manager`
- `PATCH /upload-manager/:id`

Supports:

- upload queue
- retry/cancel/pause mock actions
- scheduled content preview
- draft editing state

## Discovery and Saved Content APIs

### Discovery

- `GET /hashtags`
- `GET /trending`
- `GET /search?q=`
- `GET /recommendations`

Supports:

- hashtags
- trending items
- discovery search
- suggested users/pages
- discover recommendation blocks
- feed ranking input placeholders

### Bookmarks and saved collections

- `GET /bookmarks`
- `GET /saved-collections`
- `POST /saved-collections`
- `PATCH /saved-collections`
- `PATCH /saved-collections/:id`
- `DELETE /saved-collections/:id`

Supports:

- collection creation
- rename/update
- privacy update
- moving or adding items
- delete collection

## Communities, Pages, and Groups APIs

- `GET /communities`
- `GET /communities/:id`
- `GET /pages`
- `GET /pages/:id`
- `GET /groups`

Supports:

- community detail
- page detail
- pinned posts
- community rules
- members and events
- community/public/private flags

## Marketplace APIs

- `GET /marketplace/products`
- `POST /marketplace/products`

Supports:

- listing list/detail-like payloads
- seller info
- listing status
- moderation review status

## Jobs and Professional Profile APIs

### Jobs

- `GET /jobs`
- `GET /jobs/:id`
- `POST /jobs/:id/apply`

### Professional profiles

- `GET /professional-profiles`

Supports:

- business profile
- seller profile
- recruiter profile
- creator metrics/profile summary

## Monetization APIs

### Monetization summary

- `GET /monetization/overview`
- `GET /monetization/wallet`
- `GET /monetization/subscriptions`
- `GET /monetization/plans`

### Wallet and premium

- `GET /wallet-payments`
- `GET /wallet/ledger`
- `GET /subscriptions`
- `GET /premium-membership`
- `GET /invite-referral`

Supports:

- wallet balance
- pending balance
- transactions
- ledger entries
- payout holds
- subscription plans
- premium plan presentation
- referral milestones

## Notifications and Preferences APIs

### Notification delivery and inbox

- `GET /notifications/campaigns`
- `POST /notifications/campaigns`
- `GET /notifications/inbox`

### User notification preferences

- `GET /notification-preferences`
- `PATCH /notification-preferences`

Supports:

- push categories
- email controls
- quiet hours
- per-feature toggles

## Chat, Presence, Calls, and Realtime APIs

### Chat

- `GET /chat/threads`
- `GET /chat/threads/:id`
- `POST /chat/threads/:id/messages`

### Conversation lifecycle

- `PATCH /chat/threads/:id/archive`
- `PATCH /chat/threads/:id/mute`
- `PATCH /chat/threads/:id/pin`
- `PATCH /chat/threads/:id/unread`
- `DELETE /chat/threads/:id/clear`

### Presence and chat preferences

- `GET /chat/presence`
- `GET /chat/preferences`

Supports:

- online/offline flags
- last seen
- typing status
- delivered/read receipt placeholders
- archive/mute/pin/unread state

### Group chat, calls, and live

- `GET /group-chat`
- `GET /calls`
- `GET /live-stream`
- `GET /socket/contract`

Supports:

- group chat metadata
- call history
- live session placeholder data
- declared socket event contract

## Support, Safety, Legal, and Security APIs

### Support

- `GET /support/faqs`
- `GET /support/tickets`
- `POST /support/tickets`
- `GET /support/chat`

Supports:

- FAQ content
- ticket list
- ticket creation
- support chat thread preview

### Safety

- `GET /safety/config`

Supports:

- report categories
- moderation reasons
- blocked users
- hidden posts
- muted users/pages/chats

### Legal and compliance

- `GET /legal/consents`
- `PATCH /legal/consents`
- `POST /legal/account-deletion`
- `POST /legal/data-export`

Supports:

- terms acceptance
- privacy acceptance
- consent logs
- deletion requests
- export requests

### Security

- `GET /security/state`
- `POST /security/logout-all`

Supports:

- active sessions
- login history
- trusted devices
- suspicious login flags

## Admin Core APIs

These APIs support the dashboard’s high-level screens and summary views.

- `GET /admin/dashboard`
- `GET /admin/users`
- `GET /admin/content`
- `GET /admin/reports`
- `GET /admin/chat-cases`
- `GET /admin/events`
- `GET /admin/monetization`
- `GET /admin/notifications`
- `GET /admin/analytics`
- `GET /admin/roles`
- `GET /admin/settings`
- `GET /admin/audit-logs`

These map directly to the dashboard menu and summary panels.

## Admin Operations APIs

These are the explicit admin-side operational modules beyond generic dashboard summaries.

### Admin auth and admin sessions

- `POST /admin/auth/login`
- `GET /admin/auth/sessions`
- `PATCH /admin/auth/sessions/:id/revoke`

### Verification and review queue

- `GET /admin/verification-queue`
- `PATCH /admin/verification-queue/:id`

Supports:

- verification requests
- review queue
- approve/reject decision
- notes/history

### Moderation cases

- `GET /admin/moderation-cases`
- `PATCH /admin/moderation-cases/:id`

Supports:

- severity
- evidence
- target type
- action trail
- enforcement updates

### Chat control

- `GET /admin/chat-control`
- `PATCH /admin/chat-control/:id`

Supports:

- flagged threads
- frozen conversations
- restricted participants
- evidence snapshots

### Broadcast campaigns and segmentation

- `GET /admin/broadcast-campaigns`
- `POST /admin/broadcast-campaigns`
- `GET /admin/audience-segments`

Supports:

- campaign drafts
- schedule targeting
- audience segment rules
- delivery/open-rate summaries

### Analytics pipeline

- `GET /admin/analytics-pipeline`

Supports:

- KPI snapshots
- trend comparison
- leaderboard generation
- export job placeholders

### RBAC and permissions

- `GET /admin/rbac`

Supports:

- role templates
- permission matrix
- module scopes
- action-level access design

### Operational settings

- `GET /admin/operational-settings`
- `PATCH /admin/operational-settings`

Supports:

- safety defaults
- maintenance mode
- maintenance banner
- storage retention
- campaign throttling
- remote config version

### Audit system

- `GET /admin/audit-log-system`

### Content operations by type

- `GET /admin/content-operations`

Supports separate moderation views for:

- posts
- reels
- stories
- comments

### Commerce risk

- `GET /admin/commerce-risk`

Supports:

- disputes
- refund abuse review
- payout review
- risk holds

### Admin support operations

- `GET /admin/support-operations`

Supports:

- support ticket ops
- escalation notes
- support actions
- support operational trail

## Master Data APIs

- `GET /master-data`

This currently returns seeded reference data such as:

- feelings
- music
- subscription plans
- premium plans
- job categories
- marketplace categories
- event categories
- countries
- cities
- FAQ categories

## Swagger Tags

The API is grouped in Swagger by real controller tags rather than fake static tags.

Current tag families include:

- `bootstrap`
- `auth`
- `onboarding`
- `users`
- `content`
- `post-detail`
- `creator-flow`
- `account-ops`
- `chat`
- `events`
- `discovery`
- `communities`
- `jobs`
- `engagement`
- `support`
- `realtime`
- `marketplace`
- `monetization`
- `notifications`
- `admin`
- `admin-ops`

## Data Characteristics

At this stage, the backend is:

- deterministic
- mock/seed driven
- frontend integration friendly
- not persistent

It is not yet:

- database-backed
- JWT-protected
- file-upload enabled
- queue-driven
- socket-gateway powered in production

## Known Gaps

The route surface is broad, but the following are still placeholder-grade rather than full production implementations:

- persistent database modeling
- JWT auth and guards
- role/permission enforcement middleware
- media upload storage
- live WebSocket delivery
- WebRTC signaling server behavior
- async background jobs
- export file generation
- CMS authoring UI/backend workflows
- payment gateway integration

## Recommended Next Production Steps

1. Add Prisma with PostgreSQL
2. Replace seeded services with modules/repositories
3. Add JWT auth for user and admin auth flows
4. Add RBAC guards for admin routes
5. Add storage service for uploads
6. Add WebSocket gateways for chat, notifications, and live presence
7. Add BullMQ or a queue system for analytics exports, moderation jobs, and campaigns
8. Add request validation DTOs and response DTOs across all modules
9. Add automated tests for critical route groups
10. Add environment-based config management

## Status Summary

The backend now functions as a broad feature contract for both the mobile app and the admin dashboard. It is suitable for:

- frontend integration
- Swagger exploration
- API contract review
- seeded demos
- backend planning

It is not yet the final production implementation, but it is now a comprehensive backend reference for the current project.
