# FULL_PLATFORM_CURRENT_MISMATCH_REPORT

Audit date: 2026-05-02
Workspace audited from latest local working trees:
- `G:\My Project\Socity_backend`
- `G:\My Project\OptiZenqor_social`
- `G:\My Project\OptiZenqor_social_dashboard`

## Scope

This report is derived from current source files in the three repos, not from earlier generated reports. It reflects the current code state before the next implementation pass.

## 1. Flutter API calls and paths found

Primary source:
- `lib/core/data/api/api_end_points.dart`

Runtime API path inventory currently referenced in Flutter source:

```text
/
/accessibility-support
/account-switching
/account-switching/active
/activity-sessions
/activity-sessions/$sessionId
/activity-sessions/history
/activity-sessions/logout-others
/admin/analytics
/admin/analytics-pipeline
/admin/audience-segments
/admin/audit-logs
/admin/audit-log-system
/admin/auth/login
/admin/auth/logout
/admin/auth/me
/admin/auth/refresh
/admin/auth/sessions
/admin/auth/sessions/$sessionId/revoke
/admin/broadcast-campaigns
/admin/chat-cases
/admin/chat-control
/admin/chat-control/$controlId
/admin/commerce-risk
/admin/content
/admin/content/$type/$id/moderate
/admin/content-operations
/admin/dashboard
/admin/dashboard/content
/admin/dashboard/moderation
/admin/dashboard/overview
/admin/dashboard/reports
/admin/dashboard/revenue
/admin/dashboard/users
/admin/events
/admin/moderation-cases
/admin/moderation-cases/$caseId
/admin/monetization
/admin/notifications
/admin/operational-settings
/admin/rbac
/admin/reports
/admin/reports/$reportId
/admin/roles
/admin/settings
/admin/support-operations
/admin/users
/admin/users/$userId
/admin/verification-queue
/admin/verification-queue/$queueId
/advanced-privacy-controls
/app/bootstrap
/app/config
/app/session-init
/app-update-flow
/app-update-flow/start
/archive/posts
/archive/reels
/archive/stories
/auth/forgot-password
/auth/google
/auth/login
/auth/logout
/auth/me
/auth/refresh-token
/auth/resend-otp
/auth/reset-password
/auth/send-otp
/auth/signup
/auth/verify-email/confirm
/auth/verify-otp
/block
/block/$targetId
/blocked-muted-accounts
/blocked-muted-accounts/$targetId/mute
/blocked-muted-accounts/$targetId/unmute
/bookmarks
/bookmarks/$bookmarkId
/bookmarks/posts/$postId
/business-profile
/calls
/calls/$callId
/calls/rtc-config
/calls/sessions
/calls/sessions/$sessionId
/calls/sessions/$sessionId/end
/chat
/chat/detail
/chat/detail/$chatId
/chat/preferences
/chat/presence
/chat/settings
/chat/threads
/chat/threads/$threadId
/chat/threads/$threadId/archive
/chat/threads/$threadId/clear
/chat/threads/$threadId/messages
/chat/threads/$threadId/mute
/chat/threads/$threadId/pin
/chat/threads/$threadId/read
/chat/threads/$threadId/unread
/communities
/communities/$communityId
/communities/$communityId/announcements
/communities/$communityId/events
/communities/$communityId/join
/communities/$communityId/leave
/communities/$communityId/members
/communities/$communityId/pinned-posts
/communities/$communityId/posts
/communities/$communityId/trending-posts
/creator-dashboard
/deep-link-handler
/deep-link-handler/resolve
/docs
/docs-json
/docs-yaml
/drafts
/drafts/$draftId
/drafts-scheduling
/events
/events/$eventId
/events/$eventId/rsvp
/events/$eventId/save
/events/create
/events/detail
/events/pool/create
/explore-recommendation
/feed
/feed/home
/follow-unfollow/$profileId/follow
/follow-unfollow/$profileId/followers
/follow-unfollow/$profileId/following
/follow-unfollow/$profileId/mutuals
/follow-unfollow/$profileId/unfollow
/global-search
/group-chat
/group-chat/$chatId
/group-chat/$chatId/members
/group-chat/$chatId/members/$userId
/group-chat/$chatId/members/$userId/role
/groups
/groups/$groupId
/groups/$groupId/members
/groups/$groupId/posts
/hashtags
/health
/health/database
/hidden-posts
/hidden-posts/$targetId
/hide
/hide/$targetId
/hide/hidden-posts
/hide/hidden-posts/$targetId
/hide/posts/$postId
/hide/posts/all
/invite-friends
/invite-referral
/jobs
/jobs/$jobId
/jobs/$jobId/apply
/jobs/$jobId/save
/jobs/alerts
/jobs/alerts/$alertId
/jobs/applicants
/jobs/applications
/jobs/applications/$applicationId/status
/jobs/applications/$applicationId/withdraw
/jobs/apply
/jobs/companies
/jobs/companies/$companyId/follow
/jobs/create
/jobs/detail
/jobs/detail/$jobId
/jobs/employer-profile
/jobs/employer-stats
/jobs/profile
/jobs-networking
/learning-courses
/legal/account-deletion
/legal/consents
/legal/data-export
/legal-compliance
/live-stream
/live-stream/$streamId
/live-stream/$streamId/comments
/live-stream/$streamId/moderation
/live-stream/$streamId/reactions
/live-stream/setup
/live-stream/studio
/localization-support
/maintenance-mode
/maintenance-mode/retry
/marketplace
/marketplace/checkout
/marketplace/compare
/marketplace/create
/marketplace/detail
/marketplace/detail/$productId
/marketplace/drafts
/marketplace/drafts/$draftId
/marketplace/offers/$offerId
/marketplace/products
/marketplace/products/$productId
/marketplace/products/$productId/chat
/marketplace/products/$productId/chat/messages
/marketplace/products/$productId/offers
/marketplace/products/$productId/status
/marketplace/seller-follows
/marketplace/sellers/$sellerId/follow
/master-data
/media-viewer
/media-viewer/$mediaId
/messages
/messages/$messageId
/monetization/overview
/monetization/plans
/monetization/subscriptions
/monetization/wallet
/notification-preferences
/notifications
/notifications/$notificationId/read
/notifications/campaigns
/notifications/devices
/notifications/devices/$token
/notifications/inbox
/notifications/preferences
/offline-sync
/offline-sync/retry
/onboarding/complete
/onboarding/interests
/onboarding/slides
/onboarding/state
/pages
/pages/$pageId
/pages/create
/pages/detail
/pages/detail/$pageId
/personalization-onboarding
/personalization-onboarding/interests
/polls-surveys
/polls-surveys/$pollId/vote
/polls-surveys/active
/polls-surveys/drafts
/posts
/posts/$postId
/posts/$postId/comments
/posts/$postId/comments/$commentId
/posts/$postId/comments/$commentId/react
/posts/$postId/comments/$commentId/replies
/posts/$postId/like
/posts/$postId/reactions
/posts/$postId/unlike
/posts/create
/posts/drafts
/posts/scheduled
/premium
/premium-membership
/premium-plans
/professional-profiles
/profile
/profile/$profileId
/profile/$profileId/mention-history
/profile/$profileId/tagged-posts
/push-notification-preferences
/recommendations
/recruiter-profile
/reels
/reels/$reelId
/reels/$reelId/comments
/reels/$reelId/reactions
/report-center
/safety/config
/safety-privacy
/saved-collections
/saved-collections/$collectionId
/scheduling
/search
/search-discovery
/security/logout-all
/security/state
/seller-profile
/settings
/settings/$sectionKey
/settings/items
/settings/items/$itemKey
/settings/sections
/settings/state
/share-repost/options
/share-repost/track
/socket/contract
/stories
/stories/$storyId
/stories/$storyId/comments
/stories/$storyId/reactions
/stories/$storyId/view
/stories/$storyId/viewers
/stories/archive
/subscriptions
/subscriptions/cancel
/subscriptions/change-plan
/subscriptions/renew
/support/chat
/support/faqs
/support/tickets
/support-help
/support-help/chat
/support-help/faq
/support-help/mail
/trending
/upload-manager
/upload-manager/$uploadId
/uploads
/uploads/$uploadId
/user-profile
/user-profile/$profileId
/user-profile/edit
/user-profile/followers
/user-profile/following
/users
/users/$userId
/users/$userId/follow
/users/$userId/followers
/users/$userId/following
/users/$userId/follow-state
/users/$userId/unfollow
/users/change-password
/verification-request
/verification-request/documents
/verification-request/status
/verification-request/submit
/wallet
/wallet/ledger
/wallet-payments
```

