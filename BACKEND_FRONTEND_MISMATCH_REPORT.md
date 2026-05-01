# Backend Frontend Mismatch Report

Generated from the latest fetched commits on April 29, 2026.

- Backend repo commit inspected: `776ada657577c7a80997d6369b7ef81f914d6f69`
- Frontend repo commit inspected: `c7a08ed010cb096b803d1c20cf2c84265c65253c`

## Overall status

The Flutter app is already wired to a large backend surface through `lib/core/data/api/api_end_points.dart`, but the integration is not fully production-ready yet.

Primary remaining gaps:

- Flutter still contains repository-level mock and local fallback behavior for multiple shipped features.
- Backend still exposes some utility/config-style routes through helper services such as `ExtendedDataService`, `PlatformDataService`, `EcosystemDataService`, and `SettingsDataService`.
- Several backend routes exist, but their response payloads remain placeholder summaries rather than full database-backed feature data.
- Realtime presence and some settings/catalog helper surfaces are still not fully persisted in PostgreSQL.

## Frontend expects backend, but still falls back to mock or local state

These frontend files still use mock, static, or local-first behavior:

- `lib/feature/jobs_networking/repository/jobs_networking_repository.dart`
  - Falls back to `_fallbackJobs`, local employer stats, employer profile, applicants, alerts, and professional profile data.
- `lib/feature/communities/service/community_mock_data_source.dart`
  - Entire community dataset is mock-only.
- `lib/feature/subscriptions/repository/subscriptions_repository.dart`
  - Falls back to static `_plans`.
- `lib/feature/home_feed/repository/home_feed_repository.dart`
  - Can merge local created posts and cached feed into runtime results.
- `lib/feature/events/screen/events_screen.dart`
  - Imports `core/data/mock/mock_data.dart`.
- `lib/feature/share_repost_system/screen/share_post_screen.dart`
  - Imports `core/data/mock/mock_data.dart`.
- `lib/feature/jobs_networking/repository/jobs_networking_repository.dart`
  - Uses many fallback parsing branches because backend route payloads are inconsistent across jobs endpoints.
- `lib/feature/saved_collections/repository/saved_collections_repository.dart`
  - Previously wrote local-only fallback state when remote collections were unavailable. Backend persistence is now implemented for this route in this pass.
- `lib/feature/marketplace/screen/product_details_screen.dart`
  - Seller calling is still explicitly mocked in UI copy.
- `lib/feature/live_stream/screen/live_broadcast_screen.dart`
  - Live replay and audience summary are explicitly called mock data in UI copy.

## Backend routes still backed by seeded or static runtime services

These backend areas still need follow-up because they either remain helper-backed or are only partially database-driven:

- `src/controllers/discovery.controller.ts`
  - Uses `EcosystemDataService` and `PlatformDataService` for hashtags, trending, pages, communities, products, events, and previously saved collections.
- `src/controllers/chat.controller.ts`
  - Chat threads and messages are database-backed, but archive, mute, pin, unread, preferences, and parts of presence still depend on `ExtendedDataService`.
- `src/controllers/realtime.controller.ts`
  - Group chat is database-backed and live streams are database-backed.
  - Call session persistence now exists in PostgreSQL and Prisma schema, but presence/room membership is still runtime socket state.
- `src/controllers/support.controller.ts`
  - FAQs, tickets, support chat, and support mail are database-backed or config-backed.
- `src/controllers/preferences.controller.ts`
  - Advanced privacy, safety, accessibility support, explore recommendation, push preferences, and legal compliance still compose helper/catalog metadata around persisted user settings.
- `src/controllers/account-ops.controller.ts`
  - Recommendations, master data, legal helper payloads, and non-email OTP fallback still come from `ExtendedDataService`.
- `src/controllers/auth.controller.ts`
  - Main auth flows are database-backed, but demo-account routes and descriptions still expose seeded-demo semantics.
- `src/controllers/profiles.controller.ts`
  - Tagged posts and mention history are database-derived.
  - Business/seller/recruiter summary blocks still need richer DB-native profile modules.
- `src/controllers/engagement.controller.ts`
  - Premium membership, premium, wallet-payments, subscriptions, and invite-referral still use `EcosystemDataService`.
- `src/controllers/archive.controller.ts`
  - Archive state is database-backed through `SocialStateDatabaseService`.
- `src/controllers/stories.controller.ts`
  - Main story persistence exists, but some supporting presentation helpers are still imported from legacy services.
- `src/controllers/bookmarks.controller.ts`
  - Main bookmark flow is persisted, but `POST /bookmarks/posts/:postId` still falls back to `PlatformDataService` if the post is missing in the database.

## Backend endpoints exist but payloads are still too thin for Flutter feature expectations

These routes exist, but the returned data is still incomplete versus the Flutter feature models:

- `GET /jobs/alerts`
  - Fixed in this pass. The route now resolves the authenticated user, persists alert state in `app_user_settings.settings.jobs.alerts`, and returns `items`, `results`, and `alerts`.
- `GET /jobs/profile`
  - Fixed in this pass. The route now returns a DB-derived `CareerProfileModel` shape and persists the snapshot in `app_user_settings.settings.jobs.careerProfile`.
