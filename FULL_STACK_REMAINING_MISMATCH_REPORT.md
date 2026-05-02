# Full Stack Remaining Mismatch Report

Updated: 2026-05-03

## Fixed In This Pass

- settings section/item runtime authority is now database-backed through:
  - `app_settings_section_catalog`
  - `app_settings_item_catalog`
- additive migration `20260503_settings_catalog_tables` applied successfully
- `seed-dev` now populates the persisted settings catalog from the legacy static source for dev/local bootstrap only
- `SettingsDatabaseService` now reads settings sections and items from PostgreSQL instead of `SettingsDataService`
- Flutter settings landing now fetches settings sections from `GET /settings`
- Flutter settings landing now shows explicit unauthorized/loading/error/empty states instead of relying on a hardcoded catalog
- Flutter deep link resolution now uses `POST /deep-link-handler/resolve`
- fake guest display name/avatar fallback was removed from the main shell user state holder
- backend `npm install`, `npm run prisma:generate`, `npm run prisma:migrate`, `npm run seed:dev`, `npm run typecheck`, `npm run build`, and runtime smoke checks passed again after the settings-catalog migration

## Remaining Backend Gaps

| Area | Current issue | Needed next |
| --- | --- | --- |
| Runtime settings catalogs | Section/item catalog authority is fixed, but some settings/localization/accessibility/legal values still fall back through operational-setting blobs and dynamic defaults. | Continue moving the remaining settings/localization/accessibility/legal response composition fully onto persisted durable tables/config. |
| Legacy helper traces | Some dev-oriented fallback wording and helper utilities remain in OTP, mail, realtime, and token helper code. | Gate or remove production-inappropriate helper paths while preserving safe local development flows. |
| Admin depth | Core admin routes exist and validate, but some sections remain list-first in behavior. | Continue richer detail/export/filter/action coverage for revenue, wallet, communities, pages, and live moderation flows. |

## Remaining Flutter Gaps

| Area | Current issue | Needed next |
| --- | --- | --- |
| Home-feed local creation | `lib/feature/home_feed/helper/home_feed_post_factory.dart` still constructs local-only post ids for server-owned content paths. | Remove local post fabrication from production create flows and require backend-created entities. |
| Main shell auth state | `MainShellController` no longer fabricates guest labels, but some consumers still assume a non-null current user object. | Push more authenticated flows onto explicit nullable/unauthorized handling. |
| Marketplace payload completeness | Client still derives some seller/category/order/chat labels from partial backend payloads. | Tighten backend marketplace contracts so these display fields arrive fully populated. |
| Jobs placeholder labels | Some jobs model constructors still supply fallback labels when backend fields are missing. | Finish backend jobs payload completeness, then remove placeholder display strings. |
| Calls/live lifecycle | The app is backend-calling correctly, but lifecycle UX still infers state from shallow payloads. | Expand persisted call/live snapshot contracts and consume them directly. |
| Support/help depth | Support overview and ticket summaries are backend-driven, but the mobile UI still lacks full ticket detail and reply screens. | Add dedicated Flutter ticket detail/reply/update screens against the available backend routes. |

## Remaining Dashboard Gaps

| Area | Current issue | Needed next |
| --- | --- | --- |
| View modularization | `src/components/AdminViews.jsx` is smaller in responsibility but still too large overall. | Keep extracting the remaining list-first modules into dedicated `src/pages/admin/*` slices. |
| Admin CRUD depth | Many sections are connected but remain list-centric. | Add more create/edit/delete/detail/confirm/export flows where backend already supports them. |
| Reusable admin primitives | Overview now uses shared metric/chart primitives, but confirm dialogs, detail drawers, and export actions are not generalized enough yet. | Continue shared admin-console component expansion. |

## Validation Status

- Backend:
  - `npm install` -> passed
  - `npm run prisma:generate` -> passed
  - `npm run prisma:migrate` -> passed
  - `npm run seed:dev` -> passed
  - `npm run typecheck` -> passed
  - `npm run build` -> passed
  - runtime start + smoke checks -> passed
  - `GET /health` -> passed
  - `GET /health/database` -> passed
  - `GET /docs-json` -> passed
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

- Backend: 86%
- Flutter: 70%
- Dashboard: 79%
- Database coverage: 85%
- Overall: 80%
