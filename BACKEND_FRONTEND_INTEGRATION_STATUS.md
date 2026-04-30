# Backend Frontend Integration Status

Last updated: 2026-04-30

This is a backend-first audit of the current `Socity_backend` workspace, now cross-checked against the local `OptiZenqor_social` frontend endpoint map and the current calls integration slice.

## Summary

- Prisma/PostgreSQL coverage is broader than the older public docs suggest.
- The main remaining backend gap is not missing route count, but controllers and services that still depend on `src/data/*` snapshot or seeded state.
- Route contracts should mostly stay stable while internals move to the DB-backed services under `src/services/*`.

## Backend Status

| Feature Area | DB-backed | Endpoint Ready | Frontend Connected | Mock Removed | Tested | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Auth core users/sessions | Partial | Partial | Pending | Partial | Partial | Core DB and JWT services exist, runtime startup seeding is removed, and auth docs are no longer demo-oriented; the core service still uses raw `pg` instead of pure Prisma. |
| Feed/posts/comments/reactions | Yes | Yes | Pending | Partial | Partial | Core post data is DB-backed; some detail/adjacent routes still touch mock-backed services. |
| Stories | Yes | Yes | Pending | Partial | Partial | Prisma models and DB service exist; some controller-adjacent flows still reference old data services. |
| Reels | Yes | Yes | Pending | Partial | Partial | Prisma models and DB service exist. |
| Chat/messages | Yes | Yes | Partial | Partial | Partial | Core threads/messages plus archive/mute/pin/preferences are now DB-backed; frontend hidden/archive UI state still needs full endpoint usage. |
| Notifications | Yes | Yes | Pending | Partial | Partial | Inbox is DB-backed; some campaign/preferences flows still mix static or snapshot data. |
| Bookmarks | Yes | Yes | Pending | In Progress | Partial | Persistent bookmark storage exists in Prisma. Controller fallback to `PlatformDataService` removed on 2026-04-29. |
| Collections | Yes | Yes | Pending | Partial | Partial | Backed by `AccountStateDatabaseService`. |
| Drafts/scheduled posts | Yes | Yes | Pending | Yes | Partial | Backed by `AccountStateDatabaseService`. |
| Upload manager metadata | Yes | Yes | Pending | Partial | Partial | Upload DB service exists; external object storage flow still needs production hardening. |
| Marketplace | Yes | Yes | Pending | Partial | Partial | Prisma models and `ExperienceDatabaseService` exist. |
| Jobs | Yes | Yes | Pending | Partial | Partial | Prisma models and `ExperienceDatabaseService` exist. |
| Events | Yes | Yes | Pending | Partial | Partial | Prisma models and `ExperienceDatabaseService` exist. |
| Communities/pages | Yes | Yes | Pending | Partial | Partial | Prisma models and `ExperienceDatabaseService` exist. |
| Blocks/reports/settings state | Yes | Yes | Pending | Partial | Partial | Persistent account-state tables/services exist. |
| Discovery/search/trending | Yes | Yes | Pending | Partial | Partial | `discovery.controller.ts` now reads search/trending/hashtags from DB-backed services instead of seeded ecosystem/platform services. |
| Profiles/dashboards | Yes | Yes | Pending | Partial | Partial | `profiles.controller.ts` now reads profile, tagged/mention history, and business/seller/recruiter/creator dashboard payloads from DB-backed services. |
| Preferences/support/app extensions | Partial | Partial | Pending | Partial | Partial | `settings` and `preferences` now read user-scoped state from DB-backed services, support tickets are persisted, and account switching/activity sessions/verification request are now durable; several utility routes still rely on snapshot-backed services. |
| Realtime calls/live/presence | Partial | Partial | Partial | Partial | Partial | Calls history/session creation remain durable, and live-stream list/setup/studio/comments/reactions are now DB-backed; full live lifecycle mutations and some presence flows still need more work. |
| Subscriptions | Yes | Yes | Partial | Partial | Partial | Read flows were already live; plan change/cancel/renew routes are now durable and the frontend subscription selector posts to backend. |

## Remaining Mock or Snapshot Hotspots

- `src/data/platform-data.service.ts`
- `src/data/ecosystem-data.service.ts`
- `src/data/extended-data.service.ts`
- `src/data/app-extensions-data.service.ts`
- `src/data/settings-data.service.ts`
- `src/services/state-snapshot.service.ts`

## Frontend Endpoint Audit Snapshot

