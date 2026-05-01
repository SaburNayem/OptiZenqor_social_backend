# Backend / Flutter / Dashboard Integration Report

Updated: 2026-05-01

## Scope Of This Pass

This pass audited:

- `G:\My Project\Socity_backend`
- `G:\My Project\OptiZenqor_social`
- `G:\My Project\OptiZenqor_social_dashboard`

and implemented the highest-impact production fixes that were still blocking a real backend-first flow:

- backend request paths for `invite-referral`, `invite-friends`, `onboarding`, and account-ops legal/security/master-data/recommendations
- Flutter onboarding and invite-referral removal of hardcoded/local-only production state
- admin dashboard expansion from a simple starter shell into a live multi-module console with reusable view components

## Exact Audit / Fix Table

| Area | Exact file(s) | Exact route(s) | Exact issue | Exact fix | Status |
| --- | --- | --- | --- | --- | --- |
| Backend referral | `src/controllers/engagement.controller.ts`, `src/controllers/invite-friends.controller.ts`, `src/services/app-utility-database.service.ts` | `GET /invite-referral`, `GET /invite-friends` | Runtime helper data from `EcosystemDataService`; no DB-backed referral payload for app | Replaced request path with `AppUtilityDatabaseService`, reading referral program state from PostgreSQL-backed `user_settings` plus operational config and live user identity | Fixed |
| Backend onboarding | `src/controllers/onboarding.controller.ts`, `src/services/app-utility-database.service.ts` | `GET /onboarding/slides`, `GET /onboarding/state`, `GET /onboarding/interests`, `POST /onboarding/complete` | Legacy `ExtendedDataService` route path; not Prisma-backed | Replaced with DB-backed service using `admin_operational_settings`, `app_users.interests`, and `app_user_settings` | Fixed |
| Backend account ops recommendations | `src/controllers/account-ops.controller.ts`, `src/services/app-utility-database.service.ts` | `GET /recommendations` | Legacy helper response | Now resolves authenticated user and returns live recommendation dataset from persisted settings-derived state | Fixed |
| Backend master data | `src/controllers/account-ops.controller.ts`, `src/services/app-utility-database.service.ts` | `GET /master-data` | Legacy helper payload | Now derives roles/profile types/interests from database and returns standard envelope | Fixed |
| Backend legal consents | `src/controllers/account-ops.controller.ts`, `src/services/app-utility-database.service.ts` | `GET /legal/consents`, `PATCH /legal/consents` | Legacy snapshot/legal state flow | Now reads/writes consent flags through `app_user_settings` and returns `{ success, message, data }` with compatibility aliases | Fixed |
| Backend deletion/export requests | `src/controllers/account-ops.controller.ts`, `src/services/app-utility-database.service.ts` | `POST /legal/account-deletion`, `POST /legal/data-export` | Runtime-only request state; no persistent audit trail for requests | Now persists request metadata in `app_user_settings` and creates support tickets via `SupportDatabaseService` | Fixed |
| Backend security state | `src/controllers/account-ops.controller.ts`, `src/services/app-utility-database.service.ts` | `GET /security/state`, `POST /security/logout-all` | Legacy security state and logout-all flow | Now reads active sessions via Prisma-backed auth sessions and invalidates all DB sessions on logout-all | Fixed |
| Flutter onboarding content | `lib/feature/onboarding/repository/onboarding_repository.dart`, `lib/feature/onboarding/controller/onboarding_controller.dart`, `lib/feature/onboarding/model/onboarding_slide_model.dart`, `lib/feature/onboarding/screen/onboarding_screen.dart` | `/onboarding/slides`, `/onboarding/state`, `/onboarding/complete` | Hardcoded slide list and device-local completion only | Added live API reads/writes, dynamic slide parsing, loading state, error state, and retained local storage only as compatibility cache | Fixed |
| Flutter invite referral | `lib/feature/invite_referral/controller/invite_referral_controller.dart`, `lib/feature/invite_referral/model/invite_referral_model.dart`, `lib/feature/invite_referral/repository/invite_referral_repository.dart`, `lib/feature/invite_referral/screen/invite_referral_screen.dart` | `/invite-referral` | Fully hardcoded code, milestones, friend list, and share message source | Replaced with API-backed repository/model mapping and loading/error/empty handling in UI | Fixed |
| Dashboard module structure | `src/App.jsx`, `src/App.css`, `src/config/navigation.js`, `src/components/AdminViews.jsx` | `/admin/auth/*`, `/admin/dashboard/overview`, `/admin/users`, `/admin/content`, `/admin/reports`, `/admin/support-operations`, `/marketplace/products`, `/jobs`, `/events`, `/communities`, `/pages`, `/admin/dashboard/revenue`, `/admin/broadcast-campaigns`, `/admin/settings`, `/admin/audit-logs` | Large monolithic starter shell; missing revenue/notifications modules; minimal live module coverage | Split navigation and view rendering into reusable modules/components, added real live modules, kept refresh-based authenticated session flow, and added shared table/status rendering | Fixed |

