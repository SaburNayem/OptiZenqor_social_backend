# Full Stack Remaining Mismatch Report

Generated: 2026-05-02

## Fixed In This Pass

- backend admin compatibility was tightened with:
  - `GET /admin/analytics`
  - `GET /admin/roles`
  - `GET /admin/chat-cases`
  - `GET /admin/notifications`
  - `DELETE /admin/notification-campaigns/:id`
- backend page-create options no longer return hardcoded owner/location arrays from request-time code
- Flutter static-success interaction paths were reduced in:
  - `polls_surveys`
  - `chat` search
  - external share action sheet
  - verification request screen copy
- Flutter now has a runnable smoke test suite under `test/smoke/`
- dashboard runtime env contract is now documented in `.env.example`

## Remaining Backend Gaps

| Area | Current issue | What still needs work |
| --- | --- | --- |
| Database environment | `.env` currently resolves `DATABASE_URL` to `postgresql://postgres:postgres@localhost:5432/socity_backend?sslmode=disable` because the later duplicate key overrides the earlier Neon URL. | Point the repo at a reachable PostgreSQL instance or clean up `.env` so migrations and seeding can run honestly. |
| Prisma migrate | `npm run prisma:migrate` still fails with a Prisma schema engine error while targeting unreachable local PostgreSQL. | Re-run after fixing the active datasource. |
| Seed-dev | `npm run seed:dev` fails because PostgreSQL at `localhost:5432` is unavailable. | Re-run after fixing the active datasource. |
| Runtime settings/catalog data | `SettingsDataService` still contains substantial static metadata/defaults shaping some settings and helper surfaces. | Continue moving dynamic settings/localization/accessibility/legal/onboarding/personalization contracts toward persisted rows and operational settings only. |
| Legacy demo/helper code | Unused or dev-only helper traces still exist, including mock-token parsing utility, demo account helpers, and some dev fallback wording. | Gate or remove dead/demo-only code paths where they are not part of a controlled dev flow. |

## Remaining Flutter Gaps

| Area | Current issue | What still needs work |
| --- | --- | --- |
| `group_chat`, `groups`, `events`, `learning_courses`, `pages`, `business_profile`, `jobs_networking` | Several models/controllers/repositories still use defensive placeholder labels or partial client-side derivation when backend payloads are sparse. | Tighten backend field completeness and remove remaining production-facing placeholder fallbacks. |
| `polls_surveys` | Static success flows were replaced with honest unavailable messaging, but full create/edit/analytics backend flows are still missing. | Implement real composer/detail/analytics APIs and wire the UI to them. |
| `calls` and `live_stream` | Major fake labels were already reduced, but lifecycle UX still depends on limited server-backed contract depth. | Expand the durable snapshot-backed contracts for calls/live flows and consume them directly. |
| `support_help` | Overview is backend-driven, but deeper support ticket detail/reply/update flows are still shallow. | Add richer server-backed support operations UX. |
| `follow_unfollow` / `verification_request` / `communities` | Some UI copy and empty-state helpers still reveal sample/placeholder intent. | Continue cleanup so user-visible production flows never imply fake/sample business data. |

## Remaining Dashboard Gaps

| Area | Current issue | What still needs work |
| --- | --- | --- |
| `src/components/AdminViews.jsx` | Still acts as a large multi-section renderer. | Break sections into dedicated page or feature modules with shared table/detail/form primitives. |
| Admin CRUD depth | Many sections are connected but still list-centric. | Finish create/edit/delete/detail/drawer/confirm flows for marketplace, jobs, events, communities, pages, live streams, revenue, wallet, subscriptions, and settings. |
| Requested file structure | The dashboard has `context`, `hooks`, `pages/admin`, `components/forms`, and `components/modals`, but the full `app/layout/tables/utils` split is not complete. | Continue modularization without changing working API behavior. |

## Validation Blockers

- backend database validation remains blocked by the active local `DATABASE_URL`
- `npm run prisma:migrate` cannot be claimed passing until PostgreSQL is reachable
- `npm run seed:dev` cannot be claimed passing until PostgreSQL is reachable
- backend `health/database` smoke cannot pass honestly until the same database issue is resolved

## Completion Estimate

- Backend: 84%
- Flutter: 76%
- Dashboard: 79%
- Overall: 80%
