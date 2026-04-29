# Backend Frontend Integration Status

Last updated: 2026-04-29

This is a backend-first audit of the current `Socity_backend` workspace. Frontend status is pending a separate repo audit.

## Summary

- Prisma/PostgreSQL coverage is broader than the older public docs suggest.
- The main remaining backend gap is not missing route count, but controllers and services that still depend on `src/data/*` snapshot or seeded state.
- Route contracts should mostly stay stable while internals move to the DB-backed services under `src/services/*`.

## Backend Status

| Feature Area | DB-backed | Endpoint Ready | Frontend Connected | Mock Removed | Tested | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Auth core users/sessions | Partial | Partial | Pending | No | Partial | Core DB and JWT services exist, but demo/seeded auth flows still exist in controllers/docs. |
| Feed/posts/comments/reactions | Yes | Yes | Pending | Partial | Partial | Core post data is DB-backed; some detail/adjacent routes still touch mock-backed services. |
| Stories | Yes | Yes | Pending | Partial | Partial | Prisma models and DB service exist; some controller-adjacent flows still reference old data services. |
| Reels | Yes | Yes | Pending | Partial | Partial | Prisma models and DB service exist. |
| Chat/messages | Yes | Yes | Pending | Partial | Partial | Core threads/messages are DB-backed; presence/call/live layers still use snapshot/state services. |
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
| Preferences/support/app extensions | Partial | Partial | Pending | Partial | Partial | `settings` and `preferences` now read user-scoped state from DB-backed services for core settings flows, and support tickets are now persisted; several support/app-extension utility routes still rely on snapshot-backed services. |
| Realtime calls/live/presence | Partial | Partial | Pending | No | Partial | Socket auth exists, but snapshot-backed session state and fallback auth paths remain. |

## Remaining Mock or Snapshot Hotspots

- `src/data/platform-data.service.ts`
- `src/data/ecosystem-data.service.ts`
- `src/data/extended-data.service.ts`
- `src/data/app-extensions-data.service.ts`
- `src/data/settings-data.service.ts`
- `src/services/state-snapshot.service.ts`

## Latest Completed Files

- `src/services/settings-database.service.ts`
- `src/controllers/settings.controller.ts`
- `src/controllers/preferences.controller.ts`
- `src/services/discovery-database.service.ts`
- `src/controllers/discovery.controller.ts`
- `src/services/profiles-database.service.ts`
- `src/controllers/profiles.controller.ts`
- `src/services/support-database.service.ts`
- `src/controllers/support.controller.ts`

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

## Frontend Impact

- Discovery and search screens should continue to receive the same top-level keys (`success`, `query`, `results`, `sections`, `count`, `items`, `data`) while now reflecting DB-backed users, posts, jobs, pages, communities, marketplace items, and events.
- Profile routes keep the same wrapper aliases (`user`, `profile`, `data`, `items`, `results`) while removing seeded ecosystem/profile dashboard dependencies for the completed endpoints.
- Support and realtime feature screens still depend on seeded/snapshot-backed routes and remain migration targets.
- Support ticket list/create routes are now durable, but FAQ/chat/mail utility payloads are still configuration-backed rather than fully modeled in Prisma.

## Latest Verification

- `npm.cmd run typecheck`: pass
- `npm.cmd run build`: pass
- `npm.cmd install`: pass
- `npx.cmd prisma generate`: pass

## High-Priority Controller Migration Targets

1. `src/controllers/chat.controller.ts`
2. `src/controllers/support.controller.ts`
3. `src/controllers/realtime.controller.ts`
4. `src/controllers/posts.controller.ts`
5. `src/controllers/stories.controller.ts`
6. `src/controllers/auth.controller.ts`
7. `src/controllers/notifications.controller.ts`
8. `src/controllers/marketplace.controller.ts`

## Notes

- Public docs in the GitHub repo describe an older state than the current local schema and service layer.
- On 2026-04-29, `settings.controller.ts` and `preferences.controller.ts` were moved off mutable seeded state for their main user-scoped reads and updates by introducing `SettingsDatabaseService`.
- On 2026-04-29, `discovery.controller.ts` and `profiles.controller.ts` were moved off seeded ecosystem/platform lookups for their main read flows by introducing `DiscoveryDatabaseService` and `ProfilesDatabaseService`.
- On 2026-04-29, `support.controller.ts` moved ticket persistence off in-memory ecosystem state by introducing `SupportDatabaseService`.
- The backend currently uses a deliberate hybrid database access style: Prisma for many newer modules and raw `pg` for the core social/auth layer.
- Remaining seeded dependencies for the current target slice are concentrated in `chat.controller.ts`, `realtime.controller.ts`, and the broader app-utility controller set still importing `src/data/*`.
- Latest verification for completed areas: `npm.cmd install`, `npx.cmd prisma generate`, `npm.cmd run typecheck`, and `npm.cmd run build` all pass.
