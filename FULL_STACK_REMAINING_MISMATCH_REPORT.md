# Full Stack Remaining Mismatch Report

Generated: 2026-05-02

## Latest Implementation Delta

Fixed in this pass:

- admin update DTO validation was tightened for marketplace, jobs, and events
- admin support operations now support ticket detail, assignment, reply, and SLA metadata updates with audit logs
- admin notification campaigns now support detail plus send/cancel/delete lifecycle actions
- admin notification devices now support detail plus delete
- Flutter blocked/muted, accessibility, localization, personalization onboarding, and legal compliance surfaces now fail explicitly on bad backend payloads instead of silently accepting empty state
- dashboard notification campaigns are no longer read-only

Still remaining after this pass:

- backend runtime default config/catalog data still needs dedicated Prisma-backed catalog persistence
- dashboard still needs broader module-level mutation UX outside the notification/admin support slice
- Flutter still needs the same strict cleanup in additional server-owned features, especially marketplace aggregates and jobs networking

This report lists the concrete remaining mismatches found during the cross-repo audit of:

- `G:\My Project\Socity_backend`
- `G:\My Project\OptiZenqor_social`
- `G:\My Project\OptiZenqor_social_dashboard`

The focus is production-readiness: PostgreSQL + Prisma as the single source of truth, no runtime mock/static business data, compatible `{ success, message, data }` responses, and protected admin/API flows.

## Backend

| File path | Current problem | Required backend endpoint/model | Required frontend/dashboard fix |
| --- | --- | --- | --- |
| `src/services/account-state-database.service.ts` | `DEFAULT_SETTINGS_STATE` seeds runtime defaults for privacy, notifications, messaging, security, feed, and creator flags when no persisted row exists. This means live settings can come from code instead of Prisma rows. | Add Prisma-backed settings catalog/state bootstrap so each user has persisted settings records. Keep code defaults only for seed/migration/bootstrap, not request-time fallback. | Flutter settings, accessibility, push preferences, legal/privacy, and discovery preference screens should read fully persisted values only. |
| `src/services/settings-database.service.ts` | `DEFAULT_PUSH_PREFERENCES` returns runtime static push categories when `preferences.push_categories` is absent. Legal and localization sections also inject fallback values directly from code. | Add persisted settings catalog entries or normalized Prisma tables for push categories, localization options, and legal document metadata. Add mutation endpoints for push preference updates. | Flutter `push_notification_preferences`, `localization_support`, `legal_compliance`, and settings catalog screens should stop relying on code-defined defaults. |
| `src/services/app-utility-database.service.ts` | Runtime defaults remain embedded for onboarding slides, referral milestones, deep-link prefixes, share/repost options, localization options, maintenance/app-update copy, and preview flows for unauthenticated users. | Persist these as operational settings or dedicated Prisma models instead of code arrays. Replace preview-only operational setting branches with normalized tables where the app expects live data. | Flutter onboarding, personalization, share/repost, maintenance, update-flow, and localization screens should consume persisted backend-managed records only. |
| `src/services/support-database.service.ts` | Support contact mail data still falls back to env/static strings. | Add persisted support operational settings or support config table. | Flutter support/help and dashboard support operations should display backend-managed support config. |
| `src/services/admin-database.service.ts` | Admin list endpoints exist for many resources, but CRUD/action coverage is incomplete for `marketplace`, `jobs`, `events`, `communities`, `pages`, `notification campaigns`, `support operations`, `wallet/subscriptions`, and `audit exports`. Dashboard cannot perform many real actions yet. | Add admin `POST/PATCH/DELETE` and action routes for approve/reject/suspend/archive/feature/send/retry/resolve flows; log all mutations to `AdminAuditLog`. | Dashboard must call new admin mutation endpoints instead of rendering read-only tables. |
| `src/controllers/admin.controller.ts` | Admin routes cover read flows but not complete dashboard actions for marketplace/job/event/community/page/support/revenue modules. | Add missing admin DTOs + endpoints for resource moderation and operational actions. | Dashboard action buttons/modals must be wired to those endpoints. |
| `src/controllers/admin-ops.controller.ts` | Notification campaigns still support list/create only, and support operations only cover ticket status/priority/admin-note updates. Assignment, reply, SLA, and campaign lifecycle actions are still missing. | Add campaign update/send/cancel/delete APIs plus support ticket assignment/reply/SLA routes. | Dashboard notifications and support pages should expose the remaining operational controls. |
| `src/controllers/notifications.controller.ts` | Notifications overview mixes inbox + campaign + settings state into one payload but does not expose admin device management actions beyond register/unregister user device. | Add device deactivate/reactivate, campaign detail/update, and preference update routes with strict response contracts. | Flutter notifications/push settings and dashboard device management should use explicit contracts, not mixed fallback parsing. |
| `src/services/realtime-state.service.ts` | Chat presence is runtime memory state only. It is not durable and does not satisfy the “single source of truth” rule for presence/lifecycle data. | Add Prisma model/table for chat presence and optionally call/session heartbeat snapshots if presence must survive process restarts. | Flutter chat/calls/live features should rely on backend-backed presence/session snapshots. |
| `src/services/experience-database.service.ts` | Several jobs/learning/polls/personalization flows are derived from JSON blobs in user settings with generated fallback IDs and synthetic labels when records are missing. | Normalize learning courses, polls/surveys, job alerts, recruiter profile, employer profile, and personalization metadata into Prisma-backed tables where those flows are first-class features. | Flutter learning, polls, jobs networking, and personalization screens should stop depending on inferred/generated fallback entries. |
| `prisma/schema.prisma` | Core content models are present, but there are no normalized tables yet for settings catalog/config, chat presence, support config, localization catalog, accessibility catalog, admin analytics snapshots, or richer admin operational actions. | Add missing Prisma models and migrations for persisted app/admin configuration and operational state. | Flutter and dashboard clients can then consume explicit contracts without code-derived defaults. |

