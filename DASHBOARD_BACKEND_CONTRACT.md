# Dashboard Backend Contract

Generated: 2026-05-02

This file documents the current admin dashboard to backend contract used by
`G:\My Project\OptiZenqor_social_dashboard`.

Runtime requirement:

- `VITE_API_BASE_URL` must be provided at build/runtime.
- The dashboard client does not use a hosted or hardcoded API fallback.

## Auth

### `POST /admin/auth/login`
### `POST /admin/auth/refresh`
### `POST /admin/auth/logout`
### `GET /admin/auth/me`
### `GET /admin/auth/sessions`
### `PATCH /admin/auth/sessions/:id/revoke`

- Auth:
  - login/refresh: none
  - all others: admin bearer token
- Dashboard files:
  - `src/context/AdminSessionContext.jsx`
  - `src/services/apiClient.js`
  - `src/hooks/useAdminDashboard.js`

## Overview

### `GET /admin/dashboard/overview`

- Auth: admin bearer token
- Response keys currently consumed:
  - `data.totals`
  - `data.health`
- Dashboard files:
  - `src/config/navigation.js`
  - `src/components/AdminViews.jsx`

## Core moderation

### `GET /admin/users`
### `PATCH /admin/users/:id`
### `GET /admin/content`
### `PATCH /admin/content/:type/:id/moderate`
### `GET /admin/reports`
### `PATCH /admin/reports/:id`

- Auth: admin bearer token
- Query params currently used where supported:
  - `page`
  - `limit`
  - `search`
  - `status`
  - `role`
  - `targetType`
  - `sort`
  - `order`
- Dashboard files:
  - `src/config/navigation.js`
  - `src/hooks/useAdminDashboard.js`
  - `src/components/AdminViews.jsx`

## Operations

### `GET /admin/support-operations`
### `GET /admin/support-operations/:id`
### `PATCH /admin/support-operations/:id`

- Auth: admin bearer token
- Query params:
  - `page`
  - `limit`
  - `search`
  - `status`
  - `priority`
- Dashboard files:
  - `src/config/navigation.js`
  - `src/hooks/useAdminDashboard.js`
  - `src/components/AdminViews.jsx`

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
- Current status:
  - list/detail integration exists
  - deeper CRUD and detail UX is still incomplete in the dashboard

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
### `PATCH /admin/wallet-subscriptions/:id`
### `GET /admin/premium-plans`
### `POST /admin/premium-plans`
### `PATCH /admin/premium-plans/:id`
### `DELETE /admin/premium-plans/:id`

- Auth: admin bearer token
- Dashboard files:
  - `src/config/navigation.js`
  - `src/hooks/useAdminDashboard.js`
  - `src/components/AdminViews.jsx`

## Notifications and settings

### `GET /admin/notification-campaigns`
### `POST /admin/notification-campaigns`
### `PATCH /admin/notification-campaigns/:id`
### `DELETE /admin/notification-campaigns/:id`
### `POST /admin/notification-campaigns/:id/actions`
### `GET /admin/notification-devices`
### `GET /admin/notifications/devices`
### `PATCH /admin/notification-devices/:id`
### `PATCH /admin/notifications/devices/:id`
### `GET /admin/settings`
### `PATCH /admin/settings`
### `GET /admin/audit-logs`

- Auth: admin bearer token
- Dashboard files:
  - `src/config/navigation.js`
  - `src/hooks/useAdminDashboard.js`
  - `src/components/AdminViews.jsx`

## Current status

- The dashboard is authenticated and API-backed for the listed pages.
- Connectivity and build health are good.
- The biggest remaining gap is admin-console depth:
  - more modules need dedicated pages instead of a single large `AdminViews.jsx`
  - more sections need create/edit/delete/detail/confirm/drawer flows
  - role-aware actions and richer reusable table/modal/detail primitives still need expansion