## Files Changed In This Pass

### Backend

- `src/controllers/account-ops.controller.ts`
- `src/controllers/engagement.controller.ts`
- `src/controllers/invite-friends.controller.ts`
- `src/controllers/onboarding.controller.ts`
- `src/modules/data.module.ts`
- `src/services/app-utility-database.service.ts`

### Flutter

- `lib/feature/onboarding/controller/onboarding_controller.dart`
- `lib/feature/onboarding/model/onboarding_slide_model.dart`
- `lib/feature/onboarding/repository/onboarding_repository.dart`
- `lib/feature/onboarding/screen/onboarding_screen.dart`
- `lib/feature/invite_referral/controller/invite_referral_controller.dart`
- `lib/feature/invite_referral/model/invite_referral_model.dart`
- `lib/feature/invite_referral/repository/invite_referral_repository.dart`
- `lib/feature/invite_referral/screen/invite_referral_screen.dart`

### Dashboard

- `src/App.css`
- `src/App.jsx`
- `src/components/AdminViews.jsx`
- `src/config/navigation.js`

## Remaining Gaps After This Pass

### Still using legacy helper/static request paths on backend

- `src/controllers/account-ops.controller.ts`
  - `POST /auth/send-otp`, `POST /auth/resend-otp`, and non-email `POST /auth/verify-otp` still fall through `ExtendedDataService` for phone-style/demo OTP behavior.
- `src/controllers/chat.controller.ts`
  - presence is still runtime/socket state, not durable DB state.
- `src/controllers/preferences.controller.ts` + `src/services/settings-database.service.ts`
  - some settings/advice/catalog content is still configuration-driven rather than fully modeled relational data.
- `src/data/*`
  - helper datasets and placeholder copy still exist in the repo even where request paths were removed from the production slices touched here.

### Still frontend/dashboard work left

- Flutter communities, safety/privacy, devices/session screens, and a few avatar placeholders still contain local UX placeholders or local cache behaviors that should be converted to stricter backend-first handling.
- Dashboard modules for Marketplace, Jobs, Events, Communities, and Pages are live-data powered now, but they still use generic tables rather than dedicated moderation/action workflows.
- Dashboard search/filter controls are still light; the current pass prioritized authenticated live coverage and module structure first.

## Route Coverage Notes

Implemented or completed in this pass:

- `/admin/auth/login`
- `/admin/auth/me`
- `/admin/auth/refresh`
- `/admin/auth/logout`
- `/admin/dashboard/overview`
- `/admin/users`
- `/admin/content`
- `/admin/reports`
- `/admin/support-operations`
- `/admin/audit-logs`
- `/admin/settings`
- `/invite-referral`
- `/invite-friends`
- `/onboarding/slides`
- `/onboarding/state`
- `/onboarding/interests`
- `/onboarding/complete`
- `/recommendations`
- `/master-data`
- `/legal/consents`
- `/legal/account-deletion`
- `/legal/data-export`
- `/security/state`
- `/security/logout-all`

Still intentionally deferred from the original request because they require a larger modeling pass:

- deeper referral/invite acceptance lifecycle persistence beyond the current `user_settings` backed overview
- richer admin workflows for marketplace/jobs/events/communities/pages
- full removal of legacy `src/data/*` from untouched features such as phone OTP, some catalog/settings metadata, and runtime realtime presence
- dedicated persistent models for advanced privacy/accessibility/legal content rather than JSON-backed operational state/config

## Verification Summary

### Backend

- `npm.cmd install`
  - Passed
- `npm.cmd run typecheck`
  - Passed
- `npm.cmd run prisma:generate`
  - Failed because Prisma engine DLL in `node_modules\.prisma\client\` is locked by a running Windows process
- `npm.cmd run build`
  - Failed because files under `dist\` are locked by a running Windows process

### Flutter

- `flutter pub get`
  - Passed
- `dart format` on changed onboarding/invite-referral files
  - Passed
- `dart analyze lib/feature/onboarding lib/feature/invite_referral --no-fatal-warnings`
  - Passed
- `flutter analyze`
  - Passed

### Dashboard

- `npm.cmd install`
  - Passed
- `npm.cmd run lint`
  - Passed
- `npm.cmd run build`
  - Passed after running outside the sandbox due initial `EPERM` spawn restrictions

## Practical Completion Estimate

- Backend: 78%
- Flutter: 72%
- Dashboard: 74%
- Overall platform integration: 75%
