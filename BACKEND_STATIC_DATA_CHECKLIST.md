# Backend Static Data Migration Checklist

This file maps the remaining frontend static/local-data areas to the current NestJS backend state as of April 26, 2026.

It is based on:

- current controllers under `src/controllers`
- current seeded services under `src/data`
- current PostgreSQL-backed core service in `src/services/core-database.service.ts`
- current Prisma schema in `prisma/schema.prisma`

## Current Backend Reality

There are three backend data states right now:

1. Database-backed already
   - Users, auth sessions, follows, posts, post reactions/comments, chat threads/messages, notifications.
   - Implemented mainly in `CoreDatabaseService`.
2. API exists but still seeded/in-memory or snapshot-backed
   - Marketplace, jobs, events, communities, bookmarks, collections, premium, creator dashboard, most preference surfaces.
   - Implemented mainly in `PlatformDataService`, `EcosystemDataService`, `ExtendedDataService`, `AppExtensionsDataService`, `SettingsDataService`.
3. API surface is missing or incomplete for full mobile replacement
   - Several settings/preference write paths, richer marketplace/job lifecycle flows, and durable sync for local-only features.

## Existing Database Coverage

Already present in `prisma/schema.prisma`:

- `app_users`
- `auth_sessions`
- `app_follow_relations`
- `app_posts`
- `app_post_reactions`
- `app_post_comments`
- `app_post_comment_reactions`
- `chat_threads`
- `chat_thread_participants`
- `chat_messages`
- `app_notifications`
- `auth_codes`

Not yet modeled in Prisma:

- marketplace listings, sellers, orders, saved searches, saved items, offers, marketplace chat
- jobs, applications, alerts, companies, employer profiles, applicants
- events, RSVPs, saves
- communities, community members, community posts, announcements, community events
- bookmarks, saved collections
- drafts, scheduled posts, upload tasks
- premium plans, subscriptions beyond current core placeholders
- creator analytics
- personalization interests and recommendation signals
- report center history/reasons
- account switching, activity sessions, muted/restricted accounts
- push/localization/accessibility/privacy preference records

## Backend-First Priority Order

1. Marketplace
2. Jobs networking
3. Events
4. Trending
5. Communities
6. Creator dashboard analytics
7. Drafts, bookmarks, saved collections sync

## Feature Checklist

### 1. Marketplace

Current backend state:

- Routes already exist in `src/controllers/marketplace.controller.ts`.
- Reads and writes are still backed by `PlatformDataService` plus `AppExtensionsDataService.marketplaceWorkspace`.
- Product creation and order creation are not database-backed.

Current routes:

- `GET /marketplace`
- `GET /marketplace/create`
- `GET /marketplace/detail`
- `GET /marketplace/detail/:id`
- `GET /marketplace/checkout`
- `POST /marketplace/checkout`
- `GET /marketplace/products`
- `GET /marketplace/products/:id`
- `POST /marketplace/create`
- `POST /marketplace/products`

Needed schema:

- `marketplace_products`
- `marketplace_product_media`
- `marketplace_categories` or normalized enum/reference table
- `marketplace_saved_items`
- `marketplace_followed_sellers`
- `marketplace_saved_searches`
- `marketplace_orders`
- `marketplace_order_items` if multi-item checkout is planned
- `marketplace_offers`
- `marketplace_threads`
- `marketplace_messages`
- `marketplace_notifications` or reuse `app_notifications` with typed metadata

Needed backend work:

- Move product list/detail/create to database repository/service.
- Add seller profile derivation from real user/store records.
- Persist saved item ids and followed seller ids per user.
- Persist order history and checkout defaults per user.
- Replace hardcoded recent/trending/recommended search blocks with query-driven results.
- Decide whether marketplace chat lives in the main chat tables or a marketplace-specific thread model.
- Add filters, pagination, and sort support because mobile fallback currently hides the missing backend depth.

Suggested endpoint additions:

- `PATCH /marketplace/products/:id/save`
- `PATCH /marketplace/sellers/:id/follow`
- `GET /marketplace/orders`
- `GET /marketplace/orders/:id`
- `POST /marketplace/products/:id/offers`
- `GET /marketplace/searches`
- `POST /marketplace/searches`
- `DELETE /marketplace/searches/:id`

Status: route surface exists, persistence missing.

### 2. Jobs Networking

Current backend state:

- Routes already exist in `src/controllers/jobs.controller.ts`.
- Entire feature is seeded from `EcosystemDataService`.
- Overview payload is useful for frontend wiring but not durable.

Current routes:

