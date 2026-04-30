# Final Backend Frontend Integration Report

Updated: 2026-04-30

## What was fixed

### Backend routes moved or kept on durable storage

- `GET /chat/preferences`
- `PATCH /chat/threads/:id/archive`
- `PATCH /chat/threads/:id/mute`
- `PATCH /chat/threads/:id/pin`
- `PATCH /chat/threads/:id/unread`
- `DELETE /chat/threads/:id/clear`
- `GET /live-stream`
- `GET /live-stream/:id`
- `GET /live-stream/setup`
- `GET /live-stream/studio`
- `GET /live-stream/:id/comments`
- `POST /live-stream/:id/comments`
- `GET /live-stream/:id/reactions`
- `POST /live-stream/:id/reactions`
- `GET /archive/posts`
- `POST /archive/posts`
- `GET /archive/stories`
- `POST /archive/stories`
- `GET /archive/reels`
- `POST /archive/reels`
- `GET /hide/posts/all`
- `POST /hide/posts/:postId`
- `DELETE /hide/posts/:postId`
- `GET /hidden-posts`
- `GET /hidden-posts/:targetId`
- `DELETE /hidden-posts/:targetId`
- `GET /support/faqs`
- `GET /support/tickets`
- `POST /support/tickets`
- `GET /support-help`
- `GET /support-help/faq`
- `GET /support-help/chat`
- `POST /support-help/chat`
- `GET /support-help/mail`
- `GET /support/chat`
- `GET /hashtags`
- `POST /hashtags/refresh`
- `GET /trending`
- `POST /trending/refresh`
- `GET /search`
- `GET /global-search`
- `GET /search-discovery`
- `GET /marketplace/drafts`
- `POST /marketplace/drafts`
- `PATCH /marketplace/drafts/:id`
- `DELETE /marketplace/drafts/:id`
- `GET /marketplace/seller-follows`
- `POST /marketplace/sellers/:sellerId/follow`
- `DELETE /marketplace/sellers/:sellerId/follow`
- `GET /marketplace/products/:id/chat`
- `POST /marketplace/products/:id/chat/messages`
- `GET /marketplace/products/:id/offers`
- `POST /marketplace/products/:id/offers`
- `PATCH /marketplace/offers/:id`

### Frontend repositories/screens connected or cleaned up

- `../OptiZenqor_social/lib/feature/wallet_payments/repository/wallet_payments_repository.dart`
- `../OptiZenqor_social/lib/feature/wallet_payments/controller/wallet_payments_controller.dart`
- `../OptiZenqor_social/lib/feature/wallet_payments/screen/wallet_payments_screen.dart`
- `../OptiZenqor_social/lib/feature/safety_privacy/repository/safety_privacy_repository.dart`
- `../OptiZenqor_social/lib/feature/support_help/repository/support_help_repository.dart`
- `../OptiZenqor_social/lib/feature/support_help/controller/support_help_controller.dart`
- `../OptiZenqor_social/lib/feature/support_help/screen/support_help_screen.dart`
- `../OptiZenqor_social/lib/feature/trending/repository/trending_repository.dart`
- `../OptiZenqor_social/lib/feature/trending/controller/trending_controller.dart`
- `../OptiZenqor_social/lib/feature/trending/screen/trending_screen.dart`
- `../OptiZenqor_social/lib/feature/hashtags/repository/hashtags_repository.dart`
- `../OptiZenqor_social/lib/feature/hashtags/controller/hashtags_controller.dart`
- `../OptiZenqor_social/lib/feature/hashtags/screen/hashtags_screen.dart`
- `../OptiZenqor_social/lib/feature/group_chat/repository/group_chat_repository.dart`
- `../OptiZenqor_social/lib/feature/group_chat/controller/group_chat_controller.dart`
- `../OptiZenqor_social/lib/feature/group_chat/screen/group_chat_screen.dart`
- `../OptiZenqor_social/lib/feature/subscriptions/repository/subscriptions_repository.dart`
- `../OptiZenqor_social/lib/feature/subscriptions/controller/subscriptions_controller.dart`
- `../OptiZenqor_social/lib/feature/subscriptions/screen/subscriptions_screen.dart`
- `../OptiZenqor_social/lib/feature/verification_request/repository/verification_request_repository.dart`
- `../OptiZenqor_social/lib/feature/verification_request/controller/verification_request_controller.dart`
- `../OptiZenqor_social/lib/feature/verification_request/screen/verification_request_screen.dart`
- `../OptiZenqor_social/lib/feature/settings/repository/archive_repository.dart`
- `../OptiZenqor_social/lib/feature/settings/screen/archive_posts_screen.dart`
- `../OptiZenqor_social/lib/feature/settings/screen/archive_stories_screen.dart`
- `../OptiZenqor_social/lib/feature/settings/screen/archive_reels_screen.dart`
- `../OptiZenqor_social/lib/feature/marketplace/repository/marketplace_repository.dart`
- `../OptiZenqor_social/lib/feature/marketplace/screen/marketplace_screen.dart`

