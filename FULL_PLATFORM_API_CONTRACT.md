# FULL_PLATFORM_API_CONTRACT

Last updated: 2026-05-08

## Source Repos

Local workspaces audited:

- `G:\My Project\Socity_backend`
- `G:\My Project\OptiZenqor_social`
- `G:\My Project\OptiZenqor_social_dashboard`
- `G:\My Project\Optizenqor_socity_frontend`

GitHub origins compared:

- `SaburNayem/OptiZenqor_social_backend`
- `SaburNayem/OptiZenqor_social`
- `SaburNayem/OptiZenqor_social_dashboard`
- `SaburNayem/OptiZenqor_social_frontend`

## GitHub Comparison Snapshot

- Backend local HEAD matches GitHub `origin/master`
- Dashboard local HEAD matches GitHub `origin/main`
- Flutter local HEAD differs from GitHub `origin/main`
- Web frontend local HEAD differs from GitHub `origin/main`

## Normalized API Contract

All HTTP responses should conform to:

```json
{
  "success": true,
  "message": "string",
  "data": {},
  "pagination": {}
}
```

Rules:

- `success` is always boolean.
- `message` is always a human-readable summary.
- `data` contains the domain payload.
- `pagination` appears only for paginated list responses.
- Legacy aliases like `items`, `results`, `jobs`, `pages`, `communities`, `notifications`, `streams` must not appear at the top level.
- Domain-specific collection keys are allowed only inside `data`.

Routes normalized in the current backend cleanup pass include:

- notifications, discovery/search, feed/home feed
- jobs list/networking/create options
- communities/pages/groups
- events list and pool-create wrapper
- uploads list/detail/create
- group chat, calls, live-stream, socket contract, RTC config, and call sessions

## List Endpoint Contract

For paginated lists:

```json
{
  "success": true,
  "message": "Users fetched successfully.",
  "data": {
    "items": []
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

Practical server rule for current platform migration:

- If a client needs a named collection, keep it under `data`.
- Example:

```json
{
  "success": true,
  "message": "Jobs fetched successfully.",
  "data": {
    "items": [],
    "jobs": []
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPreviousPage": false
  }
}
```

## Auth Contract

### User auth

- `POST /auth/login`
- `POST /auth/signup`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `GET /auth/me`

User routes use user bearer/session auth only.

### Admin auth

- `POST /admin/auth/login`
- `POST /admin/auth/refresh`
- `POST /admin/auth/logout`
- `GET /admin/auth/me`
- `GET /admin/auth/sessions`

Admin routes use admin bearer auth only.

Never accept user tokens on admin routes.

## Media Contract

Media-bearing responses should expose backend-owned absolute URLs and enough metadata so clients do not invent display values:

- `mediaUrl`
- `thumbnailUrl`
- `mimeType`
- `width`
- `height`
- `durationMs`
- `sizeBytes`
- `entityType`
- `entityId`
- `ownerUserId`

Current status:

- Absolute media URL consistency is still in progress across modules.
- Clients still contain fallback URL and avatar generation logic that must be removed over time.
- Upload detail/create responses now expose media URL fields inside `data` rather than top-level aliases.

## Backend Route Inventory Summary

Controller scan confirms local backend coverage for:

- health, docs, bootstrap, auth
- recommendations, notification preferences, safety, legal, security
- users, profile, follow/block/bookmark/archive/hide
- feed, posts, comments, likes, media viewer, share/repost
- stories, reels, uploads
- chat, group chat, calls, live streams, socket contract
- onboarding, personalization, accessibility, localization, maintenance, offline sync
- communities, groups, pages
- marketplace, jobs, events
- notifications, wallets, subscriptions, monetization, premium plans
- support, report center, verification request
- admin auth, admin dashboard, admin users/content/reports/settings/audit
- admin marketplace/jobs/events/communities/pages/live streams
- admin revenue/wallet/subscriptions/premium plans
- admin notification devices/campaigns and support operations

## Client Inventory Summary

### Flutter app

The mobile app references a very broad backend surface through `ApiEndPoints` plus feature repositories and services, including:

- auth/session/profile
- feed/posts/comments/reactions
- stories/reels
- chat/group chat/calls/live streams
- communities/groups/pages
- marketplace/orders/offers/chats/drafts
- jobs/applications/alerts/companies
- events
- notifications/devices/preferences
- settings/accessibility/localization/legal
- support
- verification, onboarding, personalization, offline sync

Known mobile contract issues still active:

- permissive alias parsing in `api_payload_reader.dart`
- local story IDs for composer/preview flows
- local community cache and local draft persistence

### Admin dashboard

The dashboard uses `VITE_API_BASE_URL` and currently calls:

- `/admin/auth/*`
- `/admin/dashboard/overview`
- `/admin/users`
- `/admin/content`
- `/admin/reports`
- `/admin/support-operations`
- `/admin/marketplace`
- `/admin/jobs`
- `/admin/events`
- `/admin/communities`
- `/admin/pages`
- `/admin/live-streams`
- `/admin/dashboard/revenue`
- `/admin/wallet`
- `/admin/subscriptions`
- `/admin/wallet-subscriptions`
- `/admin/premium-plans`
- `/admin/notification-campaigns`
- `/admin/notification-devices`
- `/admin/settings`
- `/admin/audit-logs`

Known dashboard contract issues still active:

- not all existing admin mutations are wired into UI
- shared admin primitives are incomplete
- large `AdminViews.jsx` still centralizes too much module logic

### Web frontend

The web frontend currently calls:

- `/auth/login`
- `/auth/signup`
- `/auth/forgot-password`
- `/auth/me`
- `/profile`
- `/user-profile/followers`
- `/user-profile/following`
- `/chat/threads`
- `/chat/threads/:id/messages`
- `/settings`
- `/marketplace`
- `/events`
- `/pages`
- `/calls`
- `/live-stream`
- `/users`
- `/feed`
- `/stories`
- `/reels`
- `/jobs-networking`
- `/communities`
- `/trending`
- `/notifications`

Known web contract issues still active:

- static/mock dataset still exists in `src/data/mockSocialData.ts`
- permissive parsing of backend payload aliases
- fallback deployed backend base URL
- client-generated IDs and client-only optimistic production entities

## Routes Normalized In This Pass

These local backend routes were cleaned to stop returning top-level compatibility aliases:

- `GET /notifications`
- `GET /notifications/inbox`
- `PATCH /notifications/:id/read`
- `POST /notifications/:id/read`
- `GET /search`
- `GET /global-search`
- `GET /search-discovery`
- `GET /feed`
- `GET /feed/home`
- `GET /jobs`
- `GET /jobs-networking`
- `GET /jobs/create`

## Remaining Contract Hotspots

Highest-priority remaining normalization targets:

- `src/controllers/communities.controller.ts`
- `src/controllers/realtime.controller.ts`
- `src/controllers/uploads.controller.ts`
- `src/controllers/events.controller.ts`
- additional alias-heavy responses emitted by `experience-database.service.ts`
- additional alias-heavy responses emitted by `admin-database.service.ts`

## Persistence Requirements Still Open

Still needed as dedicated relational history tables:

- support assignment history
- support SLA history
- support action history
- moderation action history
- moderation escalation history
- moderation assignee history
- report escalation/assignment history
- media asset ownership/entity mapping

Already present and reusable:

- `AdminAuditLog`
- `NotificationCampaignActionHistory`
- `SettingsSectionCatalog`
- `SettingsItemCatalog`
- `LocalizationLocaleCatalog`
- `AccessibilityOptionCatalog`
- `LegalDocumentVersion`
- `CallLifecycleSnapshot`
- `LiveLifecycleSnapshot`

## Validation Snapshot

Validated successfully in current local backend:

- `npm install`
- `npm run typecheck`
- `npm run build`
- `npm run prisma:generate`
- `npm run prisma:migrate`
- live smoke:
  - `GET /health`
  - `GET /health/database`
  - `GET /docs-json`
  - `POST /admin/auth/login`
  - `GET /admin/dashboard/overview`
  - `GET /admin/users`
  - `GET /admin/content`
  - `GET /admin/reports`
  - `GET /admin/settings`
  - `GET /admin/support-operations`
  - `GET /admin/marketplace`
  - `GET /admin/jobs`
  - `GET /admin/events`
  - `GET /admin/communities`
  - `GET /admin/pages`
  - `GET /admin/notification-campaigns`
  - `GET /admin/notification-devices`

Other repo validations already passed in this audit cycle:

- dashboard `npm install`
- dashboard `npm run lint`
- dashboard `npm run build`
- web frontend `npm install`
- web frontend `npm run lint`
- web frontend `npm run build`
- Flutter `flutter pub get`
- Flutter `dart format .`
- Flutter `flutter analyze`
- Flutter `flutter test`

Still not completed in this turn:

- backend seed command is not present as `seed:dev`
- safe user login smoke without introducing test runtime data
