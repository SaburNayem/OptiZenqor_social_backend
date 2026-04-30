# API Endpoint Reference

This file is an endpoint inventory generated from the NestJS controllers under `src/controllers`.

- Total documented HTTP endpoints: 358.
- No global `/api` prefix is configured, so the paths below are the full route paths.
- Default local server from `src/main.ts`: `http://localhost:3000`.
- Swagger endpoints: `GET /docs`, `GET /docs-json`, `GET /docs-yaml`.

## System API Module

### HealthController (3 endpoints)
- `GET /`
- `GET /health`
- `GET /health/database`

### BootstrapController (3 endpoints)
- `GET /app/bootstrap`
- `GET /app/config`
- `POST /app/session-init`

### AuthController (10 endpoints)
- `GET /auth/demo-accounts`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/refresh-token`
- `POST /auth/logout`
- `POST /auth/signup`
- `POST /auth/verify-email/confirm`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/me`

### OnboardingController (4 endpoints)
- `GET /onboarding/slides`
- `GET /onboarding/state`
- `GET /onboarding/interests`
- `POST /onboarding/complete`

### AccountOpsController (18 endpoints)
- `POST /auth/send-otp`
- `POST /auth/resend-otp`
- `POST /auth/verify-otp`
- `GET /recommendations`
- `GET /chat/presence`
- `GET /chat/preferences`
- `PATCH /notification-preferences`
- `GET /notification-preferences`
- `GET /safety/config`
- `GET /support/chat`
- `GET /wallet/ledger`
- `GET /master-data`
- `GET /legal/consents`
- `PATCH /legal/consents`
- `POST /legal/account-deletion`
- `POST /legal/data-export`
- `GET /security/state`
- `POST /security/logout-all`

## Content API Module

### UsersController (9 endpoints)
- `GET /users`
- `GET /users/:id`
- `GET /users/:id/followers`
- `GET /users/:id/following`
- `PATCH /users/:id`
- `PATCH /users/:id/follow`
- `PATCH /users/:id/unfollow`
- `POST /users/change-password`
- `DELETE /users/:id`

### ContentController (2 endpoints)
- `GET /feed`
- `GET /feed/home`

### PostsController (6 endpoints)
- `GET /posts`
- `GET /posts/:id`
- `POST /posts`
- `POST /posts/create`
- `PATCH /posts/:id`
- `DELETE /posts/:id`

### LikesController (4 endpoints)
- `GET /posts/:id/reactions`
- `POST /posts/:id/reactions`
- `PATCH /posts/:id/like`
- `PATCH /posts/:id/unlike`

### MediaViewerController (2 endpoints)
- `GET /media-viewer`
- `GET /media-viewer/:id`

### MessagesController (3 endpoints)
- `GET /messages`
- `GET /messages/:id`
- `POST /messages/:id`

### StoriesController (9 endpoints)
- `GET /stories`
- `GET /stories/:id`
- `POST /stories`
- `PATCH /stories/:id`
- `GET /stories/:id/comments`
- `POST /stories/:id/comments`
- `GET /stories/:id/reactions`
- `POST /stories/:id/reactions`
- `DELETE /stories/:id`

### ReelsController (9 endpoints)
- `GET /reels`
- `GET /reels/:id`
- `POST /reels`
- `PATCH /reels/:id`
- `GET /reels/:id/comments`
- `POST /reels/:id/comments`
- `GET /reels/:id/reactions`
- `POST /reels/:id/reactions`
- `DELETE /reels/:id`

### UploadsController (4 endpoints)
- `GET /uploads`
- `GET /uploads/:id`
- `POST /uploads`
- `POST /upload-manager`

### CommentsController (6 endpoints)
- `GET /posts/:id/comments`
- `POST /posts/:id/comments`
- `GET /posts/:id/comments/:commentId/replies`
- `POST /posts/:id/comments/:commentId/replies`
- `PATCH /posts/:id/comments/:commentId/react`
- `DELETE /posts/:id/comments/:commentId`

### CreatorFlowController (12 endpoints)
- `GET /drafts`
- `GET /posts/drafts`
- `GET /drafts/:id`
- `POST /drafts`
- `PATCH /drafts/:id`
- `DELETE /drafts/:id`
- `GET /scheduling`
- `GET /posts/scheduled`
- `GET /drafts-scheduling`
- `GET /upload-manager`
- `GET /upload-manager/:id`
- `PATCH /upload-manager/:id`

