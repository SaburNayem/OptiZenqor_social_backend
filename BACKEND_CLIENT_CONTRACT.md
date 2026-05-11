# BACKEND_CLIENT_CONTRACT

Last updated: 2026-05-09

## Contract Rules

Normalized success shape:

```json
{
  "success": true,
  "message": "string",
  "data": {},
  "pagination": {}
}
```

Normalized error target shape:

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

Current backend status:

- success responses are largely standardized through `successResponse(...)`
- error responses now pass through the global HTTP exception filter using `success`, `message`, and structured `error` payloads
- several legacy compatibility payloads still remain in some controllers/services
- frontend/mobile clients still contain permissive parsing that should be reduced as backend normalization continues

## Auth Types

- `public`: no bearer token required
- `user`: mobile/web end-user bearer token only
- `admin`: admin bearer token only

User tokens must never access admin routes.

## Shared Endpoint Matrix

| Method | Path | Auth | Query / Body | Response data shape | Pagination | Consuming clients |
| --- | --- | --- | --- | --- | --- | --- |
| `POST` | `/auth/login` | `public` | `{ email, password }` | `{ accessToken, refreshToken, sessionId, user }` | no | Flutter, Web |
| `POST` | `/auth/signup` | `public` | `{ name, username, email, password, confirmPassword, profileType?, role? }` where `profileType/role` must resolve to `user`, `creator`, or `business` | `{ accessToken, refreshToken, sessionId, user }` | no | Flutter, Web |
| `POST` | `/auth/refresh-token` | `public` | `{ refreshToken }` | session/token payload | no | Flutter |
| `POST` | `/auth/logout` | `user` | optional session info | logout result | no | Flutter |
| `GET` | `/auth/me` | `user` | none | `user` | no | Flutter, Web |
| `GET` | `/users` | `public` | `page, limit, search` | `{ items }` | yes | Flutter, Web |
| `GET` | `/profile` | `user` | none | profile payload | no | Flutter, Web |
| `PATCH` | `/user-profile/edit` | `user` | profile update body | updated profile | no | Flutter, Web |
| `GET` | `/user-profile/followers` | `user` | none | `{ items }` | optional | Flutter, Web |
| `GET` | `/user-profile/following` | `user` | none | `{ items }` | optional | Flutter, Web |
| `POST/PATCH` | `/users/:id/follow` | `user` | optional actor context | follow result | no | Flutter, Web |
| `POST/PATCH` | `/users/:id/unfollow` | `user` | optional actor context | unfollow result | no | Flutter, Web |
| `GET` | `/feed` | `public` | feed filters as added | feed payload | optional | Flutter, Web |
| `GET` | `/stories` | `public` | list query | `{ items }` or story list payload | optional | Flutter, Web |
| `GET` | `/reels` | `public` | list query | `{ items }` or reel list payload | optional | Flutter, Web |
| `POST` | `/posts` | `user` | `{ caption, media, tags }` | created post | no | Flutter, Web |
| `GET` | `/chat/threads` | `user` | none | `{ items }` | optional | Flutter, Web |
| `GET` | `/chat/threads/:id/messages` | `user` | message list query | `{ items }` | optional | Flutter, Web |
| `POST` | `/chat/threads/:id/messages` | `user` | `{ text, ... }` | created message | no | Flutter, Web |
| `GET` | `/marketplace/products` | `public/user` | `page, limit, search, category, status` | marketplace list payload | yes | Flutter, Web |
| `GET` | `/marketplace` | `public/user` | compatibility alias | marketplace overview payload | yes | Flutter |
| `GET` | `/jobs` | `public/user` | `page, limit, search, type, location` | jobs list payload | yes | Flutter, Web |
| `GET` | `/jobs-networking` | `user` | none | jobs overview payload | no | Flutter, compatibility for Web |
| `GET` | `/events` | `public` | `page, limit, search, status` | events list payload | yes | Flutter, Web |
| `GET` | `/communities` | `public` | `page, limit, search, category` | communities list payload | yes | Flutter, Web |
| `GET` | `/pages` | `public` | `page, limit, search, category` | pages list payload | yes | Flutter, Web |
| `GET` | `/settings/state` | `user` | none | settings state payload | no | Flutter, Web |
| `GET` | `/settings` | `user` | none | settings sections payload | no | Flutter, compatibility for Web |
| `GET` | `/notifications` | `user` | notification filters | notifications payload | optional | Flutter, Web |
| `PATCH/POST` | `/notifications/:id/read` | `user` | optional empty body | read result | no | Flutter, Web |
| `GET` | `/trending` | `public` | optional limit | `{ items }` trend payload | optional | Flutter, Web |
| `GET` | `/search-discovery` | `public` | `q, limit` | search/discovery payload | optional | Flutter, Web |
| `GET` | `/global-search` | `public` | `q, limit` | search payload | optional | Flutter |
| `GET` | `/calls` | `user` | none | `{ items, calls }` | no | Flutter, Web |
| `GET` | `/live-stream` | `public` | `page, limit, status, userId` | live stream list payload | yes | Flutter |
| `GET` | `/live-streams` | `public` | compatibility alias | live stream list payload | yes | Web |
| `POST` | `/admin/auth/login` | `public` | `{ email, password }` | admin session/token payload | no | Dashboard |
| `POST` | `/admin/auth/refresh` | `public` | `{ refreshToken }` | refreshed admin session | no | Dashboard |
| `POST` | `/admin/auth/logout` | `admin` | none | logout result | no | Dashboard |
| `GET` | `/admin/auth/me` | `admin` | none | current admin session | no | Dashboard |
| `GET` | `/admin/me` | `admin` | compatibility alias | current admin session | no | Dashboard |
| `GET` | `/admin/dashboard/overview` | `admin` | none | overview metrics | no | Dashboard |
| `GET` | `/admin/overview` | `admin` | compatibility alias | overview metrics | no | future dashboard cleanup |
| `GET` | `/admin/users` | `admin` | `page, limit, search, status` | `{ items }` users payload | yes | Dashboard |
| `GET` | `/admin/content` | `admin` | content filters | `{ items }` content payload | yes | Dashboard |
| `GET` | `/admin/reports` | `admin` | report filters | `{ items }` reports payload | yes | Dashboard |
| `GET` | `/admin/marketplace` | `admin` | list filters | `{ items }` marketplace payload | yes | Dashboard |
| `GET` | `/admin/marketplace/products` | `admin` | compatibility alias | `{ items }` marketplace payload | yes | future dashboard cleanup |
| `GET` | `/admin/jobs` | `admin` | list filters | `{ items }` jobs payload | yes | Dashboard |
| `GET` | `/admin/events` | `admin` | list filters | `{ items }` events payload | yes | Dashboard |
| `GET` | `/admin/communities` | `admin` | list filters | `{ items }` communities payload | yes | Dashboard |
| `GET` | `/admin/pages` | `admin` | list filters | `{ items }` pages payload | yes | Dashboard |
| `GET` | `/admin/live-streams` | `admin` | list filters | `{ items }` streams payload | yes | Dashboard |
| `GET` | `/admin/support-operations` | `admin` | support filters | support operations payload | yes/partial | Dashboard |
| `GET` | `/admin/support/tickets` | `admin` | compatibility alias | support operations payload | yes/partial | future dashboard cleanup |
| `GET` | `/admin/settings` | `admin` | none | admin settings | no | Dashboard |
| `GET` | `/admin/audit-logs` | `admin` | `page, limit, action, entityType` | audit log payload | yes | Dashboard |

