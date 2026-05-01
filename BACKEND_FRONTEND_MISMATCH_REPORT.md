# Backend Frontend Mismatch Report

Updated: 2026-05-01

This report reflects the current local workspace, not the public GitHub snapshot.

## Current Summary

- Backend has a strong PostgreSQL/Prisma base and many active DB-backed modules.
- Admin auth and admin dashboard APIs are locally implemented and verified.
- Flutter still contains some production features that degrade to empty or placeholder presentation when backend data is thin.
- A few backend helper/catalog surfaces still exist and should be treated as follow-up work, not as fully production-native domain modules.

## Exact Mismatch Table

| Feature | Frontend file | Dashboard file | Backend controller/service | Current issue | Required API | DB model needed | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Marketplace compare | `lib/feature/marketplace/controller/marketplace_controller.dart` | `src/App.jsx` consumes marketplace lists only | `src/controllers/marketplace.controller.ts`, `src/services/experience-database.service.ts` | Was Flutter local-only | `GET/PATCH /marketplace/compare` | existing `user_settings.settings.marketplace.compareItemIds` | Fixed |
| Marketplace listing status | `lib/feature/marketplace/controller/marketplace_controller.dart` | none yet | `src/controllers/marketplace.controller.ts`, `src/services/experience-database.service.ts` | Was local-only sold/pause/repost state | `PATCH /marketplace/products/:id/status` | existing `MarketplaceProduct.status` | Fixed |
| Marketplace saved items | `lib/feature/marketplace/controller/marketplace_controller.dart` | none yet | `src/controllers/bookmarks.controller.ts`, `src/services/account-state-database.service.ts` | Was local-only save toggle | `POST/DELETE /bookmarks` | existing `Bookmark` | Fixed |
| Blocked/muted unmute | `lib/feature/blocked_muted_accounts/controller/blocked_muted_accounts_controller.dart` | none | `src/controllers/preferences.controller.ts`, `src/services/settings-database.service.ts` | Was local-only unmute | `PATCH /blocked-muted-accounts/:targetId/unmute` | existing `user_settings.settings.moderation.muted_accounts` | Fixed |
| Current-user business/seller/recruiter profile | `lib/feature/business_profile/repository/business_profile_repository.dart` and related profile flows | none | `src/controllers/profiles.controller.ts`, `src/services/profiles-database.service.ts` | Backend could fall back to arbitrary first user | current routes now require auth-derived current user | existing `AppUser`, related profile summaries | Fixed |
| Support help | `lib/feature/support_help/repository/support_help_repository.dart` | dashboard support section uses `/admin/support-operations` | `src/controllers/support.controller.ts`, `src/services/support-database.service.ts` | Mostly DB-backed, but mail settings remain config-backed | `/support-help`, `/support-help/chat`, `/support/tickets` | existing support models plus env-config mail surface | Partial |
| Jobs/profile/employer profile | `lib/feature/jobs_networking/repository/jobs_networking_repository.dart` | dashboard uses `/jobs` only | `src/controllers/jobs.controller.ts`, `src/services/experience-database.service.ts` | Flutter still has placeholder fallback models when backend payloads are empty | `/jobs/profile`, `/jobs/employer-profile`, `/jobs/employer-stats` | existing `Job`, `JobApplication`, `user_settings.settings.jobs.*` | Partial |
| Subscriptions/premium/wallet | `lib/feature/subscriptions/repository/subscriptions_repository.dart` | dashboard revenue/settings pages | `src/controllers/engagement.controller.ts`, `src/services/monetization-database.service.ts` | Main data is DB-backed; invite-referral still helper-backed | `/premium-membership`, `/wallet-payments`, `/subscriptions*`, `/invite-referral` | existing wallet/subscription models; referral model missing | Partial |
| Live stream studio/moderation | `lib/feature/live_stream/repository/live_stream_repository.dart` | dashboard not yet exposing full moderation UI | `src/controllers/realtime.controller.ts`, realtime/live services | Lifecycle is persisted; richer studio/mod state still thin | live setup/start/end/comments/moderation routes | existing `LiveStreamSession`, comments, reactions | Partial |
| Discovery/trending/hashtags | `feature/hashtags`, `feature/trending`, search/discovery | dashboard none | discovery controllers/services | Mixed persisted/derived/helper composition | `/trending`, `/hashtags` | persisted derived datasets desirable | Partial |

## Backend Areas Still Not Fully Professionalized

- `src/controllers/engagement.controller.ts`
  - `GET /invite-referral` still uses `EcosystemDataService`.
- `src/controllers/preferences.controller.ts` and `src/services/settings-database.service.ts`
  - user state is persisted, but some returned catalog/help blocks are still composed from settings metadata helpers.
- `src/services/profiles-database.service.ts`
  - summaries are now tied to the authenticated user, but richer dedicated seller/business/recruiter extension tables do not exist yet.
- `src/services/realtime-state.service.ts`
  - socket presence/room membership/typing are still runtime state, even though calls and streams now have persisted models.
- `src/data/settings-data.service.ts`
  - catalog/config content still contains placeholder strings for some advanced privacy/accessibility items.

## Frontend Areas Still Not Fully Mock-Free

- `lib/feature/jobs_networking/repository/jobs_networking_repository.dart`
  - still returns empty/default models for some thin backend responses instead of a richer explicit error path.
- `lib/feature/advanced_privacy_controls/controller/advanced_privacy_controls_controller.dart`
  - still contains placeholder privacy entries in controller state.
- `lib/feature/accessibility_support/controller/accessibility_support_controller.dart`
  - still contains placeholder caption/support copy.
- `lib/feature/legal_compliance/screen/legal_compliance_screen.dart`
  - still contains placeholder UI copy.
- `lib/feature/learning_courses/model/course_model.dart`
  - placeholder certificate/quiz defaults remain in model defaults.

## What Was Fixed In This Pass

- Persisted Flutter marketplace compare state through backend APIs.
- Persisted Flutter marketplace sold/pause/repost actions through backend APIs.
- Replaced Flutter marketplace saved-item local toggle with backend bookmarks.
- Replaced Flutter blocked-muted local unmute with backend mutation.
- Normalized blocked/muted account payloads for Flutter.
- Removed active Flutter demo auth endpoint usage.
- Removed backend profile fallback to arbitrary first user for current-user profile extensions.

## Recommended Next Pass

1. Replace placeholder advanced-privacy/accessibility controller data in Flutter with backend-only reads.
2. Remove remaining empty-model fallback behavior in Flutter jobs/profile/business modules and surface explicit error/empty states.
3. Replace helper-backed `invite-referral` and remaining discovery/helper payloads with real persisted or derived DB-backed implementations.
4. Add dedicated Prisma-backed seller/business/recruiter extension tables if richer profile editing is required beyond `AppUser`.
