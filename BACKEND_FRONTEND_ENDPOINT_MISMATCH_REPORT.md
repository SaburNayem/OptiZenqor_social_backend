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
| `/chat/preferences` | Exists | Persistence mismatch | Still tied to snapshot-backed utility services instead of a fully durable DB-backed preferences flow. |
| `/chat/threads/:id/archive` | Exists | Persistence mismatch | Chat thread archive/mute/pin helpers still need full DB-backed migration. |
| `/chat/threads/:id/mute` | Exists | Persistence mismatch | Uses mixed data-service path. |
| `/chat/threads/:id/pin` | Exists | Persistence mismatch | Uses mixed data-service path. |
| `/live-stream` | Exists | Persistence mismatch | Still served from `EcosystemDataService`, not durable Prisma-backed models. |
| `/live-stream/setup` | Exists | Persistence mismatch | Still static/service-backed. |
| `/live-stream/studio` | Exists | Persistence mismatch | Still static/service-backed. |
| `/live-stream/:id/comments` | Exists | Persistence mismatch | Still not stored in DB-backed live stream models. |
| `/live-stream/:id/reactions` | Exists | Persistence mismatch | Still not stored in DB-backed live stream models. |
| `/support/chat` | Exists | Response source mismatch | Utility/support assistant payload remains configuration-backed, not fully modeled. |
| `/onboarding/*` | Exists | Persistence mismatch | Routes are still part of the broader utility migration set. |
| `/hide/*` and `/hidden-posts/*` | Exists | Persistence mismatch | Feature contract exists but several flows still rely on older service layers. |
| `/archive/posts`, `/archive/stories`, `/archive/reels` | Exists | Persistence mismatch | Archive-related responses still need a stricter DB-only path review. |

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
- `../OptiZenqor_social/lib/feature/calls/controller/calls_controller.dart`
  - Added async loading and backend error state handling.
- `../OptiZenqor_social/lib/feature/calls/screen/calls_screen.dart`
  - Added loading, error, and empty states instead of assuming local data.

## Highest Priority Remaining Work

1. Move `chat.controller.ts` archive/mute/pin/preferences paths fully onto DB-backed services.
2. Replace `live-stream*` handlers in `realtime.controller.ts` with real Prisma-backed persistence.
3. Migrate the remaining app-utility controllers still reading from `src/data/*`.
4. Expand this report from the current high-risk slices to the full frontend endpoint surface.