## Client Notes

### Flutter mobile

- endpoint constants are centralized in `lib/core/data/api/api_end_points.dart`
- mobile still parses several legacy aliases through `ApiPayloadReader`
- mobile still contains local draft/cache behavior that should not become production authority
- mobile should stop sending or depending on `seller` and `recruiter`; the supported app roles are only `user`, `creator`, and `business`
- user capability expectations:
  - `creator`: pages, communities
  - `business`: marketplace products, jobs, communities
  - `user`: no elevated publishing role, but normal group chat remains available

### Admin dashboard

- dashboard enforces `VITE_API_BASE_URL`
- dashboard already uses admin auth refresh flow
- several modules still need full CRUD/action wiring even where backend routes exist

### Public web frontend

- web client now requires `VITE_API_BASE_URL`
- web client was updated in this pass to prefer canonical routes:
  - `/settings/state`
  - `/marketplace/products`
  - `/jobs`
  - `/live-streams`
- web still contains non-contract-safe optimistic/local UI behaviors that need further cleanup

## Environment Contract

Backend:

- `.env.example` documents `CORS_ORIGIN`, `CORS_ORIGINS`, `FRONTEND_URL`, `CLIENT_URL`, `DASHBOARD_URL`, and `WEB_FRONTEND_URL`

Dashboard:

- `.env.example` requires `VITE_API_BASE_URL`

Web frontend:

- `.env.example` requires `VITE_API_BASE_URL`

Flutter:

- `.env.example` now documents `API_BASE_URL`, `DEBUG_SHARED_API_BASE_URL`, `LOCAL_LAN_API_BASE_URL`, `LOCAL_ANDROID_DEBUG_API_BASE_URL`, `SOCKET_BASE_URL`, and `ALLOW_OFFLINE_FALLBACK`

## Highest-Priority Remaining Contract Gaps

- remove remaining alias-heavy payloads in backend service builders and the remaining controllers
- define and enforce one consistent error payload shape through exception filters
- reduce Flutter alias parsing once backend normalization is deeper
- remove web optimistic local production entities and direct avatar fallbacks
- complete admin CRUD/action contract surface for support, moderation, wallets, subscriptions, roles, and config domains
