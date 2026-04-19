# Socity Backend

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

## Main routes

```text
GET    /health
POST   /auth/login
POST   /auth/signup
POST   /auth/forgot-password
POST   /auth/reset-password

GET    /users
GET    /users/:id
PATCH  /users/:id/follow
PATCH  /users/:id/block

GET    /feed
GET    /posts
GET    /posts/:id
POST   /posts
PATCH  /posts/:id/like
GET    /stories
POST   /stories
GET    /reels
POST   /reels

GET    /chat/threads
GET    /chat/threads/:id
POST   /chat/threads/:id/messages

GET    /events
POST   /events

GET    /marketplace/products
POST   /marketplace/products

GET    /monetization/overview
GET    /monetization/wallet
GET    /monetization/subscriptions
GET    /monetization/plans

GET    /notifications/campaigns
POST   /notifications/campaigns

GET    /admin/dashboard
GET    /admin/users
GET    /admin/content
GET    /admin/reports
GET    /admin/chat-cases
GET    /admin/events
GET    /admin/monetization
GET    /admin/notifications
GET    /admin/analytics
GET    /admin/roles
GET    /admin/settings
GET    /admin/audit-logs
```

## Notes

- This first backend pass uses in-memory seeded data, so it is frontend-ready for integration and demos but not yet persistent.
- The next production step would be adding a database layer, JWT auth, file uploads, and socket gateways for chat/live updates.
