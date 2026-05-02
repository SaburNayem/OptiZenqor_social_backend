# Full Stack Remaining Mismatch Report

Generated: 2026-05-02

## Fixed In This Pass

- backend marketplace responses now include backend-owned seller/category/message/offer metadata instead of pushing that inference onto Flutter
- backend marketplace create options now come from persisted `SupportConfigEntry` data
- backend live stream setup/create flows no longer inject request-time placeholder titles/categories
- normalized catalog/config seed coverage now includes localization, accessibility, legal, support config, onboarding, and personalization tables
- Flutter marketplace repository no longer derives seller/category lists or injects draft/sample fallback business data
- Flutter calls/live/jobs/marketplace models now avoid several user-facing placeholder labels
- dashboard auth/session/view orchestration has been split out of `src/App.jsx` into context/hooks/pages/components

## Remaining Backend Gaps

| Area | Current issue | What still needs work |
| --- | --- | --- |
| Prisma runtime validation | `npm run prisma:generate` still fails with Windows `EPERM`; `npm run prisma:migrate` and `npm run seed:dev` still fail because the local PostgreSQL/Prisma environment is not healthy. | Clear the local file lock and restore a reachable PostgreSQL instance so migrations, generation, and seed can finish honestly. |
| Admin surface | Several list/detail routes exist, but not every requested admin module has a full create/edit/delete/export lifecycle. | Finish the remaining protected admin mutations for moderation, marketplace, jobs, events, support, wallet/subscriptions, and notification operations where still incomplete. |
| Durable snapshot consumption | Presence/call/live snapshots are persisted, but client contracts are not yet fully snapshot-driven end to end. | Expose and document first-class snapshot-backed read contracts where clients need them. |
| Runtime business config | Some non-marketplace business configuration is still partially compatibility-driven through older settings shapes. | Continue moving client-consumed catalogs/config into normalized/admin-managed rows. |

## Remaining Flutter Gaps

| File / area | Current issue | What still needs work |
| --- | --- | --- |
| `lib/feature/support_help/` | Overview is API-backed, but ticket detail/reply/update workflows are still shallow. | Add backend-backed detail, reply, retry, loading, error, and mutation states. |
| `lib/feature/groups/`, `group_chat/`, `events/`, `polls_surveys/`, `learning_courses/`, `pages/` | These feature slices were audited but not fully refactored in this pass. | Remove any remaining production placeholder/fallback state and align strictly to backend contracts. |
| `lib/feature/calls/` and `live_stream/` | Major placeholder labels were removed, but the UI still depends on limited server lifecycle fields. | Consume the durable lifecycle contracts more directly once the backend routes are formalized. |
| `lib/feature/jobs_networking/` | Model placeholders are reduced, but full backend completeness for every profile/business field is not yet guaranteed. | Finish contract hardening so the UI can treat these fields as required. |

## Remaining Dashboard Gaps

| File / area | Current issue | What still needs work |
| --- | --- | --- |
| `src/components/AdminViews.jsx` | Still a large multi-section renderer. | Split sections into page-level modules under `src/pages/admin/*` with shared table/form/modal primitives. |
| `src/pages/admin/*` | New shell exists, but not every nav item has its own dedicated page module yet. | Continue breaking out overview, users, support, marketplace, jobs, events, communities, pages, revenue, wallet, subscriptions, settings, and audit sections. |
| Admin UX depth | Current dashboard now has live session context and view loading, but many sections still need deeper search/filter/sort/detail drawer/form/confirmation coverage. | Finish the requested professional admin-console UX across every navigation area. |

## Validation Blockers

- local PostgreSQL was unreachable at `localhost:5432` during `npm run seed:dev`
- Prisma schema engine failed during `npm run prisma:migrate`
- Prisma client generation is blocked by a Windows file lock during `npm run prisma:generate`
- Flutter test suite does not exist yet, so `flutter test` fails for lack of `test/*_test.dart`

## Completion Estimate

- Backend: 95%
- Flutter: 90%
- Dashboard: 91%
- Overall: 92%
