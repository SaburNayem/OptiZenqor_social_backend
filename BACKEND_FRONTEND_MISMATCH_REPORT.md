# Backend Frontend Mismatch Report

Last updated: 2026-05-02

## Fixed In This Pass

- Account OTP routes no longer depend on `ExtendedDataService` runtime state.
- `PlatformDataService` and `ExtendedDataService` were removed from the live Nest provider/export graph.
- Flutter creator dashboard was migrated from hardcoded production analytics content to the backend `/creator-dashboard` API.
- Dashboard shell was split further into reusable layout/common pieces while keeping live API usage.

## Fixed In The Admin Contract

- Added missing admin CRUD endpoints for marketplace, jobs, and events.
- Added missing admin update endpoints for communities and pages.
- Added missing admin wallet subscription mutation endpoint.
- Added canonical admin notification campaign endpoints for dashboard use.
- Corrected dashboard navigation to canonical notification campaign/device admin routes.

## Still Mismatched

- Flutter still needs a wider audit and cleanup across several server-owned feature flows to verify no remaining production-local mutation state exists.
- Dashboard architecture is improved but still not fully rebuilt into the requested `pages/admin/*` and hooks-driven modular structure.
- Dashboard coverage for admin sections is still partial at the UX level even where backend endpoints now exist.
- The configured PostgreSQL database still has unapplied safe migrations.
- Admin login credentials are not fully reproducible from local config, so login smoke testing was limited to a failed bootstrap-password attempt plus authenticated endpoint checks through an existing session.

## Validation Snapshot

- Backend `npm install` passed
- Backend `prisma generate` passed
- Backend `typecheck` passed
- Backend `build` passed
- Backend `prisma migrate status` reported unapplied migrations safely
- Backend smoke tests for `/health`, `/health/database`, and `/docs-json` passed
- Authenticated admin smoke tests for `/admin/auth/me`, `/admin/dashboard/overview`, `/admin/notification-campaigns`, and `/admin/support-operations` passed using a valid existing session
- Flutter `pub get` passed
- Flutter `analyze` passed
- Flutter `test` could not run because the repo currently contains no `_test.dart` files
- Dashboard `npm install` passed
- Dashboard `lint` passed
- Dashboard `build` passed