High-risk Flutter runtime mock/static findings:
- `lib/feature/polls_surveys/screen/polls_surveys_screen.dart` still exposes static-only creation, templates, analytics, drafts, and edit flows through snackbars.
- `lib/feature/chat/screen/chat_screen.dart` still has a static message search flow.
- `lib/feature/share_repost_system/widget/share_post_action_sheet.dart` still exposes a static external share flow.
- `lib/core/webrtc/webrtc_service.dart` still returns `"Static WebRTC preview ready"`.
- `lib/feature/follow_unfollow/screen/follow_list_screen.dart` still includes `_SampleConnectionsBanner`.
- `lib/feature/home_feed/helper/home_feed_post_factory.dart` still builds local posts at runtime.
- `lib/feature/home_feed/controller/main_shell_controller.dart` and `lib/feature/settings/controller/settings_controller.dart` still contain guest/fallback user objects.
- `lib/feature/deep_link_handler/screen/deep_link_handler_screen.dart` still contains a hardcoded initial link.

## 2. Dashboard API calls and paths found

Primary sources:
- `src/config/navigation.js`
- `src/hooks/useAdminDashboard.js`
- `src/context/AdminSessionContext.jsx`

Current dashboard endpoint inventory:

```text
/admin/audit-logs
/admin/auth/logout
/admin/auth/me
/admin/auth/sessions
/admin/communities
/admin/content
/admin/dashboard/overview
/admin/dashboard/revenue
/admin/events
/admin/jobs
/admin/live-streams
/admin/marketplace
/admin/notification-campaigns
/admin/notification-devices
/admin/pages
/admin/premium-plans
/admin/reports
/admin/settings
/admin/subscriptions
/admin/support-operations
/admin/users
/admin/wallet
/admin/wallet-subscriptions
```

