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
| Preferences/support/app extensions | Partial | Partial | Pending | No | Partial | Several routes still rely on `SettingsDataService` or `AppExtensionsDataService`. |
| Realtime calls/live/presence | Partial | Partial | Pending | No | Partial | Socket auth exists, but snapshot-backed session state and fallback auth paths remain. |

## Remaining Mock or Snapshot Hotspots

- `src/data/platform-data.service.ts`
- `src/data/ecosystem-data.service.ts`
- `src/data/extended-data.service.ts`
- `src/data/app-extensions-data.service.ts`
- `src/data/settings-data.service.ts`
- `src/services/state-snapshot.service.ts`

## High-Priority Controller Migration Targets

1. `src/controllers/discovery.controller.ts`
2. `src/controllers/settings.controller.ts`
3. `src/controllers/preferences.controller.ts`
4. `src/controllers/chat.controller.ts`
5. `src/controllers/posts.controller.ts`
6. `src/controllers/stories.controller.ts`
7. `src/controllers/auth.controller.ts`
8. `src/controllers/profiles.controller.ts`

## Notes

- Public docs in the GitHub repo describe an older state than the current local schema and service layer.
- The next backend-first goal should be replacing the remaining `src/data/*` dependencies feature by feature, starting with user-scoped state and discovery surfaces.
