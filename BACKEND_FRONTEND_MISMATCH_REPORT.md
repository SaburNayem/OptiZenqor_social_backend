# Backend Frontend Mismatch Report

Last updated: 2026-05-02

## Fixed In This Pass

- Added missing admin CRUD endpoints for marketplace, jobs, and events.
- Added missing admin moderation/update endpoints for communities and pages.
- Added missing admin mutation endpoint for wallet subscriptions.
- Added canonical admin notification campaign endpoints for dashboard use.
- Corrected dashboard navigation from stale notification endpoints to canonical backend endpoints.

## Still Mismatched

- Dashboard architecture still does not match the requested professional page/layout/service split.
- Dashboard still uses a compact single-app rendering model instead of the requested page modules under `src/pages/*`.
- Dashboard coverage for admin sections is still partial at the UX layer even when the backend endpoint now exists.
- Flutter still contains feature modules that need a stricter audit for local-only source-of-truth behavior versus API-backed persistence.
- The single shared cross-repo integration contract is still incomplete.

## Backend Endpoints That Now Exist For Admin

- `POST /admin/auth/login`
- `GET /admin/auth/me`
- `POST /admin/auth/refresh`
- `POST /admin/auth/logout`
- `PATCH /admin/auth/sessions/:id/revoke`
- `GET /admin/dashboard/overview`
- `GET /admin/users`
- `PATCH /admin/users/:id`
- `GET /admin/content`
- `PATCH /admin/content/:type/:id/moderate`
- `GET /admin/reports`
- `PATCH /admin/reports/:id`
- `GET /admin/support-operations`
- `GET /admin/settings`
- `PATCH /admin/settings`
- `GET /admin/audit-logs`
- `GET /admin/marketplace`
- `POST /admin/marketplace`
- `PATCH /admin/marketplace/:id`
- `DELETE /admin/marketplace/:id`
- `GET /admin/jobs`
- `POST /admin/jobs`
- `PATCH /admin/jobs/:id`
- `DELETE /admin/jobs/:id`
- `GET /admin/events`
- `POST /admin/events`
- `PATCH /admin/events/:id`
- `DELETE /admin/events/:id`
- `GET /admin/communities`
- `PATCH /admin/communities/:id`
- `GET /admin/pages`
- `PATCH /admin/pages/:id`
- `GET /admin/live-streams`
- `PATCH /admin/live-streams/:id`
- `GET /admin/monetization`
- `GET /admin/wallet-subscriptions`
- `PATCH /admin/wallet-subscriptions/:id`
- `GET /admin/notification-devices`
- `PATCH /admin/notification-devices/:id`
- `GET /admin/notification-campaigns`
- `POST /admin/notification-campaigns`
- `PATCH /admin/notification-campaigns/:id`
- `GET /admin/premium-plans`
- `POST /admin/premium-plans`
- `PATCH /admin/premium-plans/:id`

## Validation Snapshot

- Backend `typecheck` passed
- Backend `build` passed
- Backend `prisma generate` passed
- Dashboard `lint` passed
- Dashboard `build` passed
- Flutter `pub get` passed
- Flutter `analyze` passed