- `GET /jobs`
- `GET /jobs-networking`
- `GET /jobs/create`
- `GET /jobs/detail`
- `GET /jobs/detail/:id`
- `POST /jobs/create`
- `GET /jobs/apply`
- `POST /jobs/:id/apply`
- `POST /jobs/apply`
- `GET /jobs/applications`
- `GET /jobs/alerts`
- `GET /jobs/companies`
- `GET /jobs/profile`
- `GET /jobs/employer-stats`
- `GET /jobs/employer-profile`
- `GET /jobs/applicants`
- `GET /jobs/:id`
- `GET /professional-profiles`

Needed schema:

- `jobs`
- `job_skills`
- `job_requirements`
- `job_benefits`
- `job_applications`
- `job_alerts`
- `companies`
- `career_profiles`
- `employer_profiles`
- `employer_stats_snapshots`
- `job_applicants_view` or application join queries

Needed backend work:

- Persist job posting lifecycle: draft, published, closed.
- Persist per-user application state.
- Persist saved jobs and alerts if the mobile repo expects them.
- Split employer-side and candidate-side queries cleanly.
- Replace hardcoded recruiter/business/creator summaries with real role-aware profile data.
- Add pagination and filtering by type, experience level, company, location, remote-friendly, and featured.

Suggested endpoint additions:

- `PATCH /jobs/:id`
- `PATCH /jobs/:id/status`
- `GET /jobs/saved`
- `PATCH /jobs/:id/save`
- `POST /jobs/alerts`
- `PATCH /jobs/alerts/:id`
- `DELETE /jobs/alerts/:id`
- `GET /jobs/me/applications`

Status: route surface exists, data model missing.

### 3. Events

Current backend state:

- Routes already exist in `src/controllers/events.controller.ts`.
- Reads and writes are still backed by in-memory `PlatformDataService.events`.
- RSVP and save toggle state is not user-scoped in a durable way.

Current routes:

- `GET /events`
- `GET /events/create`
- `GET /events/pool/create`
- `GET /events/detail`
- `GET /events/:id`
- `POST /events/create`
- `POST /events/pool/create`
- `POST /events`
- `PATCH /events/:id/rsvp`
- `PATCH /events/:id/save`

Needed schema:

- `events`
- `event_hosts`
- `event_media`
- `event_rsvps`
- `event_saves`
- `event_categories` if not enum-based

Needed backend work:

- Persist event CRUD.
- Store organizer as user/page/community reference rather than plain string only.
- Make RSVP/save user-specific.
- Add attendee previews so the mobile UI can stop pulling mock users and avatars.
- Support featured/upcoming/past filters.

Suggested endpoint additions:

- `GET /events/:id/attendees`
- `PATCH /events/:id`
- `DELETE /events/:id`

Status: endpoint-ready, not relationally modeled yet.

### 4. Trending

Current backend state:

- `GET /trending` exists in `src/controllers/discovery.controller.ts`.
- Data comes from hardcoded `EcosystemDataService.trending`.

Needed schema or derivation:

- Either derive from existing engagement tables plus jobs/events/marketplace content
- Or persist periodic snapshots in `trending_snapshots`

Needed backend work:

- Define ranking sources: posts, hashtags, jobs, marketplace, events, communities.
- Decide between live computation and scheduled aggregation.
- Return stable typed entities so the app can deep-link correctly.

Suggested endpoint additions:

- `GET /trending?type=all|hashtag|post|job|event|product|community`
- `GET /hashtags`

Status: route exists, ranking engine absent.

### 5. Communities

Current backend state:

- Routes already exist in `src/controllers/communities.controller.ts`.
- Data is still seeded and snapshot-backed in `EcosystemDataService.communities`.
- Create/update/join/leave currently mutate local process memory plus snapshots, not PostgreSQL.

Current routes:

- `GET /communities`
- `GET /communities/:id`
- `GET /communities/:id/posts`
- `GET /communities/:id/members`
- `GET /communities/:id/events`
- `GET /communities/:id/pinned-posts`
- `GET /communities/:id/trending-posts`
- `GET /communities/:id/announcements`
- `POST /communities`
- `PATCH /communities/:id`
- `POST /communities/:id/join`
- `POST /communities/:id/leave`
- Pages and groups aliases also exist.

Needed schema:

- `communities`
- `community_members`
- `community_posts`
- `community_post_reactions`
- `community_events`
- `community_rules`
- `community_links`
- `community_announcements`
- `community_membership_requests` if approval flow matters
- `pages` if kept distinct from communities

Needed backend work:

- Persist community CRUD and membership.
- Replace local mock pagination with real paginated reads.
- Split community posts/events/members into separate queryable datasets.
- Add approval-required workflow and membership request statuses.
- Decide whether community posts reuse `app_posts` with scope metadata or live in dedicated tables.

Suggested endpoint additions:

- `GET /communities/:id/feed`
- `POST /communities/:id/posts`
- `GET /communities/:id/membership`
- `POST /communities/:id/requests`
- `PATCH /communities/:id/requests/:requestId`

