# FULL_PLATFORM_CURRENT_MISMATCH_REPORT

Audit date: 2026-05-08

## Local + GitHub Scope

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

GitHub comparison summary:

- backend local matches GitHub HEAD
- dashboard local matches GitHub HEAD
- Flutter local differs from GitHub HEAD
- web frontend local differs from GitHub HEAD

## Backend Route Inventory Summary

Current local backend route coverage includes:

- app bootstrap, health, docs, auth
- recommendations, notification preferences, safety, legal, security
- users, profile, follow/block/bookmark/archive/hide
- feed, posts, comments, likes, media viewer, share/repost
- stories, reels, uploads
- chat, group chat, calls, live stream, socket contract
- onboarding, personalization, accessibility, localization, maintenance, offline sync
- communities, groups, pages
- marketplace, jobs, events
- notifications, wallets, subscriptions, monetization, premium plans
- support, report center, verification request
- admin auth, admin dashboard, admin users/content/reports/settings/audit
- admin marketplace/jobs/events/communities/pages/live streams
- admin revenue/wallet/subscriptions/premium plans
- admin notification devices/campaigns and support operations

## Flutter Endpoint Inventory Summary

Flutter references backend APIs for:

- auth/session
- profile/users/follow/block
- feed/posts/comments/reactions
- stories/reels
- chat/group chat/calls/live streams
- communities/groups/pages
- marketplace/drafts/offers/chats/orders
- jobs/applications/alerts/companies
- events
- notifications/devices/preferences
- settings/accessibility/localization/legal
- support
- verification, onboarding, personalization, offline sync

Flutter-specific mismatches still active:

- `lib/core/data/api/api_payload_reader.dart` still tolerates many legacy alias shapes
- `lib/feature/stories/screen/story_text_composer_screen.dart` creates `local_story_*`
- `lib/feature/stories/screen/story_preview_screen.dart` creates `local_story_*`
- `lib/feature/stories/screen/story_view_screen.dart` contains local story special handling
- `lib/feature/communities/service/community_local_data_source.dart` persists full community payload cache
- `lib/feature/posts/repository/posts_repository.dart` persists local drafts
- admin endpoints remain present in mobile endpoint constants and should be isolated from normal app runtime

## Dashboard Endpoint Inventory Summary

Dashboard currently calls real admin APIs for:

- admin auth/session
- overview
- users
- content moderation
- reports
- support operations
- marketplace
- jobs
- events
- communities
- pages
- live streams
- dashboard revenue
- wallet
- subscriptions
- wallet-subscriptions
- premium plans
- notification campaigns
- notification devices
- admin settings
- audit logs

Dashboard-specific mismatches still active:

- many modules remain list/detail/export only
- mutations are missing for marketplace, jobs, events, communities, pages, live streams, wallet/subscription actions
- confirm dialog and generalized detail drawer patterns are still missing
- `src/components/AdminViews.jsx` is still too large and central

## Web Endpoint Inventory Summary

Web frontend currently calls:

- auth/login, signup, forgot-password, me
- profile and user-profile follower/following routes
- chat threads and thread messages
- settings
- marketplace
- events
- pages
- calls
- live-stream
- users
- feed
- stories
- reels
- jobs-networking
- communities
- trending
- notifications

Web-specific mismatches still active:

- `src/data/mockSocialData.ts` still exists with production-like demo data
- `src/lib/api.ts` still falls back to `http://localhost:3000`
- `src/lib/api.ts` still synthesizes IDs, avatar URLs, fallback copy, and display labels
- `src/hooks/useSocialApp.ts` still creates optimistic-only local posts/comments/messages
- UI still uses direct avatar fallbacks in multiple components

## Missing Route Mismatches

High-confidence current state:

- major missing-route problems are fewer than before
- the main problem is now payload shape/completeness and client-side fake fallback behavior, not wholesale absent route families

Known route/integration mismatches still active:

- web uses `/notifications` as a list source while backend historically exposed mixed notifications overview payloads
- web uses `/jobs-networking` as a user-facing list/overview source while the response still carries a large mixed object
- Flutter settings, marketplace, jobs, and support features still rely on permissive parsing because backend payload shape is not yet strict across all modules

## Response Shape Mismatches

Still active in backend:

- `src/controllers/learning-courses.controller.ts`
- `src/controllers/polls-surveys.controller.ts`
- remaining alias-heavy routes in `src/controllers/jobs.controller.ts`
- parts of `src/services/admin-database.service.ts`
- parts of `src/services/experience-database.service.ts`

Normalized in this pass:

- `src/controllers/notifications.controller.ts`
- `src/controllers/discovery.controller.ts`
- `src/controllers/content.controller.ts`
- `src/controllers/jobs.controller.ts`
- `src/controllers/communities.controller.ts`
- `src/controllers/events.controller.ts`
- `src/controllers/uploads.controller.ts`
- `src/controllers/realtime.controller.ts`

## Auth / Token Mismatches

Current status:

- admin auth and user auth are correctly separated at route-guard level
- dashboard uses admin auth flows
- mobile and web use user auth flows

Remaining issues:

- web and Flutter clients still contain permissive/fallback behavior that can hide auth contract errors
- mobile endpoint constants still include admin endpoints that should not be part of normal end-user runtime

## Media URL Mismatches

Still active:

- web still generates avatar/media fallbacks client-side
- Flutter still relies on media resolution fallback behavior
- backend media payloads are not yet fully normalized across posts, stories, reels, marketplace, live streams, and profiles

## Pagination / Search / Filter Mismatches

Still active:

- not every useful list route has consistent `page`, `limit`, `search`, and filters
- dashboard assumes pagination metadata exists, but some feature routes still behave like unpaginated arrays
- admin list services are more advanced than many public/mobile-facing feature routes

## Persistence Gaps Still Open

Needed relational history models still missing:

- support assignment history
- support SLA history
- support action history
- moderation action history
- moderation escalation history
- moderation assignee history
- report escalation/assignment history
- media asset ownership/entity mapping

## Validation Snapshot

Passed during this audit:

- backend `npm install`
- backend `npm run prisma:generate`
- backend `npm run prisma:migrate`
- backend `npm run seed:dev` is not available in current `package.json`
- backend `npm run typecheck`
- backend `npm run build`
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
- backend smoke:
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

Not yet completed in this turn:

- backend safe end-user login smoke without introducing new runtime data

## Highest-Priority Remaining Work

1. Finish backend response normalization for learning courses, polls/surveys, remaining jobs aliases, and service-level alias emitters.
2. Add relational Prisma history tables for support and moderation workflows.
3. Remove web mock/static production behavior and strict-fail on missing backend data.
4. Remove or isolate mobile local production IDs and permissive alias parsing.
5. Turn dashboard list modules into full CRUD/action control surfaces for the existing admin APIs.
- `SettingsDataService` still exists as a legacy/dev seed source, but it is no longer the production runtime authority for settings section/item catalogs

Still remaining production-style blockers:
- settings, accessibility, legal, personalization, and related catalog-style flows still have some fallback shaping through operational settings and dynamic service defaults
- create-option style payloads still return runtime-composed catalogs in several places
- `src/controllers/communities.controller.ts` had mixed response shapes and fake defaults; this pass removed fake community create defaults and normalized several success payloads, but compatibility aliases still remain on list endpoints

## Flutter mock/static/local fake runtime behavior still present

Confirmed and still relevant after this pass:
- `lib/feature/home_feed/helper/home_feed_post_factory.dart`
  - still builds local-only posts with `local_*` ids for production flow paths
- `lib/feature/home_feed/controller/main_shell_controller.dart`
  - no longer fabricates guest display name/avatar, but still carries an empty guest-shaped holder object internally
- `lib/feature/follow_unfollow/screen/follow_list_screen.dart`
  - still contains static empty-state banner naming that should be revisited once live follow state and errors are fully normalized

Improved during this workstream:
- `lib/feature/settings/controller/settings_controller.dart`
  - no longer acts as a static settings catalog authority
- `lib/feature/settings/screen/settings_screen.dart`
  - now fetches the settings catalog from backend and shows honest unauthorized/loading/error/empty states
- `lib/core/data/service/deep_link_service.dart`
  - now resolves links through `POST /deep-link-handler/resolve`
- `lib/feature/polls_surveys/screen/polls_surveys_screen.dart`
  - removed fake hero metrics and fake snackbar-only actions
- `lib/feature/chat/screen/chat_screen.dart`
  - removed fake search action behavior
- `lib/core/webrtc/webrtc_service.dart`
  - removed fake preview success path
- `lib/feature/share_repost_system/widget/share_post_action_sheet.dart`
  - removed hardcoded public share URL construction and now stays honest when backend has not provided a durable share link
- `lib/feature/deep_link_handler/screen/deep_link_handler_screen.dart`
  - removed the prefilled fake deep link and now requires an explicit provided link

## Dashboard views still incomplete, generic, or missing CRUD/action support

