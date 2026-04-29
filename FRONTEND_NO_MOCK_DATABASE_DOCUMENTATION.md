# Frontend No-Mock Database Integration Documentation

This document defines how the Flutter app must integrate with the backend as a real database-backed product, not a mock-first demo.

It is written for:

- Flutter app: `OptiZenqor_social`
- Backend app: `OptiZenqor_social_backend`
- Backend stack: `NestJS + Prisma + PostgreSQL`

## Objective

The Flutter app must use the backend as the single source of truth for all user, feed, messaging, commerce, creator, moderation, and settings data.

The backend must not depend on:

- in-memory arrays as production state
- seeded-only repositories as request-time data sources
- static response builders as the primary implementation
- mock-first flows inside controllers

Mock seed data may exist only for local development bootstrap and only through database seed scripts.

## No-Mock Rule

The frontend must not rely on local mock repositories once backend integration is enabled.

The backend must persist all create, update, delete, toggle, reaction, save, follow, block, report, upload, schedule, and session actions in PostgreSQL.

For every Flutter screen:

1. UI triggers a repository method.
2. Repository calls `http_service` or `api_service`.
3. Backend controller validates the request.
4. Service writes or reads from Prisma/PostgreSQL.
5. Response is returned in the existing API convention.

## Response Convention

All backend responses should follow:

```json
{
  "success": true,
  "message": "Human readable message",
  "data": {}
}
```

Compatibility aliases should remain where older Flutter screens expect them:

- `items`
- `results`
- `user`
- `profile`
- `posts`
- `stories`
- `reels`
- `notifications`
- `thread`
- `messages`

## Authentication Standard

The Flutter app should treat backend auth as session-based JWT auth with database-backed revocation.

