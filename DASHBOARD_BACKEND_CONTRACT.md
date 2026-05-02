# Dashboard Backend Contract

Generated: 2026-05-02

This file documents the current admin dashboard to backend contract used by
`G:\My Project\OptiZenqor_social_dashboard`.

Runtime requirement:

- `VITE_API_BASE_URL` must be provided at build/runtime.
- The dashboard client no longer uses a hardcoded hosted fallback.

## Auth

### `POST /admin/auth/login`
- Auth: none
- Body:

```json
{
  "email": "admin@optizenqor.app",
  "password": "secret"
}
```

- Response:
  - `data.accessToken`
  - `data.refreshToken`
  - `data.session`
- Dashboard file:
  - `src/App.jsx`

### `POST /admin/auth/refresh`
- Auth: none
- Body:

```json
{
  "refreshToken": "admin_refresh_xxx"
}
```

- Dashboard file:
  - `src/services/apiClient.js`

### `POST /admin/auth/logout`
### `GET /admin/auth/me`
### `GET /admin/auth/sessions`
### `PATCH /admin/auth/sessions/:id/revoke`
- Auth: admin bearer token
- Dashboard files:
  - `src/App.jsx`
  - `src/components/AdminViews.jsx`

## Overview

### `GET /admin/dashboard/overview`
- Auth: admin bearer token
- Query params: none currently used by dashboard
- Response keys consumed:
  - `data.totals`
  - `data.health`
- Dashboard files:
  - `src/config/navigation.js`
  - `src/components/AdminViews.jsx`

## Core moderation

### `GET /admin/users`
### `PATCH /admin/users/:id`
- Auth: admin bearer token
- Query params supported by backend:
  - `page`
  - `limit`
  - `search`
  - `role`
  - `status`
  - `sort`
  - `order`
- Dashboard files:
  - `src/App.jsx`
  - `src/components/AdminViews.jsx`

### `GET /admin/content`
### `PATCH /admin/content/:type/:id/moderate`
- Auth: admin bearer token
- Query params supported by backend:
  - `page`
  - `limit`
  - `targetType`
  - `status`
  - `search`
- Dashboard files:
  - `src/App.jsx`
  - `src/components/AdminViews.jsx`

### `GET /admin/reports`
### `PATCH /admin/reports/:id`
- Auth: admin bearer token
- Query params supported by backend:
  - `page`
  - `limit`
  - `search`
  - `status`
- Dashboard files:
  - `src/App.jsx`
  - `src/components/AdminViews.jsx`

## Operations

### `GET /admin/support-operations`
- Auth: admin bearer token
- Query params supported by backend:
  - `page`
  - `limit`
  - `search`
  - `status`
  - `priority`
- Response keys consumed:
  - `data.tickets`
  - `data.actions`
  - `data.filters`
  - `data.pagination`
- Mutation route:
  - `PATCH /admin/support-operations/:id`
- Dashboard files:
  - `src/App.jsx`
  - `src/config/navigation.js`
  - `src/components/AdminViews.jsx`
- Remaining gap:
  - ticket assignment, reply composer, and SLA workflows are still missing

### `GET /admin/marketplace`
### `GET /admin/jobs`
### `GET /admin/events`
### `GET /admin/communities`
### `GET /admin/communities/:id`
### `GET /admin/pages`
### `GET /admin/pages/:id`
### `GET /admin/live-streams`
### `GET /admin/live-streams/:id`
### `PATCH /admin/live-streams/:id`
- Auth: admin bearer token
- Query params supported by backend lists:
  - `page`
  - `limit`
  - `search`
  - `status`
- Dashboard files:
  - `src/config/navigation.js`
  - `src/components/AdminViews.jsx`
- Remaining gap:
  - UI is still mostly read-only for these modules

## Revenue and subscriptions

### `GET /admin/dashboard/revenue`
### `GET /admin/revenue/export`
### `GET /admin/wallet`
### `GET /admin/wallet/export`
### `GET /admin/wallet/:id`
### `GET /admin/subscriptions`
### `GET /admin/subscriptions/export`
### `GET /admin/subscriptions/:id`
### `GET /admin/wallet-subscriptions`
### `GET /admin/premium-plans`
### `POST /admin/premium-plans`
### `PATCH /admin/premium-plans/:id`
- Auth: admin bearer token
- Dashboard files:
  - `src/config/navigation.js`
  - `src/App.jsx`
  - `src/components/AdminViews.jsx`

## Notifications and settings

### `GET /admin/broadcast-campaigns`
### `POST /admin/broadcast-campaigns`
- Auth: admin bearer token
- Dashboard files:
  - `src/config/navigation.js`
  - `src/components/AdminViews.jsx`
- Remaining gap:
  - no update/cancel/send-now/delete UI or backend endpoints yet

### `GET /admin/notifications/devices`
- `PATCH /admin/notification-devices/:id`
- `PATCH /admin/notifications/devices/:id`
- Auth: admin bearer token
- Query params supported by backend list:
  - `page`
  - `limit`
  - `search`
  - `status`
- Dashboard files:
  - `src/App.jsx`
  - `src/config/navigation.js`
  - `src/components/AdminViews.jsx`
- Remaining gap:
  - detail history, bulk actions, and token retry diagnostics are still missing

### `GET /admin/settings`
### `PATCH /admin/settings`
### `GET /admin/audit-logs`
- Auth: admin bearer token
- Dashboard files:
  - `src/App.jsx`
  - `src/components/AdminViews.jsx`

## Current status

- The dashboard is authenticated and API-backed for all listed pages.
- The main remaining admin gap is feature depth, not connectivity:
  - filters/search/pagination controls are still missing on many pages outside support
  - many operational pages are still read-only, though support and notification devices now have real mutation controls
  - the remaining gaps are now primarily dashboard UX architecture and form/action coverage rather than missing backend list/detail routes
