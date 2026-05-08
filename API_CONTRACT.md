# API_CONTRACT

Last updated: 2026-05-09

This file is the canonical short-form contract entrypoint for the full platform.
For the detailed route matrix, use [BACKEND_CLIENT_CONTRACT.md](G:\My Project\Socity_backend\BACKEND_CLIENT_CONTRACT.md).

## Response Shape

Successful responses should follow:

```json
{
  "success": true,
  "message": "string",
  "data": {},
  "meta": {}
}
```

Current implementation detail:

- paginated backend responses still commonly expose `pagination` instead of `meta`
- clients must be migrated toward one final shape without breaking working mobile flows

Error responses currently follow:

```json
{
  "success": false,
  "message": "string",
  "error": {
    "code": "string",
    "details": {}
  }
}
```

## Primary Client Contracts

- Flutter mobile: user auth + public/user APIs
- Public web frontend: user auth + public/user APIs
- Admin dashboard: admin auth + protected `/admin/*` APIs only

## Canonical Routes In Active Use

- auth: `/auth/login`, `/auth/signup`, `/auth/me`, `/auth/refresh-token`, `/auth/logout`
- social: `/feed`, `/posts`, `/stories`, `/reels`, `/users`, `/profile`
- profile actions: `/user-profile/edit`, `/user-profile/followers`, `/user-profile/following`, `/users/:id/follow`, `/users/:id/unfollow`
- chat/realtime: `/chat/threads`, `/chat/threads/:id/messages`, `/calls`, `/live-stream`, `/live-streams`
- discovery: `/trending`, `/search`, `/global-search`, `/search-discovery`
- marketplace/jobs/events/community: `/marketplace/products`, `/jobs`, `/events`, `/communities`, `/pages`
- settings/notifications: `/settings/state`, `/notifications`, `/notifications/:id/read`
- admin auth: `/admin/auth/login`, `/admin/auth/refresh`, `/admin/auth/logout`, `/admin/auth/me`, `/admin/me`
- admin overview and control: `/admin/overview`, `/admin/users`, `/admin/posts`, `/admin/stories`, `/admin/reels`, `/admin/reports`, `/admin/marketplace`, `/admin/jobs`, `/admin/events`, `/admin/communities`, `/admin/pages`, `/admin/support-operations`, `/admin/support/tickets`, `/admin/settings`, `/admin/audit-logs`

## Compatibility Notes

- route compatibility aliases are kept where needed for mobile/web stability
- backend-first normalization is still in progress for a few remaining modules
- see [BACKEND_CLIENT_CONTRACT.md](G:\My Project\Socity_backend\BACKEND_CLIENT_CONTRACT.md) for endpoint-by-endpoint consumer mapping
