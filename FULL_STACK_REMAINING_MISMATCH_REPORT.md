# Full Stack Remaining Mismatch Report

Generated: 2026-05-02

## Latest Implementation Delta

Fixed in this implementation cycle:

- backend now includes safe Prisma schema + migration coverage for localization, accessibility, legal document versioning, support config, onboarding/personalization catalogs, analytics snapshots, chat presence snapshots, call lifecycle snapshots, and live lifecycle snapshots
- backend localization, accessibility, legal, onboarding/personalization, and support mail reads now prefer normalized tables when populated
- backend realtime/live flows now persist durable presence/call/live lifecycle snapshots
- backend admin coverage now includes detail/export routes for communities, pages, live streams, wallet transactions, subscriptions, revenue, wallet export, and subscription export
- backend admin update DTO validation is now stricter for marketplace, jobs, and events
- backend support operations now cover ticket detail, assignment, reply, and SLA metadata with audit logs
- backend notification campaigns now cover detail plus send/cancel/delete lifecycle actions
- backend notification devices now cover detail plus delete
- backend support contact, push categories, accessibility options, legal documents, onboarding config, referral config, deep-link config, share/repost config, localization config, maintenance config, and app update config no longer rely on request-time hardcoded business arrays in the updated services
- Flutter blocked/muted and jobs networking repositories now fail explicitly on backend failure instead of quietly returning empty production state
- Flutter jobs networking screens now expose loading, retry, error, and empty states for core backend-owned tabs
- dashboard notification campaigns are no longer read-only in the earlier dashboard pass of this cycle

Still remaining after this implementation cycle:

- Prisma client regeneration is still blocked by the Windows file-lock issue, so the new schema cannot yet be claimed fully generated locally
- several backend feature areas still infer or aggregate records instead of exposing stricter first-class contracts
- the dashboard still needs broad module-level create/edit/moderation UX beyond the notification slice
- Flutter marketplace, calls/live lifecycle, support/help depth, and additional server-owned utility flows still need the same strict cleanup

## Backend

| File path | Current problem | Required backend endpoint/model | Required frontend/dashboard fix |
| --- | --- | --- | --- |
| `src/services/experience-database.service.ts` | Jobs/learning/polls/personalization areas still derive some records from JSON blobs and inferred labels when first-class rows are absent. | Normalize learning courses, polls, job alerts/profile slices, and personalization catalogs where these are true platform features. | Flutter learning, jobs networking, and personalization screens should consume dedicated contracts instead of inferred shapes. |
| `src/services/realtime-state.service.ts` | Presence and call snapshots are now durable, but clients are not yet consuming the persisted snapshot contract directly. | Expose or document first-class snapshot consumption routes if Flutter/dashboard need them live. | Flutter chat/calls/live screens should stop inferring lifecycle state once snapshot-backed contracts are wired end-to-end. |
| `prisma/schema.prisma` | Normalized catalog/snapshot models now exist, but the tables still need seeded/admin-managed content and successful local Prisma client regeneration. | Finish migration application/generation and add admin management flows or seed content for the new catalogs. | Flutter and dashboard clients can then move off compatibility parsing onto stricter first-class contracts. |
| `src/services/admin-database.service.ts` and `src/controllers/admin*.ts` | Admin detail/export coverage is stronger, but some create/delete/moderation workflows and richer export delivery are still incomplete. | Finish remaining protected admin routes and keep every mutation audited. | Dashboard pages still need real forms, confirmations, and action UX wired to the expanded API surface. |

## Flutter App

| File path | Current problem | Required backend endpoint/model | Required frontend fix |
| --- | --- | --- | --- |
| `lib/feature/marketplace/repository/marketplace_repository.dart` | Still derives sellers/categories/draft imagery/message labels/order fields from partial payloads and uses compatibility parsing across many keys. | Stabilize marketplace product, seller, category, draft, chat, offer, and order contracts. | Remove client-side seller/category/media/time inference and rely on canonical backend payloads. |
| `lib/feature/calls/repository/calls_repository.dart` | Call flows are API-backed but lifecycle state still depends on inferred timestamps/status defaults rather than durable server truth. | Add durable backend lifecycle snapshot records and stricter payloads. | Expose explicit ringing/ongoing/ended/error states from backend data. |
| `lib/feature/support_help/repository/support_help_repository.dart` | Reads overview successfully, but the app still lacks deeper backend-backed support workflow coverage and detailed retry/error UX around ticket operations. | Expand support contracts for detail, updates, replies, and support config. | Add richer support states/screens instead of only aggregate overview. |
| `lib/feature/jobs_networking/model/job_model.dart` and adjacent models | Several model constructors still include user-facing fallback labels like default company/job/profile names. | Tighten backend job/profile/company payload completeness. | Remove placeholder labels once the contract guarantees required fields. |

## Dashboard

| File path | Current problem | Required backend endpoint/model | Required dashboard fix |
| --- | --- | --- | --- |
| `src/App.jsx` | Still acts as a compact coordinator instead of the requested production architecture split. | No new backend route required for the refactor itself. | Split into `services`, `context`, `layout`, `pages/admin/*`, and reusable data/action hooks. |
| `src/components/AdminViews.jsx` | Support and notification slices are better, but most modules remain read-only or shallow-action pages. | Complete remaining admin mutation routes. | Add per-module create/edit/delete/moderation forms, filters, drawers, confirmations, and safer refresh flows. |
| `src/config/navigation.js` | Navigation points at backend-backed sections, but not every item yet has a full operational page behind it. | Complete the remaining admin API surface. | Ensure every nav item has live loading/error/empty/action UX wired to backend. |

## Highest Priority Next Steps

1. Add safe Prisma model/migration coverage for the missing normalized catalogs and lifecycle tables.
2. Finish admin mutation coverage for the remaining dashboard modules.
3. Tighten marketplace and call/live Flutter contracts so they stop deriving business state client-side.
4. Replace remaining model-level placeholder labels in Flutter once backend payload completeness is guaranteed.

## Notes

- The backend now leans more heavily on persisted `AdminOperationalSetting` rows for production config, which is a meaningful improvement over request-time static arrays, but it is not yet the same as a fully normalized schema for every requested config domain.
- Canonical response shape remains `{ success, message, data }`. Temporary aliases still exist in some places for compatibility and should be explicitly documented when the contract document is refreshed.
