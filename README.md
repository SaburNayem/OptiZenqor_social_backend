# OptiZenqor Social Backend

NestJS backend API for the `OptiZenqor_social` mobile app and the `OptiZenqor_social_dashboard` admin panel.

## What is included

- Auth endpoints for login, signup, forgot password, and reset password
- User APIs for profile lookup plus follow and block actions
- Social content APIs for feed, posts, stories, and reels
- Chat APIs for threads and sending messages
- Events, marketplace, monetization, and notification campaign APIs
- Admin APIs for dashboard stats, users, content, reports, analytics, roles, settings, and audit logs
- Seeded in-memory data derived from the referenced frontend repos so both clients can integrate immediately

## Run

```bash
npm run start:dev
```

The server runs on `http://localhost:3000` by default.
Swagger UI is available at `http://localhost:3000/docs`.
Raw OpenAPI JSON is available at `http://localhost:3000/docs-json`.

## Email OTP Setup

To send real 6-digit verification codes by email, add SMTP settings to `.env`:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=no-reply@example.com
SMTP_SECURE=false
```

Notes:

- Replace these placeholders with your actual SMTP provider settings.
- Without SMTP settings, the backend falls back to development mode and does not send a real email.

## Main route groups

```text
System
GET    /health
GET    /app/bootstrap
GET    /app/config
POST   /app/session-init
GET    /onboarding/slides
GET    /onboarding/state
GET    /onboarding/interests
POST   /onboarding/complete

Auth
GET    /auth/demo-accounts
POST   /auth/login
POST   /auth/google
POST   /auth/signup
POST   /auth/refresh-token
POST   /auth/logout
POST   /auth/forgot-password
POST   /auth/reset-password
POST   /auth/verify-email/confirm
GET    /auth/me
POST   /auth/send-otp
POST   /auth/resend-otp
POST   /auth/verify-otp

Content
GET    /feed
GET    /users
GET    /posts
GET    /posts/:id
POST   /posts
PATCH  /posts/:id
DELETE /posts/:id
GET    /posts/:id/comments
POST   /posts/:id/comments
PATCH  /posts/:id/comments/:commentId/react
PATCH  /posts/:id/like
PATCH  /posts/:id/unlike
GET    /stories
GET    /stories/:id
POST   /stories
PATCH  /stories/:id
DELETE /stories/:id
GET    /stories/:id/comments
POST   /stories/:id/comments
GET    /stories/:id/reactions
POST   /stories/:id/reactions
GET    /reels
GET    /reels/:id
POST   /reels
PATCH  /reels/:id
DELETE /reels/:id
GET    /reels/:id/comments
POST   /reels/:id/comments
GET    /reels/:id/reactions
POST   /reels/:id/reactions

Creator flow
GET    /drafts
GET    /drafts/:id
POST   /drafts
PATCH  /drafts/:id
DELETE /drafts/:id
GET    /scheduling
GET    /upload-manager
GET    /upload-manager/:id
PATCH  /upload-manager/:id

Experience
GET    /events
GET    /events/:id
PATCH  /events/:id/rsvp
PATCH  /events/:id/save
GET    /marketplace
GET    /marketplace/products
GET    /marketplace/products/:id
GET    /communities
GET    /jobs
GET    /bookmarks
GET    /saved-collections
GET    /settings
GET    /settings/state
GET    /support/faqs
GET    /support/tickets
GET    /report-center
GET    /account-switching
GET    /activity-sessions
GET    /verification-request
GET    /deep-link-handler
GET    /app-update-flow
GET    /offline-sync
GET    /localization-support
GET    /maintenance-mode
GET    /polls-surveys
GET    /learning-courses
GET    /personalization-onboarding
GET    /share-repost/options
GET    /advanced-privacy-controls
GET    /accessibility-support
GET    /blocked-muted-accounts
GET    /business-profile
GET    /creator-dashboard
GET    /explore-recommendation
GET    /legal-compliance
GET    /media-viewer
GET    /messages
GET    /profile/:id
GET    /push-notification-preferences
GET    /seller-profile
GET    /support-help
GET    /user-profile/:id

Realtime and utilities
GET    /chat/threads
GET    /group-chat
GET    /group-chat/:id
GET    /calls
GET    /calls/:id
GET    /live-stream
GET    /live-stream/:id
GET    /socket/contract

Admin
GET    /admin/dashboard
POST   /admin/auth/login
GET    /admin/users
GET    /admin/reports
GET    /admin/analytics
GET    /admin/settings
```

For the full route contract with request examples, use Swagger and the curl reference:

- Swagger UI: `/docs`
- OpenAPI JSON: `/docs-json`
- OpenAPI YAML: `/docs-yaml`
- Examples: `BACKEND_CURL_REFERENCE.md`

## Notes

- This first backend pass uses in-memory seeded data, so it is frontend-ready for integration and demos but not yet persistent.
- The next production step would be adding a database layer, JWT auth, file uploads, and socket gateways for chat/live updates.
