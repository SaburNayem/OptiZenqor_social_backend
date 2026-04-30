# Backend API Contract

This contract reflects the current backend implementation after the ongoing migration from seeded/static services to database-backed PostgreSQL modules.

Current local implementation uses a hybrid database access style:

- Prisma Client for many newer feature modules
- raw `pg` for the core social/auth layer and some supporting services

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

### `GET /group-chat`
### `GET /group-chat/:id`
### `POST /group-chat`
### `PATCH /group-chat/:id`
### `DELETE /group-chat/:id`
### `POST /group-chat/:id/members`
### `DELETE /group-chat/:id/members/:userId`
### `PATCH /group-chat/:id/members/:userId/role`

Group chat management is now database-backed through `chat_threads` and
`chat_thread_participants`, including persisted member roles.

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

### `GET /saved-collections`
### `GET /saved-collections/:id`
### `POST /saved-collections`
### `PATCH /saved-collections`
### `PATCH /saved-collections/:id`
### `DELETE /saved-collections/:id`

Saved collections are now persisted in PostgreSQL through `app_collections` and `app_collection_items`.

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
- `GET /jobs-networking`
- `GET /jobs/applications`
- `GET /jobs/alerts`
- `GET /jobs/companies`
- `GET /jobs/profile`
- `GET /jobs/employer-stats`
- `GET /jobs/employer-profile`
- `GET /jobs/applicants`
- `GET /jobs/:id`
- `POST /jobs/create`
- `POST /jobs/:id/apply`

These now use database-backed job and application models.

List responses return `data.jobs`, `data.items`, and `data.results` plus pagination metadata. Query support includes `page`, `limit`, `search`, `status`, `type`, `userId`, `sort`, and `order`.

`GET /jobs-networking` now returns a composed database-backed dashboard payload with `jobs`, `companies`, and, when authenticated, `myJobs`, `applications`, `alerts`, `profile`, `employerStats`, `employerProfile`, and `applicants`.

`GET /jobs/alerts`, `GET /jobs/profile`, `GET /jobs/employer-stats`, `GET /jobs/employer-profile`, and `GET /jobs/applicants` resolve the current user from the bearer token and return standardized `{ success, message, data }` responses. Compatibility aliases remain in place for collection endpoints like alerts and applicants.

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

### `POST /subscriptions/change-plan`
### `POST /subscriptions/cancel`
### `POST /subscriptions/renew`

Subscription mutations are now backed by persisted `app_subscriptions` rows and
return the active subscription payload in the standard success wrapper.

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

## Latest durable additions

### `GET /chat/preferences`
### `PUT /chat/preferences`
### `PATCH /chat/threads/:id/archive`
### `PATCH /chat/threads/:id/mute`
### `PATCH /chat/threads/:id/pin`

These routes are now backed by persisted `chat_user_preferences` and
`chat_thread_preferences` rows and return the standard success wrapper plus
compatibility aliases such as `preferences`, `preference`, and `data`.

### `GET /live-stream`
### `GET /live-stream/:id`
### `GET /live-stream/setup`
### `GET /live-stream/studio`
### `GET /live-stream/:id/comments`
### `POST /live-stream/:id/comments`
### `GET /live-stream/:id/reactions`
### `POST /live-stream/:id/reactions`

These routes are now backed by persisted live-stream session, comment, and
reaction tables in PostgreSQL.

### `GET /archive/posts`
### `GET /archive/stories`
### `GET /archive/reels`
### `POST /archive/posts`
### `POST /archive/stories`
### `POST /archive/reels`

Archive routes now return user-scoped PostgreSQL state instead of static or
seed-backed data.

### `GET /hide/posts/all`
### `POST /hide/posts/:postId`
### `DELETE /hide/posts/:postId`
### `GET /hidden-posts`
### `GET /hidden-posts/:targetId`
### `DELETE /hidden-posts/:targetId`

Hidden-post routes now return user-scoped PostgreSQL state instead of static or
seed-backed data.

## Important status note

This contract covers the preferred real integration path, but the repo still
contains some static helper modules outside these routes. The biggest remaining
backend gaps are support/help utility surfaces, the rest of the live-stream
lifecycle beyond the new durable routes above, admin utility flows, and other
controllers that still import from `src/data/*`.
