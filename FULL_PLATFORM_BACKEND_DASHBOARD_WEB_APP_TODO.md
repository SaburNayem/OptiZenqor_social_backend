# Full Platform Backend + Dashboard + Web + App Audit

Date: 2026-05-08

## Progress Since Audit Started

Completed in this pass:

- Normalized `src/controllers/notifications.controller.ts` so these routes no longer return top-level compatibility aliases:
  - `GET /notifications`
  - `GET /notifications/inbox`
  - `PATCH/POST /notifications/:id/read`
- Normalized `src/controllers/discovery.controller.ts` so these routes no longer return top-level compatibility aliases:
  - `GET /search`
  - `GET /global-search`
  - `GET /search-discovery`
- Re-ran backend validation after the controller cleanup:
  - `npm run typecheck` passed
  - `npm run build` passed

## Completion Estimate

These are audit estimates, not feature-acceptance signoff.

| Area | Estimated Completion |
| --- | --- |
| Backend API | 74% |
| Database / Prisma persistence | 78% |
| Flutter mobile app | 69% |
| Admin dashboard | 61% |
| Web frontend | 46% |
| Full platform end-to-end integration | 63% |

## Repo Paths Audited

- Backend: `G:\My Project\Socity_backend`
- Flutter app: `G:\My Project\OptiZenqor_social`
- Admin dashboard: `G:\My Project\OptiZenqor_social_dashboard`
- Web frontend: `G:\My Project\Optizenqor_socity_frontend`

## Exact Files Inspected

Repo-wide file inventories and source scans were run with `rg --files` and targeted `rg -n` searches across all four repos.

The following files were manually inspected during this audit:

### Backend

- `prisma/schema.prisma`
- `package.json`
- `src/utils/api-response.util.ts`
- `src/controllers/admin.controller.ts`
- `src/controllers/admin-ops.controller.ts`
- `src/controllers/profiles.controller.ts`
- `src/controllers/communities.controller.ts`
- `src/controllers/support.controller.ts`
- `src/services/admin-database.service.ts`

### Flutter app

- `pubspec.yaml`
- `lib/core/config/app_config.dart`
- `lib/core/data/api/api_end_points.dart`
- `lib/core/data/api/api_payload_reader.dart`
- `lib/feature/communities/service/community_local_data_source.dart`
- `lib/feature/posts/repository/posts_repository.dart`
- `lib/feature/stories/repository/stories_repository.dart`

### Admin dashboard

- `package.json`
- `src/config/navigation.js`
- `src/services/apiClient.js`
- `src/hooks/useAdminDashboard.js`
- `src/components/AdminViews.jsx`
- `src/pages/admin/support/SupportOperationsView.jsx`
- `src/pages/admin/marketplace/MarketplaceOperationsView.jsx`

### Web frontend

- `package.json`
- `src/lib/api.ts`
- `src/hooks/useSocialApp.ts`
- `src/lib/session.ts`
- `src/types/index.ts`
- `src/data/mockSocialData.ts`

## High-Confidence Findings

### 1. Backend response normalization is only partial

The backend already has a central response helper in `src/utils/api-response.util.ts`, but many controllers and services still emit compatibility aliases outside `data`, including `items`, `results`, `communities`, `pages`, `jobs`, `streams`, `comments`, `reactions`, and `tickets`.

Confirmed examples:

- `src/controllers/communities.controller.ts`
- `src/controllers/notifications.controller.ts`
- `src/controllers/uploads.controller.ts`
- `src/controllers/realtime.controller.ts`
- `src/controllers/discovery.controller.ts`
- `src/controllers/events.controller.ts`
- `src/controllers/jobs.controller.ts`
- `src/controllers/content.controller.ts`
- `src/services/admin-database.service.ts`
- `src/services/discovery-database.service.ts`
- `src/services/experience-database.service.ts`
- `src/services/social-state-database.service.ts`

Impact:

- Flutter and dashboard clients still parse legacy aliases.
- Web frontend also expects alias-heavy and inconsistent payloads.
- The backend is not yet the clean single source of truth contract required by the platform goal.

