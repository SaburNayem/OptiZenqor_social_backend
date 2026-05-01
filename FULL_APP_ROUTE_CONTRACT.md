# Full App Route Contract

This file is the current local contract for the Flutter app and React admin dashboard.

All production routes listed here are expected to return the standard backend envelope:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {}
}
```

Compatibility aliases such as `items`, `results`, `products`, `blockedAccounts`, or `mutedAccounts` may also be included where older Flutter screens still read them.

## Mobile

| Method | Path | Auth | Request body | Primary response data | Flutter usage | Backend implementation |
| --- | --- | --- | --- | --- | --- | --- |
| `POST` | `/auth/login` | No | `email`, `password` | session tokens + user | `lib/core/data/service/auth_service.dart` | `src/controllers/auth.controller.ts` |
| `POST` | `/auth/signup` | No | signup payload | session tokens + user | `lib/core/data/service/auth_service.dart` | `src/controllers/auth.controller.ts` |
| `POST` | `/auth/refresh-token` | No | `refreshToken` | refreshed session tokens | session restore flows | `src/controllers/auth.controller.ts` |
| `POST` | `/auth/logout` | Yes | none | logout confirmation | `lib/core/data/service/auth_service.dart` | `src/controllers/auth.controller.ts` |
| `GET` | `/auth/me` | Yes | none | current user | `lib/core/data/service/auth_service.dart` | `src/controllers/auth.controller.ts` |
| `GET` | `/app/bootstrap` | Optional | none | counters, entrypoints, user snapshot | startup bootstrap flows | `src/controllers/bootstrap.controller.ts` |
| `GET` | `/communities` | Optional | query filters | communities list | `lib/feature/communities/repository/communities_repository_impl.dart` | `src/controllers/communities.controller.ts` |
| `POST` | `/communities` | Yes | create community payload | created community | `lib/feature/groups/repository/groups_repository.dart` | `src/controllers/communities.controller.ts` |
| `POST` | `/communities/:id/join` | Yes | none | updated membership state | `lib/feature/groups/repository/groups_repository.dart` | `src/controllers/communities.controller.ts` |
| `POST` | `/communities/:id/leave` | Yes | none | updated membership state | `lib/feature/groups/repository/groups_repository.dart` | `src/controllers/communities.controller.ts` |
| `GET` | `/pages` | Optional | query filters | pages list | `lib/feature/pages/repository/pages_repository.dart` | `src/controllers/communities.controller.ts` |
| `POST` | `/pages/create` | Yes | page payload | created page | `lib/feature/pages/repository/pages_repository.dart` | `src/controllers/communities.controller.ts` |
| `PATCH` | `/pages/:id/follow` | Yes | optional `following` | follow state | `lib/feature/pages/repository/pages_repository.dart` | `src/controllers/communities.controller.ts` |
| `GET` | `/saved-collections` | Yes | none | collections list | `lib/feature/saved_collections/repository/saved_collections_repository.dart` | `src/controllers/discovery.controller.ts` |
| `POST` | `/saved-collections` | Yes | collection payload | created collection | `lib/feature/saved_collections/repository/saved_collections_repository.dart` | `src/controllers/discovery.controller.ts` |
| `PATCH` | `/saved-collections/:id` | Yes | collection patch | updated collection | `lib/feature/saved_collections/repository/saved_collections_repository.dart` | `src/controllers/discovery.controller.ts` |
| `GET` | `/bookmarks` | Yes | none | bookmarks list | bookmarks and marketplace saved items | `src/controllers/bookmarks.controller.ts` |
| `POST` | `/bookmarks` | Yes | `id`, `title`, `type` | saved bookmark | `lib/feature/marketplace/repository/marketplace_repository.dart`, `lib/feature/bookmarks/controller/bookmarks_controller.dart` | `src/controllers/bookmarks.controller.ts` |
| `DELETE` | `/bookmarks/:id` | Yes | none | removed bookmark | `lib/feature/marketplace/repository/marketplace_repository.dart`, `lib/feature/bookmarks/controller/bookmarks_controller.dart` | `src/controllers/bookmarks.controller.ts` |
| `GET` | `/marketplace` | Optional | filters, paging, search | products, drafts, orders, sellers, compare ids, saved ids | `lib/feature/marketplace/repository/marketplace_repository.dart` | `src/controllers/marketplace.controller.ts` |
| `GET` | `/marketplace/compare` | Yes | none | `productIds` | `lib/feature/marketplace/repository/marketplace_repository.dart` | `src/controllers/marketplace.controller.ts` |
| `PATCH` | `/marketplace/compare` | Yes | `productIds` | persisted compare ids | `lib/feature/marketplace/repository/marketplace_repository.dart` | `src/controllers/marketplace.controller.ts` |
| `PATCH` | `/marketplace/products/:id/status` | Yes | `status` in `active|sold|expired` | updated listing | `lib/feature/marketplace/repository/marketplace_repository.dart` | `src/controllers/marketplace.controller.ts` |
| `POST` | `/marketplace/products` | Yes | create product payload | created listing | `lib/feature/marketplace/repository/marketplace_repository.dart` | `src/controllers/marketplace.controller.ts` |
| `GET` | `/marketplace/drafts` | Yes | none | marketplace drafts | `lib/feature/marketplace/repository/marketplace_repository.dart` | `src/controllers/marketplace.controller.ts` |
| `POST` | `/marketplace/drafts` | Yes | draft payload | created draft | `lib/feature/marketplace/repository/marketplace_repository.dart` | `src/controllers/marketplace.controller.ts` |
| `DELETE` | `/marketplace/drafts/:id` | Yes | none | delete confirmation | `lib/feature/marketplace/repository/marketplace_repository.dart` | `src/controllers/marketplace.controller.ts` |
| `POST` | `/marketplace/sellers/:sellerId/follow` | Yes | none | follow state | `lib/feature/marketplace/repository/marketplace_repository.dart` | `src/controllers/marketplace.controller.ts` |
| `DELETE` | `/marketplace/sellers/:sellerId/follow` | Yes | none | follow state | `lib/feature/marketplace/repository/marketplace_repository.dart` | `src/controllers/marketplace.controller.ts` |
| `GET` | `/marketplace/products/:id/chat` | Yes | none | conversations + messages | `lib/feature/marketplace/repository/marketplace_repository.dart` | `src/controllers/marketplace.controller.ts` |
| `POST` | `/marketplace/products/:id/chat/messages` | Yes | message payload | created message | `lib/feature/marketplace/repository/marketplace_repository.dart` | `src/controllers/marketplace.controller.ts` |
| `GET` | `/marketplace/products/:id/offers` | Yes | none | offer history | `lib/feature/marketplace/repository/marketplace_repository.dart` | `src/controllers/marketplace.controller.ts` |
| `POST` | `/marketplace/products/:id/offers` | Yes | offer payload | created offer | `lib/feature/marketplace/repository/marketplace_repository.dart` | `src/controllers/marketplace.controller.ts` |
| `POST` | `/marketplace/checkout` | Yes | `productId`, address, delivery, payment | created order | `lib/feature/marketplace/controller/marketplace_controller.dart` | `src/controllers/marketplace.controller.ts` |
| `GET` | `/polls-surveys` | Yes | none | active and draft poll entries | `lib/feature/polls_surveys/repository/polls_surveys_repository.dart` | `src/controllers/polls-surveys.controller.ts` |
| `PATCH` | `/polls-surveys/:id/vote` | Yes | `optionIndex` | updated poll | `lib/feature/polls_surveys/repository/polls_surveys_repository.dart` | `src/controllers/polls-surveys.controller.ts` |
| `GET` | `/learning-courses` | Yes | none | learning course entries | `lib/feature/learning_courses/repository/learning_courses_repository.dart` | `src/controllers/learning-courses.controller.ts` |
| `GET` | `/blocked-muted-accounts` | Yes | optional `actorId` | blocked and muted accounts | `lib/feature/blocked_muted_accounts/repository/blocked_muted_accounts_repository.dart` | `src/controllers/preferences.controller.ts` |
| `DELETE` | `/block/:id` | Yes | none | unblock confirmation | `lib/feature/blocked_muted_accounts/repository/blocked_muted_accounts_repository.dart` | `src/controllers/block.controller.ts` |
| `PATCH` | `/blocked-muted-accounts/:targetId/unmute` | Yes | none | unmute confirmation | `lib/feature/blocked_muted_accounts/repository/blocked_muted_accounts_repository.dart` | `src/controllers/preferences.controller.ts` |
| `GET` | `/account-switching` | Yes | none | linked account state | `lib/feature/account_switching/service/account_switching_service.dart` | `src/controllers/account-switching.controller.ts` |
| `GET` | `/activity-sessions` | Yes | none | active session state | `lib/feature/activity_sessions/repository/activity_sessions_repository.dart` | `src/controllers/activity-sessions.controller.ts` |
| `GET` | `/calls/sessions` | Yes | none | persisted call sessions | calls feature repositories | `src/controllers/realtime.controller.ts` |
| `GET` | `/live-stream` | Yes | none | live stream state | `lib/feature/live_stream/repository/live_stream_repository.dart` | `src/controllers/realtime.controller.ts` |
| `GET` | `/jobs` | Optional | query filters | jobs list | `lib/feature/jobs_networking/repository/jobs_networking_repository.dart` | `src/controllers/jobs.controller.ts` |
| `POST` | `/jobs/:id/apply` | Yes | application payload | created application | `lib/feature/jobs_networking/repository/jobs_networking_repository.dart` | `src/controllers/jobs.controller.ts` |
| `GET` | `/events` | Optional | query filters | events list | `lib/feature/events/repository/events_repository.dart` | `src/controllers/events.controller.ts` |

## Dashboard

| Method | Path | Auth | Request body | Primary response data | Dashboard usage | Backend implementation |
| --- | --- | --- | --- | --- | --- | --- |
| `POST` | `/admin/auth/login` | No | `email`, `password` | admin session tokens | `src/App.jsx` | `src/controllers/admin-ops.controller.ts` |
| `POST` | `/admin/auth/refresh` | No | `refreshToken` | refreshed admin session | `src/App.jsx` | `src/controllers/admin-ops.controller.ts` |
| `POST` | `/admin/auth/logout` | Yes | none | logout confirmation | `src/App.jsx` | `src/controllers/admin-ops.controller.ts` |
| `GET` | `/admin/auth/me` | Yes | none | current admin | `src/App.jsx` | `src/controllers/admin-ops.controller.ts` |
| `GET` | `/admin/auth/sessions` | Yes | none | admin session list | available to dashboard clients | `src/controllers/admin-ops.controller.ts` |
| `PATCH` | `/admin/auth/sessions/:id/revoke` | Yes | none | revoked session | available to dashboard clients | `src/controllers/admin-ops.controller.ts` |
| `GET` | `/admin/dashboard/overview` | Yes | none | live totals and health blocks | `src/App.jsx` | `src/controllers/admin.controller.ts` |
| `GET` | `/admin/dashboard/users` | Yes | none | user metrics | dashboard overview clients | `src/controllers/admin.controller.ts` |
| `GET` | `/admin/dashboard/content` | Yes | none | content metrics | dashboard overview clients | `src/controllers/admin.controller.ts` |
| `GET` | `/admin/dashboard/reports` | Yes | none | report metrics | dashboard overview clients | `src/controllers/admin.controller.ts` |
| `GET` | `/admin/dashboard/revenue` | Yes | none | monetization metrics | dashboard overview clients | `src/controllers/admin.controller.ts` |
| `GET` | `/admin/dashboard/moderation` | Yes | none | moderation metrics | dashboard overview clients | `src/controllers/admin.controller.ts` |
| `GET` | `/admin/users` | Yes | filters | user list | `src/App.jsx` | `src/controllers/admin.controller.ts` |
| `PATCH` | `/admin/users/:id` | Yes | moderation/user patch | updated user | `src/App.jsx` | `src/controllers/admin.controller.ts` |
| `GET` | `/admin/content` | Yes | filters | moderated content list | `src/App.jsx` | `src/controllers/admin.controller.ts` |
| `PATCH` | `/admin/content/:type/:id/moderate` | Yes | moderation patch | updated content | `src/App.jsx` | `src/controllers/admin.controller.ts` |
| `GET` | `/admin/reports` | Yes | filters | reports queue | `src/App.jsx` | `src/controllers/admin.controller.ts` |
| `PATCH` | `/admin/reports/:id` | Yes | report patch | updated report | `src/App.jsx` | `src/controllers/admin.controller.ts` |
| `GET` | `/admin/audit-logs` | Yes | filters | audit log entries | `src/App.jsx` | `src/controllers/admin.controller.ts` |
| `GET` | `/admin/settings` | Yes | none | operational settings | `src/App.jsx` | `src/controllers/admin.controller.ts` |
| `PATCH` | `/admin/settings` | Yes | `patch` object | updated settings | `src/App.jsx` | `src/controllers/admin.controller.ts` |
| `GET` | `/admin/support-operations` | Yes | none | support ticket operations data | `src/App.jsx` | `src/controllers/admin-ops.controller.ts` |
| `GET` | `/marketplace/products` | Yes/Optional | filters | marketplace data for admin browsing | `src/App.jsx` | `src/controllers/marketplace.controller.ts` |
| `GET` | `/jobs` | Yes/Optional | filters | jobs data for admin browsing | `src/App.jsx` | `src/controllers/jobs.controller.ts` |
| `GET` | `/events` | Yes/Optional | filters | events data for admin browsing | `src/App.jsx` | `src/controllers/events.controller.ts` |
| `GET` | `/communities` | Yes/Optional | filters | communities data for admin browsing | `src/App.jsx` | `src/controllers/communities.controller.ts` |
| `GET` | `/pages` | Yes/Optional | filters | pages data for admin browsing | `src/App.jsx` | `src/controllers/communities.controller.ts` |

## Latest fixes reflected here

- Removed demo-only runtime auth surface from active client usage.
- Added persisted marketplace compare state via `/marketplace/compare`.
- Added persisted marketplace listing status mutation via `/marketplace/products/:id/status`.
- Switched marketplace saved items to backend bookmarks instead of local-only toggles.
- Added backend unmute route via `/blocked-muted-accounts/:targetId/unmute`.
- Flattened blocked/muted account payloads so Flutter reads consistent account objects.
