# Local Cross-Repo Audit - 2026-05-03

This audit is based on the three local checkouts present under `G:\My Project\`:

- `Socity_backend`
- `OptiZenqor_social`
- `OptiZenqor_social_dashboard`

It confirms the broad direction of the public GitHub reports, but also captures the exact local code paths that still create production-readiness gaps.

## Confirmed Local Findings

### 1. Backend response normalization is only partial

The backend has a normalization utility:

- `src/utils/api-response.util.ts`

But several active controllers still return mixed or compatibility-heavy payloads instead of a single canonical shape:

- `src/controllers/content.controller.ts`
  - `GET /feed` and `GET /feed/home` return `data`, `items`, `results`, and `count` at the top level.
- `src/controllers/communities.controller.ts`
  - `GET /communities` and `GET /pages` still emit top-level aliases such as `items`, `results`, `communities`, and `pages`.
  - membership/create/update actions also duplicate fields like `joined`, `memberCount`, and `community` outside `data`.
- `src/controllers/notifications.controller.ts`
  - `GET /notifications` and `GET /notifications/inbox` return `notifications`, `items`, `results`, `data`, and `inbox` together.
  - `PATCH/POST /notifications/:id/read` spreads notification fields at the top level in addition to `data`.
- `src/controllers/realtime.controller.ts`
  - group chat, calls, call sessions, and live stream routes still return aliases such as `groups`, `calls`, `streams`, `comments`, `reactions`, and `sessions`.
- `src/controllers/uploads.controller.ts`
  - upload detail and upload create responses still duplicate `url`, `secureUrl`, `remotePath`, `path`, and `fileUrl` outside `data`.

### 2. Flutter still depends on alias-tolerant API parsing

Flutter is not yet consuming a strict canonical response contract.

- `lib/core/data/api/api_payload_reader.dart`
  - explicitly accepts fallback list keys such as `items`, `results`, `users`, `pages`, `jobs`, `products`, `posts`, `stories`, and more.
- `lib/feature/home_feed/repository/home_feed_repository.dart`
  - feed parsing still accepts `data`, `items`, `results`, and `value`.
  - stories parsing still prefers `stories`, `data`, `items`, `results`.
- `lib/feature/notifications/repository/notifications_repository.dart`
  - notifications loading looks for `notifications` and `items`.
- `lib/feature/calls/repository/calls_repository.dart`
  - calls loading prefers `calls`, `items`, `results`, and `data`.
- `lib/feature/live_stream/repository/live_stream_repository.dart`
  - live stream resolution still accepts `data`, `stream`, and `comment`.
- `lib/core/data/service/upload_service.dart`
  - upload completion still accepts many fallback keys including `url`, `path`, `remotePath`, `fileUrl`, `secureUrl`, `data`, `file`, `upload`, and `asset`.

This means backend alias removal is not safe yet unless Flutter is updated in the same change set.

### 3. Flutter still contains production-facing local or fallback behavior

The app is better aligned with a real backend than earlier snapshots, but it is not yet free of local/runtime fallback patterns.

- `lib/feature/home_feed/controller/home_feed_controller.dart`
  - `suggestedUsers`, `suggestedGroups`, and `suggestedPages` are still hard-coded.
  - `loadInitial()` swallows feed failures and ends up with empty local state instead of surfacing backend truth.
- `lib/feature/home_feed/helper/home_feed_post_factory.dart`
  - still supports local post construction.
- `lib/feature/home_feed/controller/create_post_controller.dart`
  - starts with a guest placeholder user (`Guest`, `guest`, placeholder avatar) until session context loads.
- `lib/feature/upload_manager/controller/upload_manager_controller.dart`
  - still ships static mock upload tasks.

### 4. Dashboard is wired to real admin APIs, but it still relies on flexible payload extraction and thin modules

- `src/services/apiClient.js`
  - uses `normalizePayload()` plus `extractItems()` to scan for arrays instead of binding to a strict module-specific contract.
- `src/components/AdminViews.jsx`
  - still acts as a large catch-all view layer for many admin modules.
- `src/pages/admin/support/SupportOperationsView.jsx`
  - manually re-wraps support tickets as `{ data: { items: ... } }` to fit shared extraction logic.

The dashboard does appear connected to real admin routes, but its rendering model still assumes compatibility payloads and broad generic list rendering.

### 5. Backend route coverage is broad, but some areas remain compatibility-heavy or operationally thin

The backend locally contains a large route surface, including:

- auth and account operations
- feed, posts, stories, reels, comments, likes
- chat, group chat, calls, live stream
- marketplace, jobs, events
- communities, groups, pages
- settings, localization, onboarding, accessibility, legal/help/support
- notifications and notification devices
- monetization, wallet, subscriptions, premium
- admin auth, admin dashboard, admin operations, audit, support operations

Representative controllers:

- `src/controllers/auth.controller.ts`
- `src/controllers/posts.controller.ts`
- `src/controllers/stories.controller.ts`
- `src/controllers/reels.controller.ts`
- `src/controllers/chat.controller.ts`
- `src/controllers/marketplace.controller.ts`
- `src/controllers/jobs.controller.ts`
- `src/controllers/events.controller.ts`
- `src/controllers/communities.controller.ts`
- `src/controllers/support.controller.ts`
- `src/controllers/settings.controller.ts`
- `src/controllers/notifications.controller.ts`
- `src/controllers/admin.controller.ts`
- `src/controllers/admin-ops.controller.ts`

The main issue is less "missing everything" and more "existing coverage is inconsistent in contract depth and production polish."

## Current Risk Summary

### High risk

- Backend cannot truthfully claim a normalized API contract while active controllers still expose mixed top-level aliases.
- Flutter cannot safely move to a strict contract yet because multiple repositories and services still depend on alias-based parsing.
- Flutter still ships some local/mock/placeholder runtime state on authenticated surfaces.

### Medium risk

- Dashboard support for many admin domains is present but still list-first and generic.
- Upload and media response contracts still expose several equivalent URL fields, making long-term client consistency harder.
- Realtime routes still mix canonical and compatibility fields, which increases maintenance cost for calls/live/group chat.

## Safest Next Implementation Slice

Because this session is writable only for `Socity_backend`, the safest immediate slice is:

1. Normalize backend response helpers and document a compatibility strategy.
2. Update backend controllers that still emit the noisiest mixed contracts:
   - `content.controller.ts`
   - `notifications.controller.ts`
   - `realtime.controller.ts`
   - `uploads.controller.ts`
   - `communities.controller.ts`
3. Preserve compatibility aliases temporarily while making `data` and `pagination` consistent.
4. In a follow-up cross-repo edit, update Flutter and dashboard parsers to consume only canonical `data` and `pagination`.
5. After both clients are updated, remove the temporary alias fields.

## Constraint In This Session

Only `G:\My Project\Socity_backend` is writable in the current environment. The Flutter and dashboard repos are available for read/audit, but cross-repo code fixes will require permission to write outside the backend workspace.
