# Backend Frontend Endpoint Mismatch Report

Last updated: 2026-04-30

This report compares the current frontend endpoint contract in `../OptiZenqor_social/lib/core/data/api/api_end_points.dart` with the current backend implementation status in `Socity_backend`.

## Confirmed Aligned or Improved

| Frontend Endpoint | Backend Status | Notes |
| --- | --- | --- |
| `POST /auth/login` | Exists | Backend auth remains active and now uses argon2-backed password hashing with legacy hash upgrade on login. |
| `POST /auth/signup` | Exists | Contract remains available. |
| `POST /auth/refresh-token` | Exists | Contract remains available. |
| `POST /auth/logout` | Exists | Contract remains available. |
| `GET /auth/me` | Exists | Contract remains available. |
| `GET /health` | Exists | Now returns consistent `success/message/data` wrapper. |
| `GET /health/database` | Exists | Now returns consistent `success/message/data` wrapper. |
| `GET /account-switching` | Exists | Now DB-backed and user-scoped. |
| `GET /activity-sessions` | Exists | Now DB-backed and user-scoped. |
| `POST /verification-request/submit` | Exists | Now DB-backed and validated. |
| `GET /group-chat` | Exists | Now derived from DB-backed chat threads for authenticated users. |
| `GET /group-chat/:id` | Exists | Now derived from DB-backed chat threads. |
| `GET /calls` | Exists | Frontend calls repository now uses this endpoint instead of local mock state. |
| `GET /calls/:id` | Exists | Returns active/persisted call session payload. |
| `POST /calls/sessions` | Exists | Authenticated call session creation path is active. |
| `PATCH /calls/sessions/:id/end` | Exists | Authenticated call session end path is active. |
| `GET /chat/preferences` | Exists | Now DB-backed through durable chat preference tables. |
| `PATCH/POST /chat/threads/:id/archive` | Exists | Now persisted per user in PostgreSQL. |
| `PATCH/POST /chat/threads/:id/mute` | Exists | Now persisted per user in PostgreSQL. |
| `PATCH/POST /chat/threads/:id/pin` | Exists | Now persisted per user in PostgreSQL. |
| `GET /live-stream` | Exists | Now reads durable PostgreSQL live stream sessions. |
| `GET /live-stream/setup` | Exists | Now resolves authenticated DB-backed setup payloads. |
| `GET /live-stream/studio` | Exists | Now resolves authenticated DB-backed studio payloads. |
| `GET/POST /live-stream/:id/comments` | Exists | Now persisted in PostgreSQL. |
| `GET/POST /live-stream/:id/reactions` | Exists | Now persisted in PostgreSQL. |
| `GET /archive/posts` | Exists | Now reads user-scoped archived post state from PostgreSQL. |
| `GET /archive/stories` | Exists | Now reads user-scoped archived story state from PostgreSQL. |
| `GET /archive/reels` | Exists | Now reads user-scoped archived reel state from PostgreSQL. |
| `GET /hide/posts/all` | Exists | Now reads user-scoped hidden post state from PostgreSQL. |
| `GET /hidden-posts` | Exists | Now reads user-scoped hidden post state from PostgreSQL. |
| `POST /group-chat` | Exists | Group chat creation is now database-backed. |
| `PATCH /group-chat/:id` | Exists | Group rename/update is now database-backed. |
| `DELETE /group-chat/:id` | Exists | Group delete is now database-backed. |
| `POST /group-chat/:id/members` | Exists | Member add is now database-backed with persisted roles. |
| `DELETE /group-chat/:id/members/:userId` | Exists | Member removal is now database-backed. |
| `PATCH /group-chat/:id/members/:userId/role` | Exists | Member role updates are now database-backed. |
| `POST /subscriptions/change-plan` | Exists | Frontend subscription selection can now persist to backend. |
| `POST /subscriptions/cancel` | Exists | Durable cancel route is now available. |
| `POST /subscriptions/renew` | Exists | Durable renew route is now available. |

## Still Mixed or Not Fully Durable