### ChatController (13 endpoints)
- `GET /chat`
- `GET /chat/detail`
- `GET /chat/detail/:id`
- `GET /chat/settings`
- `GET /chat/threads`
- `GET /chat/threads/:id`
- `POST /chat/threads/:id/messages`
- `PATCH /chat/threads/:id/read`
- `PATCH /chat/threads/:id/archive`
- `PATCH /chat/threads/:id/mute`
- `PATCH /chat/threads/:id/pin`
- `PATCH /chat/threads/:id/unread`
- `DELETE /chat/threads/:id/clear`

### RealtimeController (24 endpoints)
- `GET /group-chat`
- `GET /group-chat/:id`
- `POST /group-chat`
- `PATCH /group-chat/:id`
- `DELETE /group-chat/:id`
- `POST /group-chat/:id/members`
- `DELETE /group-chat/:id/members/:userId`
- `PATCH /group-chat/:id/members/:userId/role`
- `GET /calls`
- `GET /calls/:id`
- `GET /live-stream`
- `GET /live-stream/setup`
- `GET /live-stream/studio`
- `GET /live-stream/:id/comments`
- `POST /live-stream/:id/comments`
- `GET /live-stream/:id/reactions`
- `POST /live-stream/:id/reactions`
- `GET /live-stream/:id`
- `GET /socket/contract`
- `GET /calls/rtc-config`
- `GET /calls/sessions`
- `GET /calls/sessions/:id`
- `POST /calls/sessions`
- `PATCH /calls/sessions/:id/end`

## Experience API Module

### AccountSwitchingController (2 endpoints)
- `GET /account-switching`
- `PATCH /account-switching/active`

### ActivitySessionsController (4 endpoints)
- `GET /activity-sessions`
- `GET /activity-sessions/history`
- `POST /activity-sessions/logout-others`
- `DELETE /activity-sessions/:id`

### AppUpdateFlowController (2 endpoints)
- `GET /app-update-flow`
- `POST /app-update-flow/start`

### BlockController (4 endpoints)
- `GET /block`
- `GET /block/:targetId`
- `POST /block`
- `DELETE /block/:targetId`

### BookmarksController (5 endpoints)
- `GET /bookmarks`
- `GET /bookmarks/:id`
- `POST /bookmarks`
- `POST /bookmarks/posts/:postId`
- `DELETE /bookmarks/:id`

### DeepLinkHandlerController (2 endpoints)
- `GET /deep-link-handler`
- `POST /deep-link-handler/resolve`

### HiddenPostsController (3 endpoints)
- `GET /hidden-posts`
- `GET /hidden-posts/:targetId`
- `DELETE /hidden-posts/:targetId`

### HideController (10 endpoints)
- `GET /hide`
- `GET /hide/posts/all`
- `GET /hide/hidden-posts`
- `POST /hide`
- `POST /hide/posts/:postId`
- `DELETE /hide/posts/:postId`
- `GET /hide/hidden-posts/:targetId`
- `DELETE /hide/hidden-posts/:targetId`
- `GET /hide/:targetId`
- `DELETE /hide/:targetId`

### DiscoveryController (10 endpoints)
- `GET /hashtags`
- `GET /trending`
- `GET /search`
- `GET /search-discovery`
- `GET /saved-collections`
- `GET /saved-collections/:id`
- `POST /saved-collections`
- `PATCH /saved-collections`
- `PATCH /saved-collections/:id`
- `DELETE /saved-collections/:id`

### CommunitiesController (19 endpoints)
- `GET /communities`
- `GET /communities/:id`
- `GET /communities/:id/posts`
- `GET /communities/:id/members`
- `GET /communities/:id/events`
- `GET /communities/:id/pinned-posts`
- `GET /communities/:id/trending-posts`
- `GET /communities/:id/announcements`
- `GET /pages`
- `GET /pages/create`
- `GET /pages/detail`
- `GET /pages/detail/:id`
- `POST /pages/create`
- `PATCH /pages/:id/follow`
- `GET /pages/:id`
- `GET /groups`
- `GET /groups/:id`
- `GET /groups/:id/posts`
- `GET /groups/:id/members`

### EventsController (10 endpoints)
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

### JobsController (18 endpoints)
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

### EngagementController (8 endpoints)
- `GET /invite-referral`
- `GET /premium-membership`
- `GET /premium`
- `GET /wallet-payments`
- `GET /subscriptions`
- `POST /subscriptions/change-plan`
- `POST /subscriptions/cancel`
- `POST /subscriptions/renew`

### LearningCoursesController (1 endpoints)
- `GET /learning-courses`

### LocalizationSupportController (2 endpoints)
- `GET /localization-support`
- `PATCH /localization-support`