### 2. Web frontend still contains production mock/static/fallback behavior

Confirmed files:

- `src/data/mockSocialData.ts`
- `src/lib/api.ts`
- `src/hooks/useSocialApp.ts`
- `src/lib/utils.ts`
- `src/components/LeftSidebar.tsx`
- `src/components/social/CreatePost.tsx`
- `src/components/social/PostCard.tsx`

Confirmed issues:

- `src/data/mockSocialData.ts` is a large mock dataset with demo tokens, fake session IDs, Unsplash media, UI avatar fallbacks, and synthetic social content.
- `src/lib/api.ts` falls back to `http://localhost:3000` when `VITE_API_BASE_URL` is missing.
- `src/lib/api.ts` synthesizes user IDs with `Math.random()`, default names like `Unknown User`, and generated avatar URLs.
- `src/lib/api.ts` derives product labels, trend copy, story accents, default thumbnails, and fallback profile content on the client.
- `src/hooks/useSocialApp.ts` creates optimistic-only local posts, comments, and chat messages using `createId(...)` instead of persisted IDs.
- `src/hooks/useSocialApp.ts` converts backend failures in password reset into fake success messaging:
  `Password reset instructions prepared for ...`

Impact:

- The web app is not contract-strict.
- Several user-visible states are still local-only or synthetic.
- The current web app can look healthy even when backend coverage is incomplete.

### 3. Flutter app still has local-only production state and compatibility parsing

Confirmed files:

- `lib/core/config/app_config.dart`
- `lib/core/data/api/api_payload_reader.dart`
- `lib/feature/communities/service/community_local_data_source.dart`
- `lib/feature/stories/screen/story_text_composer_screen.dart`
- `lib/feature/stories/screen/story_preview_screen.dart`
- `lib/feature/stories/screen/story_view_screen.dart`
- `lib/feature/stories/repository/stories_repository.dart`
- `lib/feature/home_feed/controller/home_feed_controller.dart`
- `lib/feature/posts/repository/posts_repository.dart`
- `lib/feature/marketplace/repository/marketplace_repository.dart`
- `lib/feature/blocked_muted_accounts/repository/blocked_muted_accounts_repository.dart`
- `lib/core/constants/storage_keys.dart`
- `lib/core/database/app_database.dart`

Confirmed issues:

- `lib/core/data/api/api_payload_reader.dart` explicitly supports legacy alias keys such as `items`, `results`, `users`, `pages`, `jobs`, `posts`, `stories`, `reels`.
- `lib/feature/stories/screen/story_text_composer_screen.dart` creates `local_story_*` IDs.
- `lib/feature/stories/screen/story_preview_screen.dart` creates `local_story_*` IDs.
- `lib/feature/stories/screen/story_view_screen.dart` and `lib/feature/home_feed/controller/home_feed_controller.dart` contain logic that treats `local_story_*` as special production objects.
- `lib/feature/communities/service/community_local_data_source.dart` persists full community group payloads into local SQLite cache table `communities_cache`.
- `lib/feature/posts/repository/posts_repository.dart` persists draft posts locally.
- `lib/core/config/app_config.dart` still includes multiple fallback backend routing strategies and a deployed backend default, which is operationally useful for debug, but it also means the app still tolerates environment drift instead of enforcing one explicit backend contract path.
- `lib/feature/marketplace/repository/marketplace_repository.dart` and `lib/feature/blocked_muted_accounts/repository/blocked_muted_accounts_repository.dart` still contain fallback extraction paths that tolerate missing backend data.

Impact:

- The mobile app is API-connected in many places, but not yet strict enough to qualify as backend-only truth for production behavior.
- Story creation and some cached feature flows still allow local-only identity/state patterns that should be confined to drafts or offline queues with explicit backend reconciliation.

### 4. Admin dashboard is API-driven, but not yet a full control surface

Confirmed files:

- `src/config/navigation.js`
- `src/hooks/useAdminDashboard.js`
- `src/components/AdminViews.jsx`
- `src/pages/admin/support/SupportOperationsView.jsx`
- `src/pages/admin/marketplace/MarketplaceOperationsView.jsx`
- `src/pages/admin/jobs/JobsOperationsView.jsx`
- `src/pages/admin/events/EventsOperationsView.jsx`
- `src/pages/admin/communities/CommunitiesOperationsView.jsx`
- `src/pages/admin/pages/PagesOperationsView.jsx`
- `src/pages/admin/live-streams/LiveStreamsOperationsView.jsx`
- `src/components/common/AdminPrimitives.jsx`

Confirmed issues:

- Dashboard reads real APIs from `VITE_API_BASE_URL`; this is good.
- Major modules such as marketplace, jobs, events, communities, pages, and live streams are currently list/detail/export views only.
- `useAdminDashboard.js` only wires mutations for:
  users, content, reports, settings, admin sessions, premium plans, notification campaigns, support tickets, notification devices.
- No dashboard mutation wiring exists yet for:
  marketplace CRUD, jobs CRUD, events CRUD, communities moderation/edit, pages moderation/edit, live stream moderation/update, wallet/subscriptions actions, audit filtering/export flows, roles management.
- Shared component set required by the task is incomplete:
  `AdminTable`, `DetailDrawer`, `ConfirmDialog`, `FilterBar` are not implemented as generalized shared primitives.
- Current destructive actions do not use a confirm dialog.
- Error handling exists, but retryable per-module error states are not generalized.

Impact:

- The dashboard is not yet able to control the full platform.
- Backend admin routes are ahead of the dashboard in several domains.

### 5. Admin/backend separation is present and mostly correct

Confirmed files:

- `src/auth/admin-session.guard.ts`
- `src/auth/session-auth.guard.ts`
- `src/controllers/admin.controller.ts`
- `src/controllers/admin-ops.controller.ts`
- `src/services/admin-database.service.ts`

Confirmed state:

- Admin routes use separate `AdminSessionGuard`.
- User routes use `SessionAuthGuard`.
- Admin login/session tokens are distinct from user auth sessions.

Remaining risk:

- This should be preserved while normalizing all clients and expanding admin action coverage.
- Audit logging coverage is not yet guaranteed for every destructive admin route.

## Exact Response-Shape Mismatch List

### Backend side

- `src/utils/api-response.util.ts` still supports compatibility aliases by design.
- `src/controllers/communities.controller.ts` returns `items`, `results`, `communities`, `pages`, `joined`, `memberCount`, `community` outside normalized `data`.
- `src/controllers/realtime.controller.ts` returns `items`, `results`, `streams`, `comments`, `reactions`.
- `src/controllers/uploads.controller.ts` returns `items`, `results`.
- `src/controllers/notifications.controller.ts` returns `items`, `results`.
- `src/controllers/discovery.controller.ts` returns `items`, `results`.
- `src/controllers/events.controller.ts` returns `items`, `results`.
- `src/controllers/jobs.controller.ts` returns `items`, `results`, `jobs`, `companies`, `alerts`, `applicants`.
- `src/services/admin-database.service.ts` returns ticket payloads with `tickets`, `results`, and `items` aliases.

### Flutter side

- `lib/core/data/api/api_payload_reader.dart` parses `items`, `results`, `payload`, `value`, and many legacy collection aliases.
- Multiple repositories still attempt payload extraction from non-normalized shapes before falling back to `data`.

### Dashboard side

- `src/services/apiClient.js` contains `extractCollection(...)` and `extractPagination(...)` helpers that intentionally search alias-heavy payloads instead of enforcing normalized `data`.

### Web side

- `src/lib/api.ts` `pickList(...)` searches `data`, `items`, `results`, `posts`, `stories`, `reels`, `jobs`, `communities`, `notifications`, and custom aliases.
- The web client is still built around permissive parsing instead of one contract.

## Exact API Routes Missing or Incomplete

These are the highest-confidence gaps found during this audit.

### Incomplete because contract normalization is not finished