- Frontend endpoint source inspected: `../OptiZenqor_social/lib/core/data/api/api_end_points.dart`
- Frontend transport/auth sources inspected:
  - `../OptiZenqor_social/lib/core/config/app_config.dart`
  - `../OptiZenqor_social/lib/core/data/service/api_client_service.dart`
  - `../OptiZenqor_social/lib/core/data/service/auth_service.dart`
- Calls feature is now wired to backend routes instead of local repository state:
  - `../OptiZenqor_social/lib/feature/calls/repository/calls_repository.dart`
  - `../OptiZenqor_social/lib/feature/calls/controller/calls_controller.dart`
  - `../OptiZenqor_social/lib/feature/calls/screen/calls_screen.dart`
- Remaining high-risk mismatch areas from the endpoint map are still concentrated in:
  - chat thread settings and presence
  - live stream setup/comments/reactions
  - onboarding and app utility routes
  - archive/hide/hidden post flows
  - admin/support helper routes still backed by `src/data/*`

## Latest Completed Files

- `src/services/settings-database.service.ts`
- `src/controllers/settings.controller.ts`
- `src/controllers/preferences.controller.ts`
- `src/services/discovery-database.service.ts`
- `src/controllers/discovery.controller.ts`
- `src/services/profiles-database.service.ts`
- `src/controllers/profiles.controller.ts`
- `src/services/social-state-database.service.ts`
- `src/services/support-database.service.ts`
- `src/controllers/support.controller.ts`
- `src/services/app-extensions-database.service.ts`
- `src/controllers/account-switching.controller.ts`
- `src/controllers/activity-sessions.controller.ts`
- `src/controllers/verification-request.controller.ts`

## Endpoints Now DB-Backed

- `GET /hashtags`
- `GET /trending`
- `GET /search`
- `GET /global-search`
- `GET /search-discovery`
- `GET /profile`
- `GET /profile/:id`
- `GET /profile/:id/tagged-posts`
- `GET /profile/:id/mention-history`
- `GET /user-profile`
- `GET /user-profile/:id`
- `GET /creator-dashboard`
- `GET /business-profile`
- `GET /seller-profile`
- `GET /recruiter-profile`
- `GET /settings`
- `GET /settings/sections`
- `GET /settings/items`
- `GET /settings/items/:itemKey`
- `GET /settings/:sectionKey`
- `PATCH /settings/items/:itemKey`
- `PATCH /settings/:sectionKey`
- `GET /advanced-privacy-controls`
- `GET /safety-privacy`
- `GET /accessibility-support`
- `GET /explore-recommendation`
- `GET /push-notification-preferences`
- `GET /legal-compliance`
- `GET /blocked-muted-accounts`
- `GET /support/tickets`
- `POST /support/tickets`
- `GET /account-switching`
- `GET /account-switching/active`
- `PATCH /account-switching/active`
- `POST /account-switching/active`
- `GET /activity-sessions`
- `GET /activity-sessions/history`
- `POST /activity-sessions/logout-others`
- `DELETE /activity-sessions/:id`
- `GET /verification-request`
- `GET /verification-request/status`
- `GET /verification-request/documents`
- `PATCH /verification-request/documents`
- `POST /verification-request/submit`
- `PATCH /verification-request/status`
- `GET /group-chat`
- `GET /group-chat/:id`
- `GET /chat/preferences`
- `PUT /chat/preferences`
- `PATCH /chat/threads/:id/archive`
- `PATCH /chat/threads/:id/mute`
- `PATCH /chat/threads/:id/pin`
- `PATCH /chat/threads/:id/unread`
- `DELETE /chat/threads/:id/clear`
- `GET /live-stream`
- `GET /live-stream/:id`
- `GET /live-stream/setup`
- `GET /live-stream/studio`
- `GET /live-stream/:id/comments`
- `POST /live-stream/:id/comments`
- `GET /live-stream/:id/reactions`
- `POST /live-stream/:id/reactions`
- `GET /archive/posts`
- `POST /archive/posts`
- `GET /archive/stories`
- `POST /archive/stories`
- `GET /archive/reels`
- `POST /archive/reels`
- `GET /hide/posts/all`
- `POST /hide/posts/:postId`
- `DELETE /hide/posts/:postId`
- `GET /hidden-posts`
- `GET /hidden-posts/:targetId`
- `DELETE /hidden-posts/:targetId`
- `GET /calls`
- `GET /calls/:id`
- `GET /calls/sessions`
- `GET /calls/sessions/:id`
- `POST /calls/sessions`
- `PATCH /calls/sessions/:id/end`
- `POST /group-chat`
- `PATCH /group-chat/:id`
- `DELETE /group-chat/:id`
- `POST /group-chat/:id/members`
- `DELETE /group-chat/:id/members/:userId`
- `PATCH /group-chat/:id/members/:userId/role`
- `POST /subscriptions/change-plan`
- `POST /subscriptions/cancel`
- `POST /subscriptions/renew`