## Flutter App

| File path | Current problem | Required backend endpoint/model | Required frontend/dashboard fix |
| --- | --- | --- | --- |
| `G:\My Project\OptiZenqor_social\lib\feature\pages\repository\pages_repository.dart` | Local auth-session dependency has been removed, but page list failures still collapse to empty data instead of surfacing repository errors to the UI. | Backend page follow/create ownership is already auth-backed; the remaining need is stronger error propagation. | Keep the backend-driven follow flow and add explicit error/retry UI in the pages screen/controller. |
| `G:\My Project\OptiZenqor_social\lib\feature\marketplace\repository\marketplace_repository.dart` | Runtime fallback/derived data remains for sellers, categories, draft imagery, timestamps, delivery options, and order/chat/offer parsing when payloads are incomplete. This still produces UI data from client-side inference. | Complete backend marketplace payloads for categories, sellers, drafts, compare list, chats, offers, orders, and saved/recent/trending searches. | Stop deriving runtime seller/category/search state in the Flutter layer once backend contracts are complete. |
| `G:\My Project\OptiZenqor_social\lib\feature\blocked_muted_accounts\repository\blocked_muted_accounts_repository.dart` | Returns empty lists on API mismatch/failure and depends on broad payload-shape guessing. | Backend blocked/muted endpoints exist but should expose stable payload keys and full mute/block records. | Tighten parsing and display real empty states only when backend data is actually empty. |
| `G:\My Project\OptiZenqor_social\lib\feature\calls\repository\calls_repository.dart` | Call list and start flow are API-backed, but parsing still falls back to generic labels/timestamps and there is no full lifecycle sync for incoming/ringing/ended state. | Add durable Prisma-backed call lifecycle/presence records and richer response payloads. | Flutter calls screens should use backend lifecycle state instead of inferred defaults. |
| `G:\My Project\OptiZenqor_social\lib\feature\support_help\repository\support_help_repository.dart` | Help overview is API-backed, but it only reads aggregate counts and does not support full support operations/workflows from app screens. | Expand support contracts for ticket detail, ticket update, chat thread detail, and support config. | Add richer API usage for support/help screens and explicit retry/error handling. |
| `G:\My Project\OptiZenqor_social\lib\feature\jobs_networking\repository\jobs_networking_repository.dart` | Jobs flows are mostly API-backed, but multiple sections depend on aggregate payload guessing and empty fallbacks for alerts/companies/profile/applicants. | Stabilize separate jobs, alerts, companies, applicant-management, profile, and employer endpoints. | Replace aggregate fallback parsing with direct endpoint contracts and full error states. |
| `G:\My Project\OptiZenqor_social\lib\feature\localization_support\controller\localization_support_controller.dart` | API-backed, but backend still supplies code-defined locale defaults when settings are missing. | Persist localization catalog/defaults in Prisma-backed configuration. | Keep controller but remove backend-coded locale fallback behavior. |
| `G:\My Project\OptiZenqor_social\lib\feature\accessibility_support\controller\accessibility_support_controller.dart` | API-backed, but screen mutates generic `settings/state` keys and relies on backend default option generation. | Persist accessibility catalog/options in Prisma-backed configuration. | Use explicit accessibility preference contracts rather than inferred title-to-key mapping. |
| `G:\My Project\OptiZenqor_social\lib\feature\personalization_onboarding\controller\personalization_onboarding_controller.dart` | API-backed, but backend still falls back to preview/config values and inferred interest lists. | Normalize personalization interest catalog and selection state in Prisma. | Keep controller/routes but remove preview/data-guess branches from backend. |
| `G:\My Project\OptiZenqor_social\lib\feature\legal_compliance\controller\legal_compliance_controller.dart` | API-backed, but backend consent metadata/documents are still hardcoded defaults. | Persist legal document metadata/versioning in Prisma-backed config. | Keep controller but use persisted document/version payloads. |

