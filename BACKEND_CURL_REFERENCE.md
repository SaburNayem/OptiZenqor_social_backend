# OptiZenqor Social Backend Curl Reference

## Base URL

```bash
http://localhost:3000
```

If you run on another port, replace the base URL.

Example:

```bash
http://localhost:3001
```

## Health and Docs

```bash
curl http://localhost:3000/
curl http://localhost:3000/health
curl http://localhost:3000/docs-json
```

## App Bootstrap

```bash
curl http://localhost:3000/app/bootstrap
curl http://localhost:3000/app/config
curl -X POST http://localhost:3000/app/session-init ^
  -H "Content-Type: application/json" ^
  -d "{\"token\":\"mock-user-token\"}"
```

## Onboarding

```bash
curl http://localhost:3000/onboarding/slides
curl http://localhost:3000/onboarding/state
curl http://localhost:3000/onboarding/interests
curl -X POST http://localhost:3000/onboarding/complete ^
  -H "Content-Type: application/json" ^
  -d "{\"selectedInterests\":[\"Creator Economy\",\"Marketplace\"]}"
```

## Auth

```bash
curl -X POST http://localhost:3000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"maya@optizenqor.app\",\"password\":\"123456\"}"

curl -X POST http://localhost:3000/auth/signup ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"New User\",\"username\":\"newuser\",\"email\":\"new@optizenqor.app\",\"role\":\"User\"}"

curl -X POST http://localhost:3000/auth/forgot-password ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"maya@optizenqor.app\"}"

curl -X POST http://localhost:3000/auth/reset-password ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"maya@optizenqor.app\",\"otp\":\"123456\",\"password\":\"newpass123\"}"

curl -X POST http://localhost:3000/auth/send-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"destination\":\"maya@optizenqor.app\",\"channel\":\"email\"}"

curl -X POST http://localhost:3000/auth/resend-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"destination\":\"maya@optizenqor.app\"}"

curl -X POST http://localhost:3000/auth/verify-otp ^
  -H "Content-Type: application/json" ^
  -d "{\"code\":\"123456\"}"
```

## Users

```bash
curl http://localhost:3000/users
curl http://localhost:3000/users?role=Creator
curl http://localhost:3000/users/u1

curl -X PATCH http://localhost:3000/users/u4/follow ^
  -H "Content-Type: application/json" ^
  -d "{\"followerId\":\"u1\"}"

curl -X PATCH http://localhost:3000/users/u5/block ^
  -H "Content-Type: application/json" ^
  -d "{\"actorId\":\"u1\",\"reason\":\"spam\"}"
```

## Feed, Posts, Stories, Reels

```bash
curl http://localhost:3000/feed
curl http://localhost:3000/posts
curl http://localhost:3000/posts/p1

curl -X POST http://localhost:3000/posts ^
  -H "Content-Type: application/json" ^
  -d "{\"authorId\":\"u1\",\"caption\":\"New post from curl\",\"media\":[\"https://placehold.co/800x600\"],\"tags\":[\"curl\",\"api\"]}"

curl -X PATCH http://localhost:3000/posts/p1/like

curl http://localhost:3000/stories

curl -X POST http://localhost:3000/stories ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"u1\",\"text\":\"Story from curl\",\"media\":\"https://placehold.co/600x900\"}"

curl http://localhost:3000/reels

curl -X POST http://localhost:3000/reels ^
  -H "Content-Type: application/json" ^
  -d "{\"authorId\":\"u1\",\"caption\":\"Reel from curl\",\"audioName\":\"Creator Motion Pack\",\"thumbnail\":\"https://placehold.co/600x900\",\"videoUrl\":\"https://example.com/reel.mp4\"}"
```

## Post Detail

```bash
curl http://localhost:3000/posts/p1/detail
curl http://localhost:3000/posts/p1/comments

curl -X POST http://localhost:3000/posts/p1/comments ^
  -H "Content-Type: application/json" ^
  -d "{\"author\":\"API Tester\",\"message\":\"Comment from curl\"}"

curl -X PATCH http://localhost:3000/posts/p1/detail ^
  -H "Content-Type: application/json" ^
  -d "{\"audience\":\"Followers\",\"caption\":\"Updated caption from curl\"}"

curl -X DELETE http://localhost:3000/posts/p1/detail
```

## Drafts, Scheduling, Upload Manager