- `GET /jobs/employer-profile`
  - Fixed in this pass. The route now returns a DB-derived `EmployerProfileModel` shape and persists the snapshot in `app_user_settings.settings.jobs.employerProfile`.
- `GET /marketplace/detail/:id`
  - Product is persisted, but `saved`, `sellerFollowed`, `chatMessages`, and `offerHistory` are still placeholders.
- `GET /communities/:id`
  - Membership is persisted, but `posts`, `pinnedPosts`, `trendingPosts`, and `announcements` are still empty placeholders.
- `GET /pages/create`
  - Returns hardcoded owner suggestions instead of database-derived user candidates.
- `GET /events/create`
  - Returns hardcoded category and location options rather than a data-backed source.
- `GET /support/tickets`
  - Flutter expects support ticket state; backend still serves static tickets.
- `GET /support-help/chat`
  - Still static helper-backed rather than persisted chat/support conversation data.

## Realtime and socket contract mismatches

Current state:

- Socket handshake contract exists in `src/services/realtime-state.service.ts`.
- Message send and read events are partially integrated with persisted thread/message data.
- Presence tracking is still in-memory.
- Thread membership and typing state are still in-memory.
- Call sessions are persisted through direct SQL tables created at runtime, but are not represented in Prisma schema.
- Live stream comments and reactions remain static-helper-backed.

Main mismatch:

- Flutter expects a more complete realtime contract across chat, notifications, presence, calls, and live content than the current persisted backend supports.

## Missing or incomplete database modeling

Already present in Prisma:

- users
- sessions
- OTP/auth codes
- follows
- posts
- post reactions
- comments and comment reactions
- stories
- reels
- uploads
- notifications
- bookmarks
- collections
- settings and privacy
- drafts and scheduling
- marketplace products and orders
- jobs and applications
- events and RSVPs
- communities and memberships
- pages and follows
- wallet
- premium plans
- subscriptions

Still missing in Prisma schema or not yet fully exposed through mobile-ready routes:

- mute state route coverage outside chat preferences
- recommendation/explore datasets
- saved job alerts
- employer profiles and candidate career profiles
- notification delivery device registration routes
- page reviews, highlights, and visitor-post rules if Flutter keeps using them

## Auth and session notes

Auth is one of the stronger areas already:

- `auth_sessions` is persisted.
- OTP and password reset codes are persisted.
- `GET /auth/me`, signup, login, refresh-token, and logout are database-backed.

Remaining issues:

- demo-account endpoints still exist and are documented as seeded-demo flows.
- some frontend fallback behavior still infers user identity from local session state when richer backend payloads are absent.

## File upload/media notes

Upload metadata persistence exists through `app_uploads`.

Remaining issues:

- frontend still uses local media state in some flows until remote upload completes.
- chat audio and attachment flows need stronger persisted metadata linkage and retrieval guarantees.
- live stream media and replay flows are not yet backed by database models.

## What was fixed in this pass

Saved collections are now database-backed through Prisma instead of `EcosystemDataService`.

Files changed for this fix:

- `src/common/id.util.ts`
- `src/dto/api.dto.ts`
- `src/services/account-state-database.service.ts`
- `src/controllers/discovery.controller.ts`

New backend behavior:

- `GET /saved-collections` now reads authenticated user collections from PostgreSQL.
- `GET /saved-collections/:id` now reads a specific authenticated collection from PostgreSQL.
- `POST /saved-collections` now creates or syncs authenticated collections in PostgreSQL.
- `PATCH /saved-collections` now adds one or more items to a persisted collection.
- `PATCH /saved-collections/:id` now updates persisted collection metadata and items.
- `DELETE /saved-collections/:id` now deletes a persisted collection.

Jobs profile/dashboard routes are now database-backed instead of placeholder controller responses.

Additional files changed for this fix:

- `src/services/experience-database.service.ts`
- `src/controllers/jobs.controller.ts`

Additional backend behavior:

- `GET /jobs-networking` now returns a composed DB-backed dashboard payload with `jobs`, `companies`, and authenticated user sections like `myJobs`, `applications`, `alerts`, `profile`, `employerStats`, `employerProfile`, and `applicants`.
- `GET /jobs/alerts` now persists and returns job alerts from `app_user_settings`.
- `GET /jobs/companies` now returns structured company payloads derived from persisted jobs and recruiters instead of bare company strings.
- `GET /jobs/profile` now returns a DB-derived career profile instead of a placeholder message.
- `GET /jobs/employer-stats` now aggregates persisted jobs, applications, and thread participation counts.
- `GET /jobs/employer-profile` now returns a DB-derived employer profile instead of a placeholder message.
- `GET /jobs/applicants` now returns recruiter-scoped applicant records built from persisted job applications.

## Recommended next backend passes

1. Replace the remaining `ExtendedDataService` helper flows in account/legal/master-data endpoints.
2. Expose push device token registration/read/revoke routes on top of the new persistence model.
3. Deepen admin analytics/configuration beyond the new persisted admin auth/session/moderation/audit baseline.
4. Continue replacing helper-driven settings/discovery presentation data with DB-derived or explicit config-backed responses.
