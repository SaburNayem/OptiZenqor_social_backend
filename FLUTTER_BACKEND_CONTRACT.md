# Flutter Backend Contract

This file defines the preferred backend contract for the Flutter app after the current database migration work.

The intent is:

- Flutter repositories call backend APIs only
- backend returns durable PostgreSQL-backed data
- response shapes stay compatible with older mobile screens where possible

## Auth

### `POST /auth/login`
- Returns: JWT-style `accessToken`, `refreshToken`, `sessionId`, `expiresInSeconds`, `user`
- Auth: none

### `POST /auth/signup`
- Returns: created session plus verification payload
- Auth: none

### `POST /auth/refresh-token`
- Returns: fresh access/refresh token pair
- Auth: none

### `POST /auth/logout`
- Purpose: revoke current persisted session
- Auth: bearer token

### `GET /auth/me`
- Purpose: resolve authenticated user from bearer token
- Auth: required

## App bootstrap

### `GET /app/bootstrap`
- Returns:
  - current user snapshot when authenticated
  - counters
  - route entrypoints
  - preview feed
- Auth: optional bearer token

### `POST /app/session-init`
- Purpose: compatibility bootstrap route for app startup
- Auth: optional bearer token

## Feed and content

### `GET /feed`
- Purpose: database-backed feed list
- Auth: optional

### `GET /posts`
### `POST /posts`
### `PATCH /posts/:id`
### `DELETE /posts/:id`
- Purpose: core post CRUD
- Auth: create/update/delete should be authenticated in practice

### `GET /stories`
### `POST /stories`
### `POST /stories/:id/comments`
### `POST /stories/:id/reactions`
### `POST /stories/:id/view`
- Purpose: database-backed stories flow

### `GET /reels`
### `POST /reels`
### `POST /reels/:id/comments`
### `POST /reels/:id/reactions`
- Purpose: database-backed reels flow

## Chat

### `GET /chat/threads`
### `GET /chat/threads/:id/messages`
### `POST /chat/threads/:id/messages`
- Purpose: database-backed chat flow
- Auth: required

### `GET /chat/preferences`
### `PUT /chat/preferences`
### `PATCH /chat/threads/:id/archive`
### `PATCH /chat/threads/:id/mute`
### `PATCH /chat/threads/:id/pin`
- Purpose: persisted per-user chat preference state
- Auth: required

## Notifications

### `GET /notifications`
- Purpose: notification inbox
- Returns compatibility aliases:
  - `notifications`
  - `items`
  - `results`
  - `data`
  - `inbox`

### `PATCH /notifications/:id/read`
- Purpose: mark notification as read

### `GET /notifications/preferences`
- Purpose: read persisted notification and settings state
- Auth: required

## Profile

### `GET /profile/:id`
- Purpose: public profile plus summary blocks
- Auth: optional

### `PATCH /user-profile/edit`
- Preferred mobile meaning: update current authenticated profile
- Auth: required

## Saved state

### `GET /bookmarks`
### `POST /bookmarks`
### `DELETE /bookmarks/:id`
- Purpose: persisted saved/bookmark state
- Auth: required

### `GET /drafts`
### `POST /drafts`
### `PATCH /drafts/:id`
### `DELETE /drafts/:id`

## Live stream and hidden/archive state

### `GET /live-stream`
### `GET /live-stream/:id`
### `GET /live-stream/setup`
### `GET /live-stream/studio`
### `GET /live-stream/:id/comments`
### `POST /live-stream/:id/comments`
### `GET /live-stream/:id/reactions`
### `POST /live-stream/:id/reactions`
- Purpose: durable live-stream session, comment, and reaction flows

### `GET /archive/posts`
### `GET /archive/stories`
### `GET /archive/reels`
### `POST /archive/posts`
### `POST /archive/stories`
### `POST /archive/reels`
- Purpose: authenticated archived content state

### `GET /hide/posts/all`
### `POST /hide/posts/:postId`
### `DELETE /hide/posts/:postId`
### `GET /hidden-posts`
### `GET /hidden-posts/:targetId`
### `DELETE /hidden-posts/:targetId`
- Purpose: authenticated hidden post state
- Purpose: persisted draft and scheduling state
- Auth: required

