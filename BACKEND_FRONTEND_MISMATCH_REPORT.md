# Backend / Flutter / Dashboard Mismatch Report

Updated: 2026-05-02

## Summary

This pass closed the two highest-value mismatches that were still visible in the current working tree:

- the dashboard was still calling several app-facing routes instead of admin APIs
- Flutter settings state was still stored locally for server-owned account settings

## Backend Route vs Client Usage

| Surface | Client file(s) | Route in client | Backend route status | State after this pass |
| --- | --- | --- | --- | --- |
| Dashboard overview | `src/config/navigation.js` | `/admin/dashboard/overview` | Exists and Prisma-backed | Aligned |
| Dashboard users | `src/config/navigation.js` | `/admin/users` | Exists and Prisma-backed | Aligned |
| Dashboard content | `src/config/navigation.js` | `/admin/content` | Exists and Prisma-backed | Aligned |
| Dashboard reports | `src/config/navigation.js` | `/admin/reports` | Exists and Prisma-backed | Aligned |
| Dashboard support | `src/config/navigation.js` | `/admin/support-operations` | Exists and Prisma-backed | Aligned |
| Dashboard marketplace | `src/config/navigation.js` | `/admin/marketplace` | Exists and Prisma-backed | Fixed from app route mismatch |
| Dashboard jobs | `src/config/navigation.js` | `/admin/jobs` | Exists and Prisma-backed | Fixed from app route mismatch |
| Dashboard events | `src/config/navigation.js` | `/admin/events` | Exists and Prisma-backed | Fixed from app route mismatch |
| Dashboard communities | `src/config/navigation.js` | `/admin/communities` | Exists and Prisma-backed | Fixed from app route mismatch |
| Dashboard pages | `src/config/navigation.js` | `/admin/pages` | Exists and Prisma-backed | Fixed from app route mismatch |
| Dashboard live streams | `src/config/navigation.js` | `/admin/live-streams` | Exists and Prisma-backed | Aligned |
| Dashboard wallet/subscriptions | `src/config/navigation.js` | `/admin/wallet-subscriptions` | Exists and Prisma-backed alias | Aligned |
| Dashboard notification devices | `src/config/navigation.js` | `/admin/notification-devices` | Exists and Prisma-backed | Aligned |
| Flutter settings state | `lib/feature/settings/repository/settings_preferences_repository.dart` | `/settings/state` | Exists and user-authenticated | Fixed from local-only mismatch |

## Database-Backed vs Static / Local-Only

### Resolved in this pass

| Area | Before | After |
| --- | --- | --- |
| Dashboard operational modules | Mixed admin routes and app-facing routes | Admin routes only |
| Dashboard base URL | Defaulted to localhost when env not set | Defaults to deployed Vercel backend |
| Flutter settings state | Shared-preferences local persistence for server-owned data | Backend `/settings/state` source of truth |
| Live admin views | Generic fallback rendering for several modules | Explicit live tables for admin operations |

### Still remaining

| Area | Current gap |
| --- | --- |
| Backend settings catalog | `SettingsDataService` still participates in production responses |
| Backend OTP / legacy utilities | Some untouched flows still depend on older helper/static services |
| Flutter server-owned settings UX | Better explicit error/retry UI still needed in some screens |
| Dashboard admin workflows | Read/list coverage is stronger than mutation/action workflow depth |

## Files Audited Most Directly In This Pass

### Backend

- `prisma/schema.prisma`
- `src/controllers/admin.controller.ts`
- `src/controllers/admin-ops.controller.ts`
- `src/services/admin-database.service.ts`
- `src/services/settings-database.service.ts`
- `src/data/admin-ops-data.service.ts`
- `src/data/platform-data.service.ts`
- `src/modules/data.module.ts`
- `src/modules/admin-api.module.ts`

### Flutter

- `lib/core/data/api/api_end_points.dart`
- `lib/core/data/service/api_client_service.dart`
- `lib/feature/settings/controller/settings_state_controller.dart`
- `lib/feature/settings/repository/settings_preferences_repository.dart`
- `lib/feature/settings/screen/privacy_settings_screen.dart`
- `lib/feature/settings/screen/notifications_settings_screen.dart`
- `lib/feature/settings/screen/data_privacy_center_screen.dart`

### Dashboard

- `src/App.jsx`
- `src/services/apiClient.js`
- `src/App.css`
- `src/components/AdminViews.jsx`
- `src/config/navigation.js`

## Current Verdict

- Backend admin list/data routes used by the dashboard are aligned and validated.
- Flutter no longer treats `/settings/state` as a device-local store.
- The platform still needs a wider cleanup pass to remove every remaining helper-backed production response, but the current mismatches fixed here were real integration blockers and are now closed.