Additional dashboard mutation calls found:
- `POST /admin/auth/login`
- `POST /admin/auth/refresh`
- `PATCH /admin/users/:id`
- `PATCH /admin/content/:type/:id/moderate`
- `PATCH /admin/reports/:id`
- `PATCH /admin/settings`
- `PATCH /admin/auth/sessions/:id/revoke`
- `POST /admin/premium-plans`
- `PATCH /admin/premium-plans/:id`
- `DELETE /admin/premium-plans/:id`
- `POST /admin/notification-campaigns`
- `PATCH /admin/notification-campaigns/:id`
- `POST /admin/notification-campaigns/:id/actions`
- `PATCH /admin/support-operations/:ticketId`
- `PATCH /admin/notification-devices/:deviceId`

Dashboard current-state note:
- The dashboard is API-backed for the sections it renders today.
- It does not yet expose every requested admin area in navigation or view logic.
- It is still structurally closer to an integration shell than a finished production admin console.

## 3. Backend NestJS routes found

Current backend route controllers discovered include:
- `auth`
- `admin`
- `app`
- `activity-sessions`
- `account-switching`
- `app-update-flow`
- `archive`
- `block`
- `bookmarks`
- `buddies`
- `chat`
- `communities`
- `content/feed`
- `deep-link-handler`
- `discovery/search/trending/hashtags/saved-collections`
- `events`
- `group-chat`
- `calls`
- `live-stream`
- `jobs`
- `learning-courses`
- `likes/reactions`
- `localization-support`
- `maintenance-mode`
- `marketplace`
- `media-viewer`
- `messages`
- `monetization`
- `notifications`
- `offline-sync`
- `onboarding`
- `pages`
- `personalization-onboarding`
- `polls-surveys`
- `posts`
- `preferences`
- `premium-plans`
- `profiles`
- `reels`
- `report-center`
- `settings`
- `share-repost`
- `stories`
- `support`
- `uploads`
- `users`
- `verification-request`
- `wallet`

Admin route coverage already present in backend:
- `GET /admin/dashboard`
- `GET /admin/dashboard/overview`
- `GET /admin/dashboard/users`
- `GET /admin/dashboard/content`
- `GET /admin/dashboard/reports`
- `GET /admin/dashboard/revenue`
- `GET /admin/dashboard/moderation`
- `GET /admin/users`
- `PATCH /admin/users/:id`
- `PATCH /admin/users/:id/status`
- `GET /admin/content`
- `PATCH /admin/content/:type/:id/moderate`
- `PATCH /admin/content/:id/moderation`
- `GET /admin/reports`
- `PATCH /admin/reports/:id`
- `GET /admin/settings`
- `PATCH /admin/settings`
- `GET /admin/audit-logs`
- `GET|POST|PATCH|DELETE /admin/marketplace`
- `GET|POST|PATCH|DELETE /admin/jobs`
- `GET|POST|PATCH|DELETE /admin/events`
- `GET|PATCH /admin/communities`
- `GET|PATCH /admin/pages`
- `GET|PATCH /admin/live-streams`
- `GET /admin/monetization`
- `GET /admin/wallet`
- `GET /admin/subscriptions`
- `GET|PATCH /admin/wallet-subscriptions`
- `GET|PATCH /admin/notification-devices`
- `GET|PATCH /admin/notifications/devices`
- `GET|POST|PATCH /admin/notification-campaigns`
- `POST /admin/notification-campaigns/:id/actions`
- `GET|POST|PATCH|DELETE /admin/premium-plans`
- `GET /admin/auth/sessions`
- `PATCH /admin/auth/sessions/:id/revoke`
- `POST /admin/auth/login`
- `POST /admin/auth/refresh`
- `GET /admin/auth/me`
- `POST /admin/auth/logout`
- `GET /admin/support-operations`
- `GET /admin/support-operations/:id`
- `PATCH /admin/support-operations/:id`

