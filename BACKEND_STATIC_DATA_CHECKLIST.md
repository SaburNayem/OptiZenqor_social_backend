# Backend Static Data Migration Checklist

Last updated: 2026-04-29

This checklist tracks the LOCAL backend repo state, not the older public migration notes.

## Current backend reality

There are now three backend data modes:

1. Database-backed and already preferred for production-facing routes
   - Auth sessions and `/auth/me`
   - Users/profiles/follows
   - Feed, posts, comments, reactions
   - Stories and reels
   - Chat threads/messages
   - Notifications
   - Bookmarks, collections, drafts, scheduling
   - Marketplace products/orders
   - Jobs/applications/alerts/profile composition
   - Events and RSVP/save state
   - Communities/pages and membership/follow state
   - Wallet, plans, subscriptions, campaigns
   - Settings and preferences core user-state surfaces
   - Discovery/search/trending and main profile dashboard surfaces

2. Partially database-backed but still mixed with static or snapshot-backed helpers
   - Support/help
   - Realtime/chat adjunct routes
   - Admin utility surfaces
   - Upload/storage delivery hardening
   - Some advanced utility screens such as deep links, app update preview, offline sync preview, learning/polls/localization extras

3. Still seeded, static, or in-memory
   - Remaining controllers under `src/controllers` that still import from `src/data/*`
   - Snapshot state managed through `StateSnapshotService`

## Database access style

The local backend is currently a hybrid:

- Prisma Client is used for many newer feature modules under `src/services/*`
- Raw `pg` via `DatabaseService` is still used intentionally in `CoreDatabaseService` and some supporting services

This means the backend is database-backed, but not yet a pure Prisma-only codebase.

## Seed safety

- Runtime startup no longer seeds demo data
- Development seeding should use the explicit `npm run seed:dev` script
- Production startup does not depend on seeded arrays or startup-time mock inserts

## Completed migrations

- Bookmarks no longer fall back to mock post data
- Settings and preferences core user-scoped flows moved off mutable seeded state
- Discovery/search/trending moved off seeded ecosystem/platform services
- Profiles and dashboard profile surfaces moved off seeded ecosystem services
- Support tickets moved out of in-memory ecosystem state and into a real database table
- Account switching, activity sessions, and verification request routes moved off snapshot-backed `AppExtensionsDataService`
- Auth password hashing moved to `argon2`, and demo-account exposure is now opt-in via env instead of implied by the normal auth flow
- Group chat create/update/delete/member-management routes are now durable against `chat_threads` and `chat_thread_participants`
- Chat thread archive/mute/pin/preferences are now durable against `chat_thread_preferences` and `chat_user_preferences`
- Live stream list/detail/setup/studio/comments/reactions are now durable against `app_live_stream_*` tables
- Hidden-post and archive read/write state for posts/stories/reels are now durable against `app_user_hidden_entities` and `app_user_archived_entities`
- Subscription plan change/cancel/renew routes are now durable against `app_subscriptions`
- Flutter feed hide/unhide state now uses the durable hidden-post routes instead of `HomeFeedController` local-only state
- Flutter live-stream lifecycle now uses durable create/start/end/comment routes instead of setup-only UI state

## Remaining static dependency hotspots

- `src/controllers/account-ops.controller.ts`
- `src/controllers/auth.controller.ts`
- `src/controllers/admin.controller.ts`
- `src/controllers/posts.controller.ts`
- `src/controllers/stories.controller.ts`
- `src/controllers/engagement.controller.ts`
- `src/controllers/invite-friends.controller.ts`
- `src/controllers/media-viewer.controller.ts`
- `src/controllers/deep-link-handler.controller.ts`
- `src/controllers/offline-sync.controller.ts`
- `src/controllers/maintenance-mode.controller.ts`
- `src/controllers/onboarding.controller.ts`
- `src/controllers/personalization-onboarding.controller.ts`
- `src/controllers/localization-support.controller.ts`
- `src/controllers/polls-surveys.controller.ts`
- `src/controllers/app-update-flow.controller.ts`
- `src/controllers/share-repost.controller.ts`

## Priority order for remaining migration

1. Admin and moderation utility routes
2. Story/post detail adjunct state
3. Utility app surfaces still backed by `src/data/*`
4. Full live-stream lifecycle mutation flows beyond the durable list/detail/comment/reaction slice

## Practical production rule

No production route should depend on:

- seeded arrays
- process-memory mutations as the source of truth
- snapshot tables as the primary durable store for app entities
- fake fallback responses when the database has no rows

If data is empty, return the real empty database state.
