# Full Stack Remaining Mismatch Report

Updated: 2026-05-02

## Fixed In This Pass

- backend Prisma runtime now uses a valid split connection strategy:
  - pooled `DATABASE_URL` for runtime
  - direct `DIRECT_URL` for Prisma migrate/deploy
- backend `npm install`, `npm run prisma:generate`, `npm run prisma:migrate`, `npm run seed:dev`, `npm run typecheck`, `npm run build`, and `npm run start:prod` now pass
- backend migration history drift was reconciled without resetting the remote database
- backend seed catalogs were aligned with current Prisma models
- Flutter marketplace create-order and create-listing flows no longer pretend failure is an empty success
- Flutter calls now send the intended recipient id to the backend session endpoint
- Flutter live stream setup no longer injects a hardcoded preview label when the backend does not provide one
- dashboard overview was split into `src/pages/admin/overview/OverviewView.jsx`
- dashboard workspace error state now includes a live retry action

## Remaining Backend Gaps

| Area | Current issue | Needed next |
| --- | --- | --- |
| Runtime settings catalogs | `SettingsDataService` still shapes some settings/config metadata from static code paths. | Continue moving settings/localization/accessibility/legal and catalog reads fully onto persisted tables and operational settings. |
| Legacy helper traces | Some dev-oriented fallback wording and helper utilities remain in OTP, mail, realtime, and token helper code. | Gate or remove production-inappropriate helper paths while preserving safe local development flows. |
| Admin depth | Core admin routes exist and validate, but some sections remain list-first in behavior. | Continue richer detail/export/filter/action coverage where dashboard UX still needs more depth. |

## Remaining Flutter Gaps

| Area | Current issue | Needed next |
| --- | --- | --- |
| Marketplace payload completeness | Client still derives some seller/category/order/chat labels from partial backend payloads. | Tighten backend marketplace contracts so these display fields arrive fully populated. |
| Jobs placeholder labels | Some jobs model constructors still supply fallback labels when backend fields are missing. | Finish backend jobs payload completeness, then remove placeholder display strings. |
| Calls/live lifecycle | The app is backend-calling correctly, but lifecycle UX still infers state from shallow payloads. | Expand persisted call/live snapshot contracts and consume them directly. |
| Support/help depth | Support overview is backend-driven, but ticket detail/reply/update coverage is still shallow. | Add richer support workflow endpoints and UI states. |

## Remaining Dashboard Gaps

| Area | Current issue | Needed next |
| --- | --- | --- |
| View modularization | `src/components/AdminViews.jsx` is smaller in responsibility but still too large overall. | Keep extracting sections into dedicated `src/pages/admin/*` modules. |
| Admin CRUD depth | Many sections are connected but remain list-centric. | Add more create/edit/delete/detail/confirm/export flows where backend already supports them. |
| Reusable admin primitives | Retry is now wired at workspace level, but role-aware actions, detail drawers, and confirm patterns are not generalized enough yet. | Continue shared admin-console component expansion. |

## Validation Status

- Backend:
  - `npm install` -> passed
  - `npm run prisma:generate` -> passed
  - `npm run prisma:migrate` -> passed
  - `npm run seed:dev` -> passed
  - `npm run typecheck` -> passed
  - `npm run build` -> passed
  - `npm run start:prod` -> passed
  - `GET /health` -> passed
  - `GET /health/database` -> passed
- Flutter:
  - `flutter pub get` -> passed
  - `dart format .` -> passed
  - `flutter analyze` -> passed
  - `flutter test` -> passed
- Dashboard:
  - `npm install` -> passed
  - `npm run lint` -> passed
  - `npm run build` -> passed

## Completion Estimate

- Backend: 93%
- Flutter: 82%
- Dashboard: 85%
- Overall: 87%