## 4. Missing backend routes required by Flutter

Exact missing or mismatched backend admin routes present in Flutter endpoint definitions:
- `/admin/analytics` is referenced in Flutter endpoint definitions but backend currently exposes `/admin/analytics-pipeline`, not `/admin/analytics`.
- `/admin/roles` is referenced in Flutter endpoint definitions but backend currently exposes `/admin/rbac`, not `/admin/roles`.
- `/admin/chat-cases` is referenced in Flutter endpoint definitions but backend currently exposes `/admin/chat-control`, not `/admin/chat-cases`.
- `/admin/notifications` is referenced in Flutter endpoint definitions but backend currently exposes `/admin/notification-campaigns` and `/admin/notification-devices`, not a generic `/admin/notifications`.

Other Flutter route risks:
- Several Flutter features appear API-aware but still retain local/demo behavior in screens and controllers, especially polls, share/repost, WebRTC preview, and some create flows.

## 5. Missing backend routes required by dashboard

Exact dashboard contract gaps:
- `DELETE /admin/notification-campaigns/:id` is not implemented as a REST endpoint today. The backend currently supports delete only through `POST /admin/notification-campaigns/:id/actions` with action `delete`.

Requested-but-not-yet-surfaced dashboard sections:
- The dashboard repo does not currently load dedicated views for moderation analytics, monetization summary, audit exports, operational settings categories, notification device detail, or community/page/live-stream detail screens.
- The dashboard does not currently consume `GET /admin/dashboard`, `GET /admin/dashboard/users`, `GET /admin/dashboard/content`, `GET /admin/dashboard/reports`, or `GET /admin/dashboard/moderation` as separate routed sections, even though the backend exposes them.

## 6. Backend routes still using mock/static/data service logic instead of Prisma

Confirmed or likely non-fully-persistent runtime paths:
- `SettingsDatabaseService` still depends on `src/data/settings-data.service.ts`, which contains static section/item metadata and default values.
- `CommunitiesController` still imports `CommunityRecord` from `src/data/ecosystem-data.service.ts`, although the controller itself now delegates to `ExperienceDatabaseService`.
- `getCreatePageOptions` in `CommunitiesController` still returns hardcoded owner suggestions and locations.
- `SettingsDataService` contains substantial static defaults that continue to shape runtime settings responses.
- Any route falling back to `SettingsDataService` or operational-setting defaults instead of persisted user/app records is not yet fully database-first.

Risk areas needing re-check during implementation:
- Settings and preferences response composition
- Onboarding/personalization fallback catalogs
- Accessibility/localization catalogs
- Some support/help/configuration flows
- Create-option endpoints that still emit hardcoded choices

## 7. Frontend and dashboard screens still using mock/static/local sample data

Flutter confirmed:
- `lib/feature/polls_surveys/screen/polls_surveys_screen.dart`
- `lib/feature/chat/screen/chat_screen.dart`
- `lib/feature/share_repost_system/widget/share_post_action_sheet.dart`
- `lib/core/webrtc/webrtc_service.dart`
- `lib/feature/follow_unfollow/screen/follow_list_screen.dart`
- `lib/feature/home_feed/helper/home_feed_post_factory.dart`
- `lib/feature/deep_link_handler/screen/deep_link_handler_screen.dart`
- local fallback guest users in settings and main shell controllers

Dashboard confirmed:
- No live runtime mock collections were found in `src/` during keyword scan.
- The dashboard is thin rather than fake: its biggest issue is incomplete section coverage and limited UX depth, not obvious mock JSON datasets.

## 8. Database models missing for app features

Prisma models already present for many requested persisted features:
- `PushDeviceToken`
- `NotificationCampaign`
- `SupportTicket`
- `AnalyticsSnapshot`
- `LocalizationLocaleCatalog`
- `AccessibilityOptionCatalog`
- `ModerationCase`
- `AdminAuditLog`
- `AdminSession`
- `Subscription`
- `WalletTransaction`
- `LiveStreamSession`
- `CallSession`