### MaintenanceModeController (2 endpoints)
- `GET /maintenance-mode`
- `POST /maintenance-mode/retry`

### OfflineSyncController (2 endpoints)
- `GET /offline-sync`
- `POST /offline-sync/retry`

### PersonalizationOnboardingController (2 endpoints)
- `GET /personalization-onboarding`
- `PATCH /personalization-onboarding/interests`

### PollsSurveysController (4 endpoints)
- `GET /polls-surveys`
- `GET /polls-surveys/active`
- `GET /polls-surveys/drafts`
- `PATCH /polls-surveys/:id/vote`

### PreferencesController (7 endpoints)
- `GET /advanced-privacy-controls`
- `GET /safety-privacy`
- `GET /accessibility-support`
- `GET /explore-recommendation`
- `GET /push-notification-preferences`
- `GET /legal-compliance`
- `GET /blocked-muted-accounts`

### ReportCenterController (2 endpoints)
- `GET /report-center`
- `POST /report-center`

### ProfilesController (16 endpoints)
- `GET /profile`
- `GET /profile/:id`
- `GET /user-profile/edit`
- `PATCH /user-profile/edit`
- `GET /user-profile`
- `GET /user-profile/followers`
- `GET /user-profile/following`
- `GET /user-profile/:id`
- `GET /follow-unfollow/:id/followers`
- `GET /follow-unfollow/:id/following`
- `PATCH /follow-unfollow/:id/follow`
- `PATCH /follow-unfollow/:id/unfollow`
- `GET /creator-dashboard`
- `GET /business-profile`
- `GET /seller-profile`
- `GET /recruiter-profile`

### ShareRepostController (2 endpoints)
- `GET /share-repost/options`
- `POST /share-repost/track`

### SupportController (7 endpoints)
- `GET /support/faqs`
- `GET /support/tickets`
- `GET /support-help`
- `GET /support-help/faq`
- `GET /support-help/chat`
- `GET /support-help/mail`
- `POST /support/tickets`

### VerificationRequestController (4 endpoints)
- `GET /verification-request`
- `PATCH /verification-request/documents`
- `POST /verification-request/submit`
- `PATCH /verification-request/status`

### MarketplaceController (10 endpoints)
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

### MonetizationController (4 endpoints)
- `GET /monetization/overview`
- `GET /monetization/wallet`
- `GET /monetization/subscriptions`
- `GET /monetization/plans`

### NotificationsController (6 endpoints)
- `GET /notifications`
- `GET /notifications/inbox`
- `GET /notifications/preferences`
- `GET /notifications/campaigns`
- `POST /notifications/campaigns`
- `PATCH /notifications/:id/read`

### InviteFriendsController (1 endpoints)
- `GET /invite-friends`

### WalletController (1 endpoints)
- `GET /wallet`

### PremiumPlansController (1 endpoints)
- `GET /premium-plans`

### SettingsController (9 endpoints)
- `GET /settings`
- `GET /settings/sections`
- `GET /settings/items`
- `GET /settings/state`
- `GET /settings/items/:itemKey`
- `GET /settings/:sectionKey`
- `PATCH /settings/items/:itemKey`
- `PATCH /settings/state`
- `PATCH /settings/:sectionKey`

## Admin API Module

### AdminOpsController (22 endpoints)
- `GET /admin/auth/demo-accounts`
- `POST /admin/auth/login`
- `GET /admin/auth/me`
- `GET /admin/auth/sessions`
- `PATCH /admin/auth/sessions/:id/revoke`
- `GET /admin/verification-queue`
- `PATCH /admin/verification-queue/:id`
- `GET /admin/moderation-cases`
- `PATCH /admin/moderation-cases/:id`
- `GET /admin/chat-control`
- `PATCH /admin/chat-control/:id`
- `GET /admin/broadcast-campaigns`
- `POST /admin/broadcast-campaigns`
- `GET /admin/audience-segments`
- `GET /admin/analytics-pipeline`
- `GET /admin/rbac`
- `GET /admin/operational-settings`
- `PATCH /admin/operational-settings`
- `GET /admin/audit-log-system`
- `GET /admin/content-operations`
- `GET /admin/commerce-risk`
- `GET /admin/support-operations`

### AdminController (12 endpoints)
- `GET /admin/dashboard`
- `GET /admin/users`
- `GET /admin/content`
- `GET /admin/reports`
- `GET /admin/chat-cases`
- `GET /admin/events`
- `GET /admin/monetization`
- `GET /admin/notifications`
- `GET /admin/analytics`
- `GET /admin/roles`
- `GET /admin/settings`
- `GET /admin/audit-logs`
