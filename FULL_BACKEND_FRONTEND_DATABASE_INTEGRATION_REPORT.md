# Full Backend Frontend Database Integration Report

Generated: 2026-05-01

## Current Addendum

This report is no longer only about marketplace. In the latest local pass:

- the backend jobs slice gained database-backed mutations for saved jobs, job alerts, company follows, applicant status, withdrawals, and recruiter-owned job deletion
- Flutter jobs networking stopped relying on local-only mutation state for those flows and now calls the backend
- Flutter advanced privacy, accessibility support, and legal compliance screens/controllers now load backend state and persist updates through backend settings state instead of shipping placeholder runtime content
- placeholder defaults were removed from `course_model.dart`

## Verification Snapshot

- Backend `npm run typecheck`: pass
- Backend `npm run build`: blocked by `EPERM` write lock on `dist/`
- Backend `npx prisma generate`: blocked by `EPERM` on Prisma engine rename
- Flutter `flutter pub get`: pass
- Flutter `dart format .`: pass
- Flutter `flutter analyze`: pass
- Flutter `flutter test`: no `_test.dart` files present
- Dashboard `npm run lint`: pass
- Dashboard `npm run build`: pass

## Scope completed in this pass

This pass focused on removing the remaining local-only production marketplace mutations in the Flutter app where the backend already had durable PostgreSQL-backed routes.

## Backend state used in this pass

The existing backend marketplace API already provided durable routes for:

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

No backend code changes were required in this pass because those routes were already implemented and typechecked in the current backend tree.

## Frontend code changes completed

The following Flutter files were updated to replace local-only marketplace state mutations with `ApiClientService` backed calls:

- `lib/core/data/api/api_end_points.dart`
- `lib/feature/marketplace/service/marketplace_service.dart`
- `lib/feature/marketplace/model/marketplace_chat_model.dart`
- `lib/feature/marketplace/repository/marketplace_repository.dart`
- `lib/feature/marketplace/controller/marketplace_controller.dart`
- `lib/feature/marketplace/screen/product_details_screen.dart`
- `lib/feature/marketplace/screen/marketplace_chat_screen.dart`
- `lib/feature/marketplace/screen/sell_product_screen.dart`
- `lib/feature/marketplace/screen/saved_items_screen.dart`
- `lib/feature/marketplace/screen/seller_profile_screen.dart`
- `lib/feature/marketplace/screen/my_listings_screen.dart`

## Mock or local-only marketplace behavior removed

Removed from production behavior:

- local-only seller follow toggle
- local-only marketplace draft creation
- local-only marketplace chat message creation
- local-only marketplace offer creation

Replaced with backend API persistence:

- follow and unfollow now call `/marketplace/sellers/:sellerId/follow`
- save draft now calls `/marketplace/drafts`
- delete draft now calls `/marketplace/drafts/:id`
- product chat screen now loads `/marketplace/products/:id/chat`
- sending chat messages now calls `/marketplace/products/:id/chat/messages`
- product offer history now loads `/marketplace/products/:id/offers`
- sending offers now calls `/marketplace/products/:id/offers`

## Frontend behavior improvements

- Product details now loads product-specific interaction data from the backend on screen open.
- Marketplace chat now loads durable conversation data instead of relying on whatever was last in controller memory.
- Chat alignment now uses backend `senderId` data so persisted messages are not all rendered as seller messages.
- Draft save feedback now reflects backend persistence instead of claiming device-only storage.
- Seller follow actions now surface backend errors instead of silently flipping local state.

## Intentional local-only behavior still present

These are still local or partial and need a later pass:

- saved items toggling is still local-only
- compare list state is still local-only
- listing status actions like mark sold, pause, and repost are still local UI mutations
- marketplace product delete outside of draft deletion is not yet wired to a backend delete route

## Validation run

Frontend:

- `dart format` on all touched marketplace files: passed
- `flutter analyze lib/feature/marketplace lib/core/data/api/api_end_points.dart`: passed

Backend:

- No backend source changes in this pass

## Remaining production gaps after this pass

High priority backend gaps still open:

- admin auth, admin sessions, moderation, audit dashboard still rely on static or in-memory services
- shared Neon Prisma drift still blocks safe normal migration application without reconciliation
- recommendation and admin operational datasets still need cleanup where static services remain

High priority frontend gaps still open:

- calls
- account switching
- activity sessions
- blocked and muted accounts
- saved collections
- some live-stream lifecycle screens
- jobs, pages, learning, polls, business profile, and other modules still need a fresh repo-by-repo audit against current backend reality

## Next recommended slice

1. Replace static `/admin/*` and `/admin/auth/*` backend services with Prisma-backed persistence.
2. Reconcile shared Neon drift with a safe baseline strategy before any destructive Prisma reset is attempted.
3. Continue the same frontend migration pattern for calls, sessions, blocked/muted accounts, and saved collections.