## Dashboard

| File path | Current problem | Required backend endpoint/model | Required frontend/dashboard fix |
| --- | --- | --- | --- |
| `G:\My Project\OptiZenqor_social_dashboard\src\App.jsx` | Dashboard session/auth exists, and support plus notification devices now have real query/action controls, but most other admin sections are still read-only. | Add missing admin mutation routes for marketplace, jobs, events, communities, pages, live streams, wallet/subscriptions, notification campaigns, and audit exports. | Add per-page create/update/delete/moderation actions, confirmation dialogs, optimistic refresh, and error handling. |
| `G:\My Project\OptiZenqor_social_dashboard\src\components\AdminViews.jsx` | Tables are connected to admin APIs, and support plus notification devices now have filters/pagination/action/detail UI, but most pages still lack search, filters, sort controls, detail drawers, create/edit forms, and action modals. | Backend list endpoints already support some pagination/search; more mutation endpoints are still needed. | Redesign remaining pages into production admin UX with responsive filters, drawers/modals, action forms, and per-module controls. |
| `G:\My Project\OptiZenqor_social_dashboard\src\config\navigation.js` | Navigation points to many admin list endpoints, but the UI does not yet expose corresponding admin workflows. | Complete route coverage for admin operational actions. | Keep nav entries, but wire each page to full query/action state. |
| `G:\My Project\OptiZenqor_social_dashboard\.env.example` | Localhost is documented in env example, which is acceptable, but runtime code bypasses env by hardcoding a hosted fallback. | No backend change required. | Keep env example only; remove runtime fallback in code. |

## Highest Priority Implementation Order

1. Replace backend request-time defaults for settings/localization/share/onboarding/support config with persisted Prisma-backed config/state.
2. Expand admin mutation API coverage for dashboard operational pages.
3. Add support assignment/reply workflows and notification campaign lifecycle actions.
4. Extend dashboard query/action UX beyond support and notification devices into the remaining modules.
5. Add explicit Flutter error/retry states to the repositories that now fail closed instead of falling back locally.

## Notes

- Many controllers already return the correct top-level `{ success, message, data }` envelope, but several also add duplicate top-level aliases like `items`, `results`, or `notifications`. That is useful for compatibility, but it also masks contract drift. The follow-up contract docs should clearly document the canonical shape and any temporary aliases.
- The backend is substantially Prisma-backed already. The main remaining production gap is not “static arrays everywhere”; it is request-time defaulting, aggregate payload guessing, and missing admin/app mutation coverage.