Current state:
- dashboard no longer appears to rely on broad sample business datasets in the scanned admin surface
- however, several sections still behave like thin list views instead of full admin operations consoles
- detail drawers, create/edit flows, confirm actions, exports, and pagination/search/filter depth are still uneven across sections

Improved during this workstream:
- sections for events, communities, pages, and live streams have been extracted out of `src/components/AdminViews.jsx` into `src/pages/admin/*`
- reusable export support was added in `src/components/common/AdminPrimitives.jsx`

Still incomplete:
- end-to-end action coverage for every navigation section
- broader professional admin UX polish and parity across all modules
- full detail workflows for moderation, support, monetization, and operations-heavy sections

## Response shape mismatches

Target contract:

```json
{ "success": true, "message": "string", "data": {}, "pagination": {} }
```

Current status:
- backend utility support improved so `successResponse(...)` now emits top-level `pagination` when provided
- many endpoints already fit the normalized contract
- compatibility aliases still remain on some controllers for Flutter/dashboard transition safety

Known remaining mismatches:
- list endpoints such as communities/pages/groups still emit aliases like `items`, `results`, `communities`, `pages`, or `groups`
- some legacy settings/support-style responses still expose convenience fields outside `data`
- Flutter and dashboard parsers still tolerate multiple shapes, which shows contract instability

## Auth/token/session mismatch risks

Current risks:
- user auth and admin auth remain separate, which is correct, but both surfaces need continued guardrails to prevent token mix-ups
- Flutter endpoint constants still include admin paths that should not be part of normal mobile app runtime behavior
- Flutter still contains guest-user fallback state in places where unauthenticated behavior should be explicit instead of synthetic

Admin auth status from source and smoke checks:
- `POST /admin/auth/login`, `GET /admin/auth/me`, `POST /admin/auth/refresh`, `POST /admin/auth/logout`, `GET /admin/auth/sessions`, `PATCH /admin/auth/sessions/:id/revoke` are present
- admin session persistence is implemented, but full smoke coverage for every dashboard navigation endpoint still remains incomplete

## Upload/media URL mismatch risks

Current risks:
- Flutter still relies on client-side URL resolution helpers because backend media contracts are not yet fully uniform
- posts, stories, marketplace, profiles, pages, communities, and admin surfaces still need one consistent media URL contract
- some backend payloads likely emit relative media paths while others emit already-resolved URLs

## Database models missing or under-modeled

Improved during this workstream:
- added `NotificationCampaignActionHistory`
- added additive migration `20260502_notification_campaign_action_history`
- notification campaign actions are now persisted rather than only applied procedurally
- added persisted settings catalog tables and migration:
  - `app_settings_section_catalog`
  - `app_settings_item_catalog`

Still missing or under-modeled:
- deeper support assignment/SLA/action workflow as a first-class support-operations history model
- deeper moderation action, escalation, and assignee history model beyond shallow case state
- catalog/config tables needed to replace remaining runtime settings/accessibility/localization/legal defaults
- fuller lifecycle snapshot coverage for calls/live flows if mobile and dashboard need operational detail history

## Validation status from latest implementation pass

Backend:
- `npm install` passed
- `npm run typecheck` passed
- `npm run build` passed
- `npm run prisma:migrate` passed
- `npm run seed:dev` passed for local dev validation
- backend smoke endpoints `GET /health`, `GET /health/database`, and `GET /docs-json` passed
- `npm run prisma:generate` still fails on local Windows Prisma engine file lock

Flutter:
- `flutter pub get` passed
- `dart format` passed on touched files
- `flutter analyze` passed
- `flutter test` passed
- upstream `pub.dev` advisory decode warnings still appear after successful commands

Dashboard:
- `npm install` passed
- `npm run lint` passed
- `npm run build` passed

## Completion percentages

Current-source estimate after the latest pass:
- Backend: 86%
- Flutter: 70%
- Dashboard: 79%
- Database coverage: 85%
- Full platform: 80%

## Priority queue from current source

1. Finish removing the remaining operational-setting and fallback shaping around settings/localization/accessibility/legal responses now that section/item catalog authority is in PostgreSQL.
2. Normalize remaining mixed-shape responses, especially settings/support/community/page compatibility responses.
3. Remove Flutter fake guest/local runtime behavior in home feed and remaining authenticated surfaces.
4. Finish backend payload completeness so Flutter no longer derives share labels, lifecycle labels, or media URL behavior locally.
5. Expand dashboard sections from thin list views into full detail/action modules across all navigation sections.
6. Continue deeper support/moderation/call/live persistence where dashboards and mobile flows still rely on shallow state.