```bash
curl http://localhost:3000/drafts
curl http://localhost:3000/scheduling
curl http://localhost:3000/upload-manager

curl -X POST http://localhost:3000/drafts ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Draft from curl\",\"type\":\"post\"}"

curl -X PATCH http://localhost:3000/drafts/draft1 ^
  -H "Content-Type: application/json" ^
  -d "{\"audience\":\"Followers\",\"location\":\"Dhaka\"}"

curl -X DELETE http://localhost:3000/drafts/draft1

curl -X PATCH http://localhost:3000/upload-manager/up1 ^
  -H "Content-Type: application/json" ^
  -d "{\"action\":\"pause\"}"
```

## Chat and Presence

```bash
curl http://localhost:3000/chat/threads
curl http://localhost:3000/chat/threads/t1
curl http://localhost:3000/chat/presence
curl http://localhost:3000/chat/preferences

curl -X POST http://localhost:3000/chat/threads/t1/messages ^
  -H "Content-Type: application/json" ^
  -d "{\"senderId\":\"u1\",\"text\":\"Hello from curl\"}"

curl -X PATCH http://localhost:3000/chat/threads/t1/archive
curl -X PATCH http://localhost:3000/chat/threads/t1/mute
curl -X PATCH http://localhost:3000/chat/threads/t1/pin
curl -X PATCH http://localhost:3000/chat/threads/t1/unread
curl -X DELETE http://localhost:3000/chat/threads/t1/clear
```

## Events

```bash
curl http://localhost:3000/events

curl -X POST http://localhost:3000/events ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Curl Event\",\"organizer\":\"API Tester\",\"date\":\"2026-05-01\",\"time\":\"18:00\",\"location\":\"Dhaka\",\"participants\":50,\"price\":0}"
```

## Marketplace

```bash
curl http://localhost:3000/marketplace/products

curl -X POST http://localhost:3000/marketplace/products ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Curl Product\",\"description\":\"Created with curl\",\"price\":99.99,\"category\":\"Electronics\",\"subcategory\":\"Accessories\",\"sellerId\":\"u4\",\"sellerName\":\"Luna Crafts\",\"location\":\"Dhaka\",\"images\":[\"https://placehold.co/600x400\"],\"condition\":\"New\"}"
```

## Discovery and Saved Content

```bash
curl http://localhost:3000/hashtags
curl http://localhost:3000/trending
curl "http://localhost:3000/search?q=creator"
curl http://localhost:3000/recommendations
curl http://localhost:3000/bookmarks
curl http://localhost:3000/saved-collections

curl -X POST http://localhost:3000/saved-collections ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Curl Collection\"}"

curl -X PATCH http://localhost:3000/saved-collections ^
  -H "Content-Type: application/json" ^
  -d "{\"collectionId\":\"col1\",\"itemId\":\"p1\"}"

curl -X PATCH http://localhost:3000/saved-collections/col1 ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Updated Curl Collection\",\"privacy\":\"private\",\"itemId\":\"r1\"}"

curl -X DELETE http://localhost:3000/saved-collections/col1
```

## Communities, Pages, Groups

```bash
curl http://localhost:3000/communities
curl http://localhost:3000/communities/com1
curl http://localhost:3000/pages
curl http://localhost:3000/pages/page1
curl http://localhost:3000/groups
```

## Jobs and Professional Profiles

```bash
curl http://localhost:3000/jobs
curl http://localhost:3000/jobs/job1
curl http://localhost:3000/professional-profiles

curl -X POST http://localhost:3000/jobs/job1/apply ^
  -H "Content-Type: application/json" ^
  -d "{\"applicantName\":\"API Tester\"}"
```

## Engagement, Wallet, Premium, Referral

```bash
curl http://localhost:3000/invite-referral
curl http://localhost:3000/premium-membership
curl http://localhost:3000/wallet-payments
curl http://localhost:3000/wallet/ledger
curl http://localhost:3000/subscriptions

curl http://localhost:3000/monetization/overview
curl http://localhost:3000/monetization/wallet
curl http://localhost:3000/monetization/subscriptions
curl http://localhost:3000/monetization/plans
```

## Notifications and Preferences

```bash
curl http://localhost:3000/notifications/campaigns
curl http://localhost:3000/notifications/inbox
curl http://localhost:3000/notification-preferences

curl -X POST http://localhost:3000/notifications/campaigns ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Curl Campaign\",\"audience\":\"Creators\",\"schedule\":\"2026-04-21T09:00:00.000Z\"}"

curl -X PATCH http://localhost:3000/notification-preferences ^
  -H "Content-Type: application/json" ^
  -d "{\"pushEnabled\":true,\"emailEnabled\":false}"
```

