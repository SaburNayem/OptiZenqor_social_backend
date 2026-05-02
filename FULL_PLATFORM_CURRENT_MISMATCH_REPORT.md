# FULL_PLATFORM_CURRENT_MISMATCH_REPORT

Audit date: 2026-05-03

Workspace audited from current local source:
- `G:\My Project\Socity_backend`
- `G:\My Project\OptiZenqor_social`
- `G:\My Project\OptiZenqor_social_dashboard`

## Scope

This report is based on current source inspection, local route scans, and the latest validated code changes already present in the three working trees. It replaces earlier stale assumptions where source has already moved forward.

## Backend route inventory summary

NestJS controller scan confirms broad route coverage across:
- app bootstrap, health, auth, uploads, feed, posts, stories, reels, chat, calls, live stream
- communities, groups, pages, marketplace, jobs, events
- notifications, preferences, onboarding, localization, accessibility, legal, support
- admin auth, dashboard, analytics, users, content, reports, support operations, marketplace, jobs, events, communities, pages, live streams, wallet, subscriptions, premium plans, notification campaigns, notification devices, audit logs, settings

Admin alias coverage already present in current backend source:
- `GET /admin/analytics`
- `GET /admin/roles`
- `GET /admin/chat-cases`
- `GET /admin/notifications`
- `DELETE /admin/notification-campaigns/:id`

This is an important correction from older reports that still described those routes as missing.

## Flutter API inventory summary

Flutter endpoint definitions and direct client calls reference a wide surface including:
- `/auth/*`, `/feed`, `/posts`, `/stories`, `/reels`, `/chat`, `/calls`, `/live-stream`
- `/communities`, `/pages`, `/events`, `/marketplace`, `/jobs`
- `/settings`, `/accessibility-support`, `/localization-support`, `/legal-compliance`
- `/follow-unfollow/*`, `/deep-link-handler/*`, `/share-repost/*`, `/polls-surveys/*`
- admin routes under `/admin/*` are still present in endpoint definitions even though they do not belong to the normal mobile runtime surface

## Dashboard API inventory summary

Dashboard API usage is real-backend oriented and centered around `/admin/*` endpoints through `VITE_API_BASE_URL`, including navigation coverage for:
- overview and analytics
- users, content moderation, reports
- support operations
- marketplace, jobs, events, communities, pages, live streams
- revenue, wallet, subscriptions, premium plans
- notification campaigns, notification devices
- admin sessions, audit logs, settings

The current dashboard problem is incomplete operational depth, not widespread mock dataset usage.

## Missing backend routes required by Flutter

No longer confirmed from current source for the previously flagged admin aliases:
- `/admin/analytics` exists
- `/admin/roles` exists
- `/admin/chat-cases` exists
- `/admin/notifications` exists

Still needing verification or deeper contract work:
- some Flutter features call routes that exist but still require stronger payload completeness so the app does not derive labels or lifecycle state on-device
- Flutter still carries endpoint constants for admin APIs that should be reviewed for cleanup or strict separation from end-user mobile flows

## Missing backend routes required by dashboard

Previously reported missing route is now present:
- `DELETE /admin/notification-campaigns/:id` exists in current source

Current dashboard/backend gaps are feature-depth gaps rather than outright missing list routes:
- many sections still need detail/create/edit/delete/action UI to fully exercise existing admin APIs
- some dashboard modules do not yet expose all available admin operations even though backend list endpoints exist

## Backend routes still using static/data-service/in-memory/default runtime data

Current status after the latest pass:
- runtime settings catalog authority has been moved onto persisted PostgreSQL tables:
  - `app_settings_section_catalog`
  - `app_settings_item_catalog`
- `src/services/settings-database.service.ts` now reads settings sections and items from database-backed catalog rows instead of `SettingsDataService`
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