- `GET /communities`
- `GET /pages`
- `GET /notifications`
- `GET /notifications/inbox`
- `GET /uploads`
- `GET /group-chat`
- `GET /calls`
- `GET /calls/sessions`
- `GET /live-stream`
- `GET /live-stream/:id/comments`
- `GET /live-stream/:id/reactions`
- `GET /events`
- `GET /jobs`
- `GET /jobs/alerts`
- `GET /jobs/companies`
- `GET /jobs/applicants`
- `GET /search`
- `GET /search-discovery`
- `GET /trending`

Reason:

- These routes still expose compatibility aliases or mixed collection shapes that should be collapsed into `{ success, message, data, pagination }`.

### Missing or incomplete persistence coverage

- Support ticket action history endpoint set backed by dedicated relational history tables.
- Support assignment history endpoint set backed by dedicated relational history tables.
- Support SLA history endpoint set backed by dedicated relational history tables.
- Moderation action history endpoint set backed by dedicated relational history tables.
- Moderation escalation history endpoint set backed by dedicated relational history tables.
- Moderation assignee history endpoint set backed by dedicated relational history tables.

Current state:

- `ModerationCase.history` and `ModerationCase.enforcementActions` are JSON fields.
- `SupportTicket` has no dedicated assignment/action/SLA history relations.

### Backend routes exist, but dashboard does not consume their control surface

These admin routes already exist in `src/controllers/admin.controller.ts` but are not fully wired in the dashboard UI:

- `POST /admin/marketplace`
- `PATCH /admin/marketplace/:id`
- `DELETE /admin/marketplace/:id`
- `POST /admin/jobs`
- `PATCH /admin/jobs/:id`
- `DELETE /admin/jobs/:id`
- `POST /admin/events`
- `PATCH /admin/events/:id`
- `DELETE /admin/events/:id`
- `PATCH /admin/communities/:id`
- `PATCH /admin/pages/:id`
- `PATCH /admin/live-streams/:id`
- `PATCH /admin/wallet-subscriptions/:id`
- `DELETE /admin/notification-devices/:id`
- `DELETE /admin/notification-campaigns/:id`
- `GET /admin/revenue/export`
- `GET /admin/wallet/export`
- `GET /admin/subscriptions/export`

## Exact Database Models / Migrations Needed

### Needed

- `SupportTicketActionHistory`
- `SupportTicketAssignmentHistory`
- `SupportTicketSlaHistory`
- `ModerationActionHistory`
- `ModerationEscalationHistory`
- `ModerationAssigneeHistory`

### Already present and should be extended or reused

- `AdminAuditLog`
- `NotificationCampaignActionHistory`
- `SettingsSectionCatalog`
- `SettingsItemCatalog`
- `LocalizationLocaleCatalog`
- `AccessibilityOptionCatalog`
- `LegalDocumentVersion`
- `CallLifecycleSnapshot`
- `LiveLifecycleSnapshot`

### Rationale

- Support and moderation history are still stored too loosely for a production control plane.
- The platform needs relational, queryable history for assignment, escalation, SLA, and enforcement auditing.
- `AdminAuditLog` exists, but destructive action coverage needs verification and likely expansion rather than a new log concept.

## Exact Frontend Files Still Using Mock / Fallback / Local Data

### Web frontend

- `src/data/mockSocialData.ts`
- `src/lib/api.ts`
- `src/hooks/useSocialApp.ts`
- `src/lib/utils.ts`
- `src/components/LeftSidebar.tsx`
- `src/components/social/CreatePost.tsx`
- `src/components/social/PostCard.tsx`

### Flutter mobile app

- `lib/core/data/api/api_payload_reader.dart`
- `lib/core/config/app_config.dart`
- `lib/feature/communities/service/community_local_data_source.dart`
- `lib/feature/stories/screen/story_text_composer_screen.dart`
- `lib/feature/stories/screen/story_preview_screen.dart`
- `lib/feature/stories/screen/story_view_screen.dart`
- `lib/feature/home_feed/controller/home_feed_controller.dart`
- `lib/feature/posts/repository/posts_repository.dart`
- `lib/feature/marketplace/repository/marketplace_repository.dart`
- `lib/feature/blocked_muted_accounts/repository/blocked_muted_accounts_repository.dart`