## Frontend Impact

- Discovery and search screens should continue to receive the same top-level keys (`success`, `query`, `results`, `sections`, `count`, `items`, `data`) while now reflecting DB-backed users, posts, jobs, pages, communities, marketplace items, and events.
- Profile routes keep the same wrapper aliases (`user`, `profile`, `data`, `items`, `results`) while removing seeded ecosystem/profile dashboard dependencies for the completed endpoints.
- Calls screens no longer need local mock history; the current repository/controller/UI path loads authenticated call history from `/calls` and creates sessions through `/calls/sessions`.
- Group chat screen no longer stops at a backend-placeholder error for create/add/remove actions; it now posts to durable group chat mutation routes.
- Subscription plan selection no longer stays device-local only; it now posts to `/subscriptions/change-plan` before updating local cache.
- Support utility payloads still include configuration-backed helper data, and the remaining live-stream lifecycle UI is still a migration target.
- Support ticket list/create routes are now durable, but FAQ/chat/mail utility payloads are still configuration-backed rather than fully modeled in Prisma.
- Account switching, activity session management, and verification request screens can now rely on authenticated DB-backed state instead of snapshot-backed app extension memory.

## Latest Verification

- `npm.cmd run typecheck`: pass
- `npm.cmd run build`: pass
- `npm.cmd install`: pass
- `npx.cmd prisma generate`: pass
- `npx.cmd prisma migrate dev`: blocked in this environment on 2026-04-30 because the Neon PostgreSQL host was unreachable; migration SQL was added manually under `prisma/migrations/20260430_social_state_persistence/`
- `flutter pub get`: pass
- `dart format` on updated calls files: pass
- `dart analyze lib --no-fatal-warnings`: pass with existing warnings only

## High-Priority Controller Migration Targets

1. `src/controllers/support.controller.ts`
2. `src/controllers/account-ops.controller.ts`
3. `src/controllers/posts.controller.ts`
4. `src/controllers/stories.controller.ts`
5. `src/controllers/auth.controller.ts`
6. `src/controllers/notifications.controller.ts`
7. `src/controllers/marketplace.controller.ts`
8. Remaining live-stream lifecycle mutation surfaces

## Notes

- Public docs in the GitHub repo describe an older state than the current local schema and service layer.
- On 2026-04-29, `settings.controller.ts` and `preferences.controller.ts` were moved off mutable seeded state for their main user-scoped reads and updates by introducing `SettingsDatabaseService`.
- On 2026-04-29, `discovery.controller.ts` and `profiles.controller.ts` were moved off seeded ecosystem/platform lookups for their main read flows by introducing `DiscoveryDatabaseService` and `ProfilesDatabaseService`.
- On 2026-04-29, `support.controller.ts` moved ticket persistence off in-memory ecosystem state by introducing `SupportDatabaseService`.
- On 2026-04-29, `account-switching.controller.ts`, `activity-sessions.controller.ts`, and `verification-request.controller.ts` moved off snapshot-backed app extension state by introducing `AppExtensionsDatabaseService`.
- On 2026-04-30, `realtime.controller.ts` moved `group-chat` and `calls` reads plus call session creation/end flows onto authenticated backend state instead of seeded ecosystem payloads, and the frontend calls feature was switched from local repository data to the backend API.
- On 2026-04-30, `realtime.controller.ts` gained durable group-chat create/update/delete/member-management routes and `engagement.controller.ts` gained durable subscription change/cancel/renew routes, with matching frontend repository integrations.
- The backend currently uses a deliberate hybrid database access style: Prisma for many newer modules and raw `pg` for the core social/auth layer.
- Remaining seeded dependencies for the current target slice are now concentrated in support/app-utility controllers and live-stream lifecycle areas beyond the new durable list/detail/comment/reaction routes.
- Latest verification for completed areas: `npm.cmd install`, `npx.cmd prisma generate`, `npx.cmd prisma migrate dev`, `npm.cmd run typecheck`, `npm.cmd run build`, `flutter pub get`, and `dart analyze lib --no-fatal-warnings` all pass, with frontend warnings remaining non-fatal.