Still missing or under-modeled concerns:
- Notification campaign action history is not modeled as a first-class table. Actions appear to be applied procedurally rather than persisted as separate records.
- Support operation assignment/SLA workflow appears to rely on ticket metadata rather than a dedicated support-operations domain model.
- Advanced moderation workflow state is partly represented by `ModerationCase`, but escalation, assignee history, and action log depth may still be metadata-based.
- Accessibility/localization/preferences catalogs exist, but some runtime fallbacks still depend on static data services rather than catalog tables alone.
- Admin dashboard snapshot requirements may outgrow the current `AnalyticsSnapshot` generality.

## 9. DTO and response shape mismatches

Observed response contract drift:
- Not all runtime responses follow the required shape `{ success, message, data, pagination? }`.
- Several controllers return extra top-level aliases such as `items`, `results`, `communities`, `pages`, or `community` alongside `data`.
- Some success responses omit `message` on compatibility endpoints.
- Some dashboard and Flutter repositories read both `payload.data` and direct top-level aliases, which indicates contract instability.

Examples of mismatched patterns:
- `CommunitiesController` returns `items`, `results`, and `communities` in addition to `data`.
- join/leave/create/update community flows return mixed ad hoc payload shapes.
- settings and support-related payloads depend on nested convenience keys.

## 10. Auth, session, and header mismatches

Admin side:
- Dashboard uses bearer access token plus refresh token in request body, which matches backend admin auth flows.
- Admin logout is access-token based and does not currently require refresh token or body.

Flutter side:
- Flutter uses app auth endpoints under `/auth/*` and a separate refresh contract `/auth/refresh-token`.
- Flutter endpoint definitions still include admin endpoints that do not appear to belong to the mobile runtime surface.
- There are likely multiple auth/session abstractions in Flutter (`auth_service`, session service, local storage service, API client service) that still need normalization review during implementation.

Cross-surface risk:
- User auth and admin auth are separate but both use bearer patterns; token storage and refresh behavior should be audited carefully to avoid accidental mixing.

## 11. Upload and media mismatches

Observed status:
- Backend has upload services and an uploads controller.
- Flutter has `media_url_resolver.dart` that prefixes relative media paths against the API base URL.

Likely mismatches still to normalize:
- Some backend models and mappers may emit relative paths while others may emit absolute URLs.
- Marketplace/products/stories/reels/posts/profile images need one consistent URL contract.
- Cloudinary and local upload paths need a single normalized response shape for both Flutter and dashboard.

## 12. Admin dashboard CRUD and action mismatches

Confirmed good:
- Dashboard mutation hooks already target real admin endpoints for users, content moderation, reports, settings, admin session revoke, premium plans, campaigns, support tickets, and notification devices.

Current mismatches:
- No `DELETE /admin/notification-campaigns/:id` endpoint.
- Dashboard still lacks CRUD surfaces for marketplace, jobs, events, communities, pages, live streams, wallet subscriptions, and several detail views even though list endpoints exist.
- Dashboard currently treats many sections as list/table views without full create/edit/delete drawers/modals required for a production admin console.

## 13. Completion percentage estimate

These are current-state estimates from source audit, not success claims:

- Backend: 78%
- Flutter app integration: 58%
- Dashboard integration: 72%
- Database coverage: 76%
- Full platform readiness: 68%

Reasoning:
- Backend is farthest along structurally and already has broad Prisma coverage plus most admin routes.
- Flutter still contains noticeable runtime-static UX flows and fallback/local behavior in important areas.
- Dashboard is API-backed for present views, but coverage and CRUD depth are incomplete.
- Database coverage is strong but not yet universal because some settings/catalog/workflow behavior still uses static service defaults or metadata-heavy storage.

## 14. Priority implementation queue from this audit

1. Add missing REST alias `DELETE /admin/notification-campaigns/:id`.
2. Normalize admin and user API response shapes to `{ success, message, data, pagination? }`.
3. Remove remaining backend runtime static/default flows, especially settings/create-option endpoints.
4. Replace Flutter static production flows in polls, share, WebRTC preview, message search, and local post generation.
5. Expand dashboard feature coverage and CRUD surfaces to match the available admin API contract.
6. Normalize upload/media URL output across backend, Flutter, and dashboard.
7. Add any missing persistence tables for campaign action history and deeper support/moderation workflows if metadata storage is insufficient.