## Settings, Safety, Support

```bash
curl http://localhost:3000/settings/sections
curl http://localhost:3000/safety/config
curl http://localhost:3000/support/faqs
curl http://localhost:3000/support/tickets
curl http://localhost:3000/support/chat

curl -X POST http://localhost:3000/support/tickets ^
  -H "Content-Type: application/json" ^
  -d "{\"subject\":\"Need help from curl\",\"category\":\"account\"}"
```

## Realtime, Group Chat, Calls, Live Stream

```bash
curl http://localhost:3000/group-chat
curl http://localhost:3000/calls
curl http://localhost:3000/live-stream
curl http://localhost:3000/socket/contract
```

## Master Data

```bash
curl http://localhost:3000/master-data
```

## Legal and Security

```bash
curl http://localhost:3000/legal/consents
curl http://localhost:3000/security/state

curl -X PATCH http://localhost:3000/legal/consents ^
  -H "Content-Type: application/json" ^
  -d "{\"termsAccepted\":true,\"privacyAccepted\":true,\"guidelinesAccepted\":true}"

curl -X POST http://localhost:3000/legal/account-deletion ^
  -H "Content-Type: application/json" ^
  -d "{\"reason\":\"test request\"}"

curl -X POST http://localhost:3000/legal/data-export ^
  -H "Content-Type: application/json" ^
  -d "{\"format\":\"json\"}"

curl -X POST http://localhost:3000/security/logout-all
```

## Admin Core

```bash
curl http://localhost:3000/admin/dashboard
curl http://localhost:3000/admin/users
curl http://localhost:3000/admin/content
curl http://localhost:3000/admin/reports
curl http://localhost:3000/admin/chat-cases
curl http://localhost:3000/admin/events
curl http://localhost:3000/admin/monetization
curl http://localhost:3000/admin/notifications
curl http://localhost:3000/admin/analytics
curl http://localhost:3000/admin/roles
curl http://localhost:3000/admin/settings
curl http://localhost:3000/admin/audit-logs
```

## Admin Auth and Sessions

```bash
curl -X POST http://localhost:3000/admin/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@optizenqor.app\",\"password\":\"admin123\"}"

curl http://localhost:3000/admin/auth/sessions

curl -X PATCH http://localhost:3000/admin/auth/sessions/adm-s1/revoke
```

## Admin Verification, Moderation, Chat Control

```bash
curl http://localhost:3000/admin/verification-queue
curl http://localhost:3000/admin/moderation-cases
curl http://localhost:3000/admin/chat-control
curl http://localhost:3000/admin/content-operations

curl -X PATCH http://localhost:3000/admin/verification-queue/ver-1 ^
  -H "Content-Type: application/json" ^
  -d "{\"decision\":\"approved\",\"note\":\"Documents accepted\"}"

curl -X PATCH http://localhost:3000/admin/moderation-cases/R-1021 ^
  -H "Content-Type: application/json" ^
  -d "{\"action\":\"escalate\"}"

curl -X PATCH http://localhost:3000/admin/chat-control/CHAT-11 ^
  -H "Content-Type: application/json" ^
  -d "{\"freeze\":true,\"restrictParticipant\":\"Rafi Ahmed\"}"
```

## Admin Campaigns, Analytics, RBAC

```bash
curl http://localhost:3000/admin/broadcast-campaigns
curl http://localhost:3000/admin/audience-segments
curl http://localhost:3000/admin/analytics-pipeline
curl http://localhost:3000/admin/rbac

curl -X POST http://localhost:3000/admin/broadcast-campaigns ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Admin Curl Campaign\",\"audience\":\"Creators\",\"segmentId\":\"seg-1\",\"schedule\":\"2026-04-22T09:00:00.000Z\"}"
```

## Admin Operations and Risk

```bash
curl http://localhost:3000/admin/operational-settings
curl http://localhost:3000/admin/audit-log-system
curl http://localhost:3000/admin/commerce-risk
curl http://localhost:3000/admin/support-operations

curl -X PATCH http://localhost:3000/admin/operational-settings ^
  -H "Content-Type: application/json" ^
  -d "{\"maintenanceMode\":true,\"maintenanceBanner\":\"Enabled\"}"
```

## Notes

- These examples use Windows-friendly `curl` formatting with `^` line continuations.
- On Git Bash, Linux, or macOS, replace `^` with `\`.
- The backend is seeded in-memory, so data may reset when the server restarts.