Status: broad API exists, persistence and normalization missing.

### 6. Creator Dashboard Analytics

Current backend state:

- `GET /creator-dashboard` exists in `src/controllers/profiles.controller.ts`.
- Payload comes from `EcosystemDataService.getProfessionalProfiles().creatorTools`.
- It is a tiny static summary, not a dashboard dataset.

Needed schema or aggregation:

- likely derived from posts, stories, reels, subscriptions, followers, profile visits, engagement
- optional snapshot tables:
  - `creator_metric_daily`
  - `creator_revenue_daily`
  - `creator_audience_breakdown`

Needed backend work:

- Define dashboard periods: `7d`, `28d`, `90d`, custom.
- Add KPI metrics mobile actually expects: reach, impressions, profile visits, replies, watch time, subscriber growth, revenue.
- Add time-series endpoints instead of one static summary object.
- Add role/auth checks so only the owner can access private creator analytics.

Suggested endpoint additions:

- `GET /creator-dashboard?period=7d`
- `GET /creator-dashboard/overview`
- `GET /creator-dashboard/engagement`
- `GET /creator-dashboard/audience`
- `GET /creator-dashboard/revenue`

Status: placeholder endpoint only.

### 7. Drafts, Bookmarks, Saved Collections Sync

Current backend state:

- Drafts routes exist in `src/controllers/creator-flow.controller.ts`.
- Bookmarks routes exist in `src/controllers/bookmarks.controller.ts`.
- Saved collections routes exist in `src/controllers/discovery.controller.ts`.
- All three still use seeded/snapshot services, not Prisma.

Current routes:

- `GET /drafts`
- `GET /drafts/:id`
- `POST /drafts`
- `PATCH /drafts/:id`
- `DELETE /drafts/:id`
- `GET /scheduling`
- `GET /drafts-scheduling`
- `GET /bookmarks`
- `GET /bookmarks/:id`
- `POST /bookmarks`
- `POST /bookmarks/posts/:postId`
- `DELETE /bookmarks/:id`
- `GET /saved-collections`
- `GET /saved-collections/:id`
- `POST /saved-collections`
- `PATCH /saved-collections`
- `PATCH /saved-collections/:id`
- `DELETE /saved-collections/:id`

Needed schema:

- `post_drafts`
- `scheduled_posts`
- `upload_tasks`
- `bookmarks`
- `saved_collections`
- `saved_collection_items`

Needed backend work:

- Add user-scoped persistence.
- Decide whether drafts store raw composer JSON, normalized post fields, or both.
- Add server timestamps and sync metadata for conflict resolution with device-local drafts.
- Support moving a draft into a published post.
- Support bookmark dedupe across posts, reels, products.

Suggested endpoint additions:

- `POST /drafts/:id/publish`
- `POST /drafts/:id/schedule`
- `DELETE /saved-collections/:id/items/:itemId`

Status: route surface exists, sync layer missing.

## Secondary Static Areas Still Worth Tracking

These are lower-risk than the top seven, but still seeded today:

- Premium plans: `GET /premium-plans`, `GET /premium-membership`
- Explore recommendations: `GET /explore-recommendation`
- Report center: `GET /report-center`, `POST /report-center`
- Upload manager state: `GET /upload-manager`, `PATCH /upload-manager/:id`
- Personalization onboarding: `GET /personalization-onboarding`, `PATCH /personalization-onboarding/interests`
- Accessibility support: `GET /accessibility-support`
- Localization support: `GET /localization-support`, `PATCH /localization-support`
- Push notification preferences: `GET /push-notification-preferences`, `GET /notifications/preferences`
- Blocked/muted accounts: mixed state from `/block` plus `AppExtensionsDataService`
- Account switching: `GET /account-switching`, `PATCH /account-switching/active`
- Activity sessions: `GET /activity-sessions`, `DELETE /activity-sessions/:id`

For these, the main decision is whether each belongs in:

- user settings tables
- profile/account tables
- system configuration tables
- audit/security tables

## Recommended Implementation Sequence Inside The Backend

1. Add Prisma models for marketplace, jobs, events, communities, and saved-content sync.
2. Create feature repositories/services that mirror the existing controller boundaries.
3. Keep current routes stable and swap controller internals from seeded services to database services.
4. Backfill typed response mappers so mobile contracts do not break while persistence changes underneath.
5. Only after persistence is stable, remove seeded fallback logic from the Flutter repositories.

## Practical Rule For Frontend Removal

A frontend mock block is safe to remove only when all three are true:

1. The backend route exists.
2. The backend route returns durable user-scoped or entity-scoped data from PostgreSQL.
3. Empty backend responses are intentional product behavior, not "backend not implemented yet".