| Frontend Endpoint Area | Backend Route Status | Mismatch Type | Notes |
| --- | --- | --- | --- |
| `/support/faqs`, `/support-help`, `/support-help/faq`, `/support-help/chat`, `/support-help/mail`, `/support/tickets` | Exists | Remaining config-only mail metadata | Backend support flow is now Prisma-backed for FAQs, tickets, conversations, and messages, and the Flutter help flow now reads the backend. Remaining non-DB portion is contact/escalation mail config, which is environment-backed configuration rather than relational app data. |
| `/trending`, `/hashtags`, `/global-search`, `/search-discovery` | Exists | Derived ranking gap | Routes now return standardized wrappers and the Flutter trending repository uses backend data, but ranking is still derived from existing DB-backed entities instead of dedicated persisted discovery datasets/materialized ranking tables. Files: `src/controllers/discovery.controller.ts`, `src/services/discovery-database.service.ts`, `prisma/schema.prisma`. |
| `/marketplace` detail/checkout/products | Exists | Frontend fallback mismatch | Backend marketplace routes are available, but frontend repository still falls back silently and derives sellers/categories/chat locally when payloads are incomplete. Files: `src/controllers/marketplace.controller.ts`, `../OptiZenqor_social/lib/feature/marketplace/repository/marketplace_repository.dart`. |
| `/admin/*` and `/admin/auth/*` | Exists | Static/mock/in-memory | Admin dashboard, reports, moderation, audit, and demo auth/session flows still depend on `PlatformDataService` and `AdminOpsDataService`, including seeded demo accounts and non-durable admin session state. Files: `src/controllers/admin.controller.ts`, `src/controllers/admin-ops.controller.ts`, `src/data/platform-data.service.ts`, `src/data/admin-ops-data.service.ts`, `prisma/schema.prisma`. |
| `/onboarding/*` | Exists | Persistence mismatch | Routes are still part of the broader utility migration set. |
| `/live-stream` lifecycle mutations beyond comments/reactions | Partial | Capability gap | Durable reads, comments, and reactions are live, but the start/end/studio moderation workflow is still not a full mobile CRUD slice. |
| `/hide/*` for non-post targets | Partial | Capability gap | Post hide/unhide is durable; other target types still need end-to-end mobile coverage. |

## Backend-Only Hardening Completed

- Runtime startup seeding has been removed from the core auth/social and monetization service paths.
- Demo/test account listing is now disabled by default and only available when `AUTH_EXPOSE_TEST_ACCOUNTS=true`.
- Error responses now follow the required `success/message/error/statusCode` shape.
- `.env.example` documents the new auth test-account toggle and no longer advertises runtime seed behavior.
- A dev-only seed flow now exists through `npm run seed:dev`.

## Frontend Integration Changes Completed

- `../OptiZenqor_social/lib/feature/calls/repository/calls_repository.dart`
  - Replaced local in-repo call history with authenticated backend reads/writes.
- `../OptiZenqor_social/lib/feature/group_chat/repository/group_chat_repository.dart`
  - Replaced backend-placeholder mutation behavior with live group create/member API calls.
- `../OptiZenqor_social/lib/feature/subscriptions/repository/subscriptions_repository.dart`
  - Replaced local active-plan-only persistence with backend subscription plan mutation calls.
- `../OptiZenqor_social/lib/feature/wallet_payments/repository/wallet_payments_repository.dart`
  - Removed fake wallet balances and transaction history from shipped flows.
- `../OptiZenqor_social/lib/feature/safety_privacy/repository/safety_privacy_repository.dart`
  - Removed local-only persistence and now reads/writes safety state through backend endpoints.
- `../OptiZenqor_social/lib/feature/calls/controller/calls_controller.dart`
  - Added async loading and backend error state handling.
- `../OptiZenqor_social/lib/feature/calls/screen/calls_screen.dart`
  - Added loading, error, and empty states instead of assuming local data.

## Highest Priority Remaining Work

1. Replace support/help static helpers with Prisma-backed FAQs, tickets, conversations, and messages, then wire the Flutter support flow to backend data.
2. Remove hardcoded Flutter trending data and align `/trending` and `/hashtags` on the backend with durable/derived DB-backed queries only.
3. Eliminate remaining marketplace fallback branches so seller, category, offer, and chat state does not silently degrade to local derivation.
4. Replace `src/data/*` admin and moderation dashboard sources with durable admin/session/audit/moderation persistence.
5. Finish the remaining live-stream lifecycle and non-post hide/archive flows.
