# Backend API Contract

This contract reflects the current backend implementation after the ongoing migration from seeded/static services to database-backed `Prisma + PostgreSQL` modules.

It is intentionally concise and focused on the mobile-facing routes that are already preferred for real integration.

## Global response shape

Most routes should return:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {}
}
```

Compatibility aliases may also appear, including:

- `items`
- `results`
- `user`
- `profile`
- `notifications`
- `inbox`
- `thread`
- `posts`
- `stories`
- `reels`

## Auth contract

### `POST /auth/login`

Returns:

```json
{
  "success": true,
  "message": "Login successful.",
  "token": "<accessToken>",
  "accessToken": "<accessToken>",
  "refreshToken": "<refreshToken>",
  "sessionId": "ses_xxx",
  "tokenType": "Bearer",
  "expiresInSeconds": 3600,
  "refreshExpiresInSeconds": 2592000,
  "sessionCreatedAt": "2026-04-29T12:00:00.000Z",
  "isLoggedIn": true,
  "user": {
    "id": "user_xxx",
    "name": "Example User",
    "username": "example.user",
    "email": "example@optizenqor.app"
  },
  "data": {
    "accessToken": "<accessToken>",
    "refreshToken": "<refreshToken>"
  }
}
```

### `POST /auth/refresh-token`

Accepts:

```json
{
  "refreshToken": "<refreshToken>"
}
```

Returns a fresh access/refresh pair in the same session response shape.

### `POST /auth/logout`

Revokes the current persisted session.

### `GET /auth/me`

Resolves the authenticated user from bearer token.

## App bootstrap contract

### `GET /app/bootstrap`

Returns:

- `generatedAt`
- `authenticated`
- `user`
- `counters`
- `entrypoints`
- `feedPreview`

This route is intended to be the first real backend call from Flutter startup.

## Content contract

### `GET /feed`

Returns database-backed feed items from posts and related social entities.

### `GET /posts`
### `POST /posts`
### `PATCH /posts/:id`
### `DELETE /posts/:id`

Post CRUD remains available under stable route names.

### `GET /stories`
### `GET /stories/:id`
### `POST /stories`
### `POST /stories/:id/comments`
### `POST /stories/:id/reactions`
### `POST /stories/:id/view`

Stories are database-backed through the stories persistence service.

### `GET /reels`
### `GET /reels/:id`
### `POST /reels`
### `POST /reels/:id/comments`
### `POST /reels/:id/reactions`

Reels are database-backed through the reels persistence service.

## Chat contract

### `GET /chat/threads`
### `GET /chat/threads/:id/messages`
### `POST /chat/threads/:id/messages`

These routes are database-backed and should be treated as authenticated-first.

## Notifications contract

### `GET /notifications`

Returns:

- inbox items from `app_notifications`
- campaign metadata from persisted notification campaigns
- settings/preferences from persisted user settings when user context is available

### `PATCH /notifications/:id/read`

Marks a notification as read for the requesting or specified user scope.

### `GET /notifications/preferences`

Returns persisted user settings state for notification-related flags.

## Profile and saved state contract

### `GET /profile/:id`
### `PATCH /user-profile/edit`

Profile reads and edits remain stable under the existing route shapes.

### `GET /bookmarks`
### `POST /bookmarks`
### `DELETE /bookmarks/:id`

Bookmarks are persisted in PostgreSQL.

### `GET /drafts`
### `POST /drafts`
### `PATCH /drafts/:id`
### `DELETE /drafts/:id`

Draft and scheduling metadata are persisted in PostgreSQL.

## Experience contract

### Marketplace

- `GET /marketplace`
- `GET /marketplace/products`
- `GET /marketplace/products/:id`
- `POST /marketplace/products`
- `POST /marketplace/checkout`

These now use database-backed product and order models.

List responses return `data.products`, `data.items`, and `data.results` plus pagination metadata. Query support includes `page`, `limit`, `search`, `category`, `status`, `sellerId`, `sort`, and `order`.

### Jobs

- `GET /jobs`
- `GET /jobs/:id`
- `POST /jobs/create`
- `POST /jobs/:id/apply`

These now use database-backed job and application models.

List responses return `data.jobs`, `data.items`, and `data.results` plus pagination metadata. Query support includes `page`, `limit`, `search`, `status`, `type`, `userId`, `sort`, and `order`.

### Events

- `GET /events`
- `GET /events/:id`
- `POST /events`
- `PATCH /events/:id/rsvp`
- `PATCH /events/:id/save`

These now use database-backed event and RSVP models.

List responses return `data.events`, `data.items`, and `data.results` plus pagination metadata. Query support includes `page`, `limit`, `search`, `status`, `category`, `userId`, `sort`, and `order`.

### Communities and pages

- `GET /communities`
- `GET /communities/:id`
- `POST /communities`
- `POST /communities/:id/join`
- `POST /communities/:id/leave`
- `GET /pages`
- `GET /pages/:id`
- `POST /pages/create`
- `PATCH /pages/:id/follow`

These now use database-backed community/page models and membership/follow records.

List responses return compatibility aliases in `data.communities` or `data.pages` alongside `data.items` and `data.results`, with pagination metadata. Community queries support `page`, `limit`, `search`, `category`, `privacy`, `userId`, `sort`, and `order`. Page queries support `page`, `limit`, `search`, `category`, `ownerId`, `sort`, and `order`.

## Monetization contract

### `GET /wallet`

Returns the authenticated user wallet account plus transaction list.

### `GET /monetization/overview`

Returns:

- wallet
- subscriptions
- premium plans

### `GET /monetization/wallet`
### `GET /monetization/subscriptions`
### `GET /monetization/plans`
### `GET /premium-plans`
### `GET /premium-membership`
### `GET /premium`

These now resolve through persisted wallet, plan, subscription, and campaign models rather than static arrays.

## Realtime contract

Namespace:

```text
/realtime
```

Currently exposed event families include:

- message create/broadcast
- read state updates
- presence updates

## Important status note

This contract covers the preferred real integration path, but the repo still contains some static helper modules outside these routes. Admin, support/help, advanced discovery/trending, and several utility surfaces still need the same database-backed replacement before the entire backend can be called fully mock-free.
