# Flutter Backend Contract

This file is the current mobile-facing backend contract for the real API-first integration path.

## Core Entry Points

### `GET /app/bootstrap`
- Purpose: return app-level counters, user snapshot when authenticated, route entrypoints, and a small feed preview.
- Auth: optional bearer token.

### `POST /auth/login`
- Purpose: exchange email/password for access token, refresh token, session metadata, and user payload.
- Auth: none.

### `POST /auth/signup`
- Purpose: create account, issue initial session, and trigger email verification flow.
- Auth: none.

### `GET /auth/me`
- Purpose: resolve the authenticated user from bearer token.
- Auth: required.

## Social Feed

### `GET /feed`
- Purpose: return database-backed feed items.
- Auth: optional today, but intended to become authenticated-first.

### `GET /stories`
- Purpose: return active stories from PostgreSQL/Prisma.
- Auth: optional for public scope, bearer token recommended for buddy filtering and actions.

### `GET /reels`
- Purpose: return database-backed reels.
- Auth: optional.

## Chat

### `GET /chat/threads`
- Purpose: list chat threads for the authenticated user.
- Auth: required.

### `GET /chat/threads/:id/messages`
- Purpose: list messages inside a thread.
- Auth: required.

### `POST /chat/threads/:id/messages`
- Purpose: create a message in a thread.
- Auth: required.

## Notifications

### `GET /notifications`
- Purpose: fetch notification inbox.
- Auth: optional fallback exists, bearer token recommended.

## Profile

### `GET /profile/:id`
- Purpose: fetch public profile plus profile-level feed summary.
- Auth: optional.

### `PATCH /profile/me`
- Current alias: `PATCH /user-profile/edit`
- Purpose: update the authenticated user profile.
- Auth: required.

## Commerce / Discovery

### `GET /marketplace/products`
- Purpose: fetch marketplace products from Prisma.
- Auth: optional.

### `GET /jobs`
- Purpose: fetch jobs from Prisma.
- Auth: optional.

### `GET /events`
- Purpose: fetch events from Prisma.
- Auth: optional.

## Settings

### `GET /settings/state`
- Purpose: fetch persisted settings and privacy state.
- Auth: required.

## Integration Notes

- Bearer token format: `Authorization: Bearer <accessToken>`
- Response convention: most endpoints return `{ success, message, data }`, with compatibility aliases like `items`, `results`, `user`, `profile`, or resource-specific keys where older app screens still depend on them.
- Mobile repositories should call these backend endpoints through `http_service` or `api_service`, never from widgets or screens directly.
- Some older routes still exist for backward compatibility, but the endpoints above are the preferred Flutter contract moving forward.