Required flows:

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/verify-email/confirm`

Required backend behavior:

- password hashing
- access token
- refresh token
- persisted `auth_sessions`
- email OTP with expiry
- session revocation on logout
- authenticated user resolution from bearer token

All user-specific actions must default to the authenticated user and only use body/query fallback IDs when explicitly allowed for compatibility.

## Core Flutter-to-Backend Entry Points

These are the primary backend routes the Flutter app should treat as canonical:

- `GET /app/bootstrap`
- `POST /auth/login`
- `POST /auth/signup`
- `GET /auth/me`
- `GET /feed`
- `GET /stories`
- `GET /reels`
- `GET /chat/threads`
- `GET /chat/threads/:id/messages`
- `POST /chat/threads/:id/messages`
- `GET /notifications`
- `GET /profile/:id`
- `PATCH /user-profile/edit`
- `GET /marketplace/products`
- `GET /jobs`
- `GET /events`
- `GET /settings/state`

Where old aliases exist, keep them alive until Flutter repositories are fully switched.

## Frontend Feature Coverage

Based on the Flutter product documentation and architecture, the backend must support these feature groups as real persistent modules.

### 1. App Bootstrap and Session Init

Flutter expects app startup to return:

- authenticated user snapshot
- counters
- route entrypoints
- config flags
- preview feed
- feature availability

Backend ownership:

- `GET /app/bootstrap`
- `GET /app/config`
- `POST /app/session-init`

Database-backed sources:

- user profile
- unread notification counts
- story counts
- reel counts
- marketplace counts
- jobs counts
- events counts
- communities counts

### 2. Auth and Profile

Flutter auth and profile flows require:

- login
- signup
- forgot password
- reset password
- email verification
- profile fetch
- profile edit
- followers
- following
- follow/unfollow
- block/report/share profile actions

Database-backed tables and services:

- `app_users`
- `auth_sessions`
- `auth_codes`
- `app_follow_relations`
- `app_user_blocks`
- `app_user_reports`
- `app_user_settings`
- `app_user_privacy`

### 3. Home Feed and Posts

Flutter home feed requires:

- feed list
- suggested users
- create post
- update post
- delete post
- like/unlike
- comments
- replies
- reactions
- save/bookmark
- hide/report

Database-backed tables:

- `app_posts`
- `app_post_reactions`
- `app_post_comments`
- `app_post_comment_reactions`
- `app_bookmarks`
- `app_user_reports`

### 4. Stories

Flutter stories require:

- create story
- list stories
- story viewer
- reactions
- comments
- view tracking
- expiry

Database-backed tables:

- `app_stories`
- `app_story_comments`
- `app_story_reactions`
- `app_story_views`

### 5. Reels

Flutter reels require:

- reel feed
- reel detail
- comments
- reactions
- save/share metadata
- author linkage

Database-backed tables:

- `app_reels`
- `app_reel_comments`
- `app_reel_reactions`
- bookmark or collection linkage for saves

### 6. Chat and Messaging

Flutter chat requires:

- threads
- direct chat
- group chat if enabled
- participants
- messages
- attachments metadata
- unread state
- reply-to message support
- typing and online status via realtime

Database-backed tables:

- `chat_threads`
- `chat_thread_participants`
- `chat_messages`
- `app_uploads`

Realtime transport:

- Socket.IO auth
- thread subscription
- typing
- delivery updates
- read receipts

### 7. Notifications

Flutter notifications require:

- inbox
- unread count
- mark read
- category metadata
- payload routing
- notification preferences

Database-backed tables:

- `app_notifications`
- `app_user_settings`
- `app_user_privacy`
- future device token table for push notifications

### 8. Marketplace

Flutter marketplace requires:

- products
- product detail
- seller profile
- create listing
- saved items
- followed sellers
- checkout
- orders
- saved searches
- offers
- seller chat

Database-backed tables:

- `app_marketplace_products`
- `app_marketplace_orders`
- `app_bookmarks`
- optional seller-follow relation reuse
- future marketplace chat threads using `chat_threads`

### 9. Jobs

Flutter jobs requires:

- jobs list
- job detail
- create job
- apply for job
- employer data
- applicant data
- saved jobs
- alerts

Database-backed tables:

- `app_jobs`
- `app_job_applications`
- future saved-jobs table or bookmark type reuse

### 10. Events

Flutter events require:

- events list
- event detail
- create event
- RSVP
- save event
- attendees
- host information

Database-backed tables:

- `app_events`
- `app_event_rsvps`

### 11. Communities, Pages, and Groups

Flutter communities/pages/groups require:

- create
- update
- detail
- members
- join/leave
- approval-based membership support
- announcements
- linked events
- page follow

Database-backed tables:

- `app_communities`
- `app_community_members`
- `app_pages`
- `app_page_follows`

### 12. Drafts, Scheduling, Upload Manager

Flutter content creation flows require:

- drafts
- scheduled posts
- upload queue
- retry/cancel/pause metadata

Database-backed tables:

- `app_post_drafts`
- `app_scheduled_posts`
- `app_uploads`

### 13. Bookmarks and Saved Collections

Flutter saved content flows require:

- bookmarks
- collections
- collection items
- move saved item into collection

Database-backed tables:

- `app_bookmarks`
- `app_collections`
- `app_collection_items`

### 14. Creator Dashboard and Analytics

Flutter creator tools require:

- counts
- engagement metrics
- draft metrics
- content performance

Database-backed sources:

- posts
- reels
- stories
- bookmarks
- drafts
- scheduled posts
- future monetization tables

### 15. Wallet, Payments, Premium, Subscriptions

Flutter monetization flows require backend persistence for:

- wallet state
- transactions
- premium plan state
- subscriptions
- purchase status

Current direction:

- `app_subscriptions` exists in schema direction
- wallet and transactions still need dedicated persistent tables and services

### 16. Settings, Privacy, Accessibility, Localization, Push Preferences

Flutter settings flows require:

- settings state
- privacy state
- preference toggles
- accessibility preferences
- localization preferences
- push preferences

Database-backed tables:

- `app_user_settings`
- `app_user_privacy`
- future device token / push preference tables

### 17. Moderation, Reports, Safety, Legal

Flutter safety and support flows require:

- reporting users and content
- report center
- blocked users
- safety/privacy state
- support tickets
- future moderation queues

Database-backed tables:

- `app_user_reports`
- `app_user_blocks`
- future support ticket and audit log tables

## Required Database Modules

The backend should treat these as required persistent modules:

- users
- sessions
- auth codes
- follows
- posts
- post reactions
- post comments
- post comment reactions
- stories
- story reactions
- story comments
- story views
- reels
- reel comments
- reel reactions
- chat threads
- chat participants
- chat messages
- uploads
- notifications
- bookmarks
- collections
- collection items
- user blocks
- user reports
- settings
- privacy
- drafts
- scheduled posts
- marketplace products
- marketplace orders
- jobs
- job applications
- events
- event RSVPs
- communities
- community members
- pages
- page follows
- subscriptions

Still required in later passes:

- wallet accounts
- wallet transactions
- payment intents
- admin users
- audit logs
- support tickets
- push device tokens
- mute tables
- hidden post tables
- call session records
- live stream session records

## Backend Implementation Rules

Every controller must follow this structure:

1. Validate DTO
2. Resolve authenticated user if needed
3. Call service
4. Service uses Prisma or SQL-backed persistence
5. Return standardized API response

Do not:

- call static data services as the main source of truth
- mutate local arrays to represent saved state
- rely on process memory for user data or feature state
- return demo-only records when the database already contains the domain

## Pagination, Filtering, Sorting

The Flutter app is broad enough that these must exist in all large list APIs.

Recommended query support:

- `page`
- `limit`
- `cursor`
- `sort`
- `order`
- `status`
- `type`
- `category`
- `userId`
- `search`

Must be applied to:

- feed
- posts
- notifications
- chat messages
- marketplace products
- jobs
- events
- communities

## Realtime Requirements

The frontend expects live interactions beyond REST.

Required realtime roadmap:

- chat message broadcast
- unread counter sync
- typing indicator
- online status
- notification push events
- call session signaling records
- live event updates if live features exist

Recommended stack:

- Socket.IO
- authenticated socket handshake
- thread/channel membership
- later Redis adapter for scale

## Storage Requirements

The frontend has upload-heavy flows, so files must not live only in request memory.

Required upload system:

- S3 or Cloudinary or Supabase Storage
- upload metadata persisted in `app_uploads`
- ownership
- mime type
- provider
- resource type
- folder
- status
- secure URL

## Environment Requirements

The backend environment must define:

- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- SMTP config
- CORS origins
- Cloudinary or S3 config
- frontend URLs
- rate limit config

## Required Documentation Files

These backend docs must stay aligned with Flutter integration:

- `README.md`
- `BACKEND_API_CONTRACT.md`
- `FLUTTER_BACKEND_CONTRACT.md`
- `BACKEND_CURL_REFERENCE.md`
- this file

## Current Reality and Migration Policy

The project started as a frontend-ready demo API with seeded/static helper services.

Migration policy from now on:

1. Existing route names remain stable where possible.
2. Database-backed implementations replace mock/static internals.
3. Compatibility aliases stay in responses until Flutter repositories are updated.
4. Seed data is allowed only through seed scripts, not runtime source-of-truth services.
5. New feature work should be Prisma-first.

## Frontend Repository Guidance

Flutter repositories should now be migrated screen-by-screen to:

- remove mock repository fallback
- call backend endpoints only
- trust backend counters and lists
- treat local state as cache or view state only

Flutter UI code should not:

- synthesize fake saved/bookmarked/followed state when backend exists
- fabricate profile stats
- simulate chat or order persistence
- treat local mutation as authoritative after server integration

## Recommended Rollout Order

1. Auth and profile
2. Feed and posts
3. Stories and reels
4. Notifications
5. Chat and attachments
6. Marketplace
7. Jobs
8. Events
9. Communities and pages
10. Drafts, scheduling, uploads
11. Creator analytics
12. Wallet, subscriptions, premium
13. Admin, audit, moderation
14. Push devices, calls, live stream

## Definition of Done

Frontend and backend are considered aligned only when:

- Flutter no longer depends on mock repositories for shipped flows
- backend endpoints are database-backed
- all user actions persist in PostgreSQL
- auth is token-based and revocable
- upload metadata is persistent
- major lists support pagination
- settings and preference toggles persist
- chat and notifications are live-backed or persistable
- docs match actual responses

At that point, the backend becomes the single system of record for the Flutter social app.