### Notes

- Local drafts are acceptable when clearly non-production and reconciled through backend persistence.
- Local entity IDs and compatibility parsing are not acceptable as production truth.

## Exact Dashboard Modules Needing CRUD / Action UI

### Read-only or underpowered today

- Marketplace
  current state: list, export, detail only
  missing: create, edit, delete, moderation actions, confirm dialog, filters beyond current payload

- Jobs
  current state: list, export, detail only
  missing: create, edit, delete, status actions, confirm dialog

- Events
  current state: list, export, detail only
  missing: create, edit, delete, status actions, confirm dialog

- Communities
  current state: list, export, detail only
  missing: edit, disable, moderation actions, detail actions, confirm dialog

- Pages
  current state: list, export, detail only
  missing: edit, disable, moderation actions, confirm dialog

- Live Streams
  current state: list, export, detail only
  missing: moderation/update actions, confirm dialog

- Wallet
  current state: list only
  missing: detail, filters, action controls, export wiring, role-aware finance actions

- Subscriptions
  current state: list only
  missing: detail, update/cancel/revoke actions, export wiring

- Revenue / Wallet & Subs
  current state: mostly reporting
  missing: export wiring, detail drill-in, role-aware finance actions

- Audit
  current state: list only
  missing: filters, export, richer detail

- Roles / RBAC
  current state: backend route exists, dashboard module not implemented
  missing: list/detail/update UI

### Shared components still missing from the required target state

- `AdminTable`
- `DetailDrawer`
- `ConfirmDialog`
- `FilterBar`

### Shared components present but partial

- `PaginationMeta`
- `ExportButton`
- `MetricCard`
- `StatusBadge`
- `Table`

## Validation Commands Run and Results

### Inventory / audit commands

- `rg --files` in all four repos
- targeted `rg -n` scans for API usage, mock data, local IDs, response aliases, and admin/dashboard gaps
- targeted `Get-Content` reads for the files listed above

### Validation commands actually run

Backend:

- `npm run typecheck`
  result: passed
- `npm run build`
  result: passed
- `npm run prisma:generate`
  result: passed as part of `npm run build`

Admin dashboard:

- `npm run lint`
  result: passed
- `npm run build`
  result: passed

Web frontend:

- `npm run lint`
  result: passed
- `npm run build`
  result: passed

Flutter:

- `flutter analyze`
  result: passed
  note: first run timed out at ~124s due command timeout window; second run completed with `No issues found!`

### Not yet run in this audit file

Backend:

- `npm install`
- `npm run prisma:migrate`
- `seed:dev` if available
- smoke tests requiring a running backend process:
  `GET /health`
  `GET /health/database`
  `GET /docs-json`
  admin login
  admin dashboard overview
  users list
  content list
  reports list
  support list
  marketplace list
  jobs list
  events list
  communities list
  pages list
  notifications list
  settings list

Web frontend:

- runtime auth/session smoke flow not yet executed

Admin dashboard:

- runtime admin login and module smoke flows not yet executed

Flutter:

- `flutter pub get`
- `dart format .`
- `flutter test`

## Recommended Backend-First Execution Order

1. Remove alias-heavy response leakage from backend controllers and services while preserving temporary compatibility only behind documented adapters.
2. Introduce dedicated Prisma models and migrations for support and moderation history.
3. Tighten Flutter and dashboard payload readers to prefer normalized `data` and stop scanning broad alias sets.
4. Remove web mock dataset and client-generated production identities.
5. Wire dashboard CRUD/actions to the admin routes that already exist.
6. Re-run validations plus backend smoke tests against a live local database.

## Immediate Next Change Set

Backend-first work should start with:

- `src/utils/api-response.util.ts`
- controllers still returning compatibility aliases
- services returning mixed paginated payload aliases
- Prisma schema additions for support/moderation histories

This report should be updated again after the first backend normalization pass.