### `GET /saved-collections`
### `GET /saved-collections/:id`
### `POST /saved-collections`
### `PATCH /saved-collections`
### `PATCH /saved-collections/:id`
### `DELETE /saved-collections/:id`
- Purpose: persisted saved collections and collection items
- Auth: required
- `GET /saved-collections` returns `data.collections`, `data.items`, and `data.results`

## Marketplace

### `GET /marketplace/products`
### `GET /marketplace/products/:id`
### `POST /marketplace/products`
### `POST /marketplace/checkout`
- Purpose: database-backed marketplace products and orders
- `GET /marketplace/products` returns `data.products`, `data.items`, `data.results`, and pagination metadata
- Query support: `page`, `limit`, `search`, `category`, `status`, `sellerId`, `sort`, `order`

## Jobs

### `GET /jobs`
### `GET /jobs-networking`
### `GET /jobs/applications`
### `GET /jobs/alerts`
### `GET /jobs/companies`
### `GET /jobs/profile`
### `GET /jobs/employer-stats`
### `GET /jobs/employer-profile`
### `GET /jobs/applicants`
### `GET /jobs/:id`
### `POST /jobs/create`
### `POST /jobs/:id/apply`
- Purpose: database-backed jobs and applications
- `GET /jobs` returns `data.jobs`, `data.items`, `data.results`, and pagination metadata
- Query support: `page`, `limit`, `search`, `status`, `type`, `userId`, `sort`, `order`
- `GET /jobs-networking` now returns the full jobs dashboard aggregate expected by Flutter, including `jobs`, `companies`, and authenticated user blocks like `myJobs`, `applications`, `alerts`, `profile`, `employerStats`, `employerProfile`, and `applicants`
- `GET /jobs/alerts` and `GET /jobs/applicants` keep `data.items`, `data.results`, and feature-specific aliases (`alerts`, `applicants`)
- `GET /jobs/profile`, `GET /jobs/employer-stats`, and `GET /jobs/employer-profile` now return persisted or DB-derived user-scoped payloads instead of placeholder messages

## Events

### `GET /events`
### `GET /events/:id`
### `POST /events`
### `PATCH /events/:id/rsvp`
### `PATCH /events/:id/save`
- Purpose: database-backed event lifecycle and attendance state
- `GET /events` returns `data.events`, `data.items`, `data.results`, and pagination metadata
- Query support: `page`, `limit`, `search`, `status`, `category`, `userId`, `sort`, `order`

## Communities and pages

### `GET /communities`
### `GET /communities/:id`
### `POST /communities`
### `POST /communities/:id/join`
### `POST /communities/:id/leave`
- Purpose: database-backed communities and membership
- `GET /communities` returns `data.communities`, `data.items`, `data.results`, and pagination metadata
- Query support: `page`, `limit`, `search`, `category`, `privacy`, `userId`, `sort`, `order`

### `GET /pages`
### `GET /pages/:id`
### `POST /pages/create`
### `PATCH /pages/:id/follow`
- Purpose: database-backed pages and follows
- `GET /pages` returns `data.pages`, `data.items`, `data.results`, and pagination metadata
- Query support: `page`, `limit`, `search`, `category`, `ownerId`, `sort`, `order`

## Settings and monetization

### `GET /settings/state`
### `PATCH /settings/state`
- Purpose: persisted settings and privacy state
- Auth: required
- `GET /settings/state` remains the canonical persisted settings payload for Flutter preference screens

### `GET /wallet`
- Purpose: wallet account and wallet transaction view
- Auth: required

### `GET /monetization/overview`
- Purpose: wallet, subscriptions, premium plans in one payload
- Auth: required

### `GET /premium-plans`
- Purpose: active premium plan catalog

## Compatibility rules

- Keep existing route names where possible.
- Keep response aliases where existing Flutter code still depends on them.
- Prefer authenticated user scope over request-body user IDs.
- Do not use runtime mock arrays as source of truth for these routes.

## Current limitation note

This contract represents the preferred mobile integration path, but some backend utility/admin/discovery modules still need the same database-backed migration before the entire repo can be called fully mock-free.