## Database models added

- `ChatUserPreference`
- `ChatThreadPreference`
- `UserHiddenEntity`
- `UserArchivedEntity`
- `LiveStreamSession`
- `LiveStreamComment`
- `LiveStreamReaction`
- `SupportFaq`
- `SupportTicket`
- `SupportConversation`
- `SupportMessage`
- `MarketplaceDraft`
- `MarketplaceSellerFollow`
- `MarketplaceConversation`
- `MarketplaceMessage`
- `MarketplaceOffer`
- `DiscoveryTrendingEntry`
- `DiscoveryHashtagEntry`

Manual migration files added:

- `prisma/migrations/20260430_social_state_persistence/migration.sql`
- `prisma/migrations/20260430_learning_polls_live_extensions/migration.sql`
- `prisma/migrations/20260430_marketplace_discovery_persistence/migration.sql`
- `prisma/migrations/migration_lock.toml`

## Docs and config updated

- `.env.example`
- `README.md`
- `BACKEND_API_CONTRACT.md`
- `prisma/schema.prisma`
- `src/controllers/discovery.controller.ts`
- `src/controllers/marketplace.controller.ts`
- `src/dto/api.dto.ts`
- `src/services/discovery-database.service.ts`
- `src/services/experience-database.service.ts`
- `BACKEND_FRONTEND_ENDPOINT_MISMATCH_REPORT.md`
- `BACKEND_FRONTEND_INTEGRATION_STATUS.md`
- `FRONTEND_BACKEND_AUDIT.md`
- `FRONTEND_BACKEND_MISMATCH_REPORT.md`

## Command results

### Backend

- `git pull --ff-only`: pass in backend repo
- `npm install`: pass
- `npx prisma generate`: pass via `PRISMA_GENERATE_NO_ENGINE=1`
- `npm run typecheck`: pass
- `npm run build`: pass
- `npx prisma validate`: pass
- `npm run prisma:migrate`: failed
  - first failure: repo migration history issue because `prisma/migrations/20260430_learning_polls_live_extensions/migration.sql` was missing
  - after restoring that file, Prisma reached the shared Neon DB and reported real drift
  - current drift summary: extra live call/session snapshot tables and `support_tickets` exist in the DB outside this repo migration history, so Prisma wants a destructive reset of the shared `public` schema
  - because that would drop shared data, I did not run `prisma migrate reset`
- `npm test`: not available in `package.json`
- `npm run start:dev`: sandbox `spawn EPERM` from `ts-node-dev`
- `node dist/main.js`: boot reached route registration and exposed the new marketplace routes, but runtime Prisma remained blocked locally because the normal query-engine DLL could not be regenerated while the file was locked on this machine

### Frontend

- `git pull --ff-only`: pass in frontend repo
- `flutter pub get`: pass
- `dart format` on updated files: pass
- `flutter analyze`: pass with pre-existing warnings/info only
  - `lib/core/socket/socket_transport_web.dart`
  - `lib/feature/home_feed/screen/home_feed_screen.dart`
  - unused helper warnings in story screens
- `flutter test`: failed because the repo currently has no `test/` directory or `_test.dart` files

## Remaining gaps

- Admin/auth/session/moderation/audit routes under `/admin/*` are still backed by `src/data/platform-data.service.ts` and `src/data/admin-ops-data.service.ts`.
- Flutter marketplace screens still mutate follow/chat/offer/draft state locally in `lib/feature/marketplace/controller/marketplace_controller.dart`, even though durable backend routes now exist.
- Hidden posts frontend UI is already backend-backed, so the remaining hidden/archive work is mostly non-post target coverage rather than the main hidden-post screen.
- Live stream durable create/start/end already exists; the remaining work is deeper moderation/studio CRUD and archive/viewer tooling.
- Support mail/contact payload is environment-backed configuration, not relational DB content.
- Jobs, events, pages/communities/groups completeness, learning courses, polls/surveys, business profile, and several utility features remain only partially migrated.
