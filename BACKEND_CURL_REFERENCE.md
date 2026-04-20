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

curl -X PATCH http://localhost:3000/posts/p1 ^
  -H "Content-Type: application/json" ^
  -d "{\"caption\":\"Updated caption from curl\",\"tags\":[\"updated\",\"api\"]}"

curl -X DELETE http://localhost:3000/posts/p1

curl http://localhost:3000/stories
curl http://localhost:3000/stories/s1
curl "http://localhost:3000/stories?userId=u1"
curl http://localhost:3000/stories/s1/comments
curl http://localhost:3000/stories/s1/reactions

curl -X POST http://localhost:3000/stories ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"u1\",\"text\":\"Story from curl\",\"media\":\"https://placehold.co/600x900\",\"music\":\"Ambient Rise\",\"backgroundColors\":[4280176815,4281053345],\"textColorValue\":4294967295}"

curl -X PATCH http://localhost:3000/stories/s1 ^
  -H "Content-Type: application/json" ^
  -d "{\"seen\":true,\"text\":\"Updated story text\"}"

curl -X POST http://localhost:3000/stories/s1/comments ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"u4\",\"comment\":\"Story comment from curl\"}"

curl -X POST http://localhost:3000/stories/s1/reactions ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"u2\",\"reaction\":\"fire\"}"

curl -X DELETE http://localhost:3000/stories/s1

curl http://localhost:3000/reels
curl http://localhost:3000/reels/r1
curl "http://localhost:3000/reels?authorId=u1"
curl http://localhost:3000/reels/r1/comments
curl http://localhost:3000/reels/r1/reactions

curl -X POST http://localhost:3000/reels ^
  -H "Content-Type: application/json" ^
  -d "{\"authorId\":\"u1\",\"caption\":\"Reel from curl\",\"audioName\":\"Creator Motion Pack\",\"thumbnail\":\"https://placehold.co/600x900\",\"videoUrl\":\"https://example.com/reel.mp4\",\"textOverlays\":[\"Hook in 2 sec\"],\"subtitleEnabled\":true,\"remixEnabled\":true}"

curl -X PATCH http://localhost:3000/reels/r1 ^
  -H "Content-Type: application/json" ^
  -d "{\"caption\":\"Updated reel caption\",\"audioName\":\"Store Drop\"}"

curl -X POST http://localhost:3000/reels/r1/comments ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"u3\",\"comment\":\"Reel comment from curl\"}"

curl -X POST http://localhost:3000/reels/r1/reactions ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"u4\",\"reaction\":\"like\"}"

curl -X DELETE http://localhost:3000/reels/r1
```

## Post Detail

```bash
curl http://localhost:3000/posts/p1   # includes author + detail + comments
curl http://localhost:3000/posts/p1/comments
curl http://localhost:3000/posts/p1/comments/pc1/replies
curl http://localhost:3000/posts/p1/reactions

curl -X POST http://localhost:3000/posts/p1/comments ^
  -H "Content-Type: application/json" ^
  -d "{\"authorId\":\"u1\",\"author\":\"API Tester\",\"message\":\"Comment from curl\"}"

curl -X POST http://localhost:3000/posts/p1/comments/pc1/replies ^
  -H "Content-Type: application/json" ^
  -d "{\"authorId\":\"u2\",\"author\":\"Nexa Studio\",\"message\":\"Reply from curl\"}"

curl -X PATCH http://localhost:3000/posts/p1/comments/pc1/react ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"u1\",\"reaction\":\"fire\"}"

curl -X POST http://localhost:3000/posts/p1/reactions ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"u4\",\"reaction\":\"love\"}"
```

## Drafts, Scheduling, Upload Manager

```bash
curl http://localhost:3000/drafts
curl http://localhost:3000/drafts/draft1
curl http://localhost:3000/scheduling
curl http://localhost:3000/upload-manager
curl http://localhost:3000/upload-manager/up1

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

curl -X POST http://localhost:3000/uploads ^
  -F "file=@C:/path/to/image.png" ^
  -F "folder=optizenqor/posts" ^
  -F "resourceType=auto"

curl -X POST http://localhost:3000/upload-manager ^
  -F "file=@C:/path/to/video.mp4" ^
  -F "folder=optizenqor/reels" ^
  -F "resourceType=video"
```

## Chat and Presence

```bash
curl http://localhost:3000/chat/threads
curl http://localhost:3000/chat/threads/t1
curl http://localhost:3000/chat/presence
curl http://localhost:3000/chat/preferences
curl http://localhost:3000/messages
curl http://localhost:3000/messages/t1

curl -X POST http://localhost:3000/chat/threads/t1/messages ^
  -H "Content-Type: application/json" ^
  -d "{\"senderId\":\"u1\",\"text\":\"Hello from curl\",\"attachments\":[\"https://res.cloudinary.com/demo/image/upload/sample.jpg\"],\"kind\":\"image\",\"mediaPath\":\"https://res.cloudinary.com/demo/image/upload/sample.jpg\"}"

curl -X PATCH http://localhost:3000/chat/threads/t1/archive
curl -X PATCH http://localhost:3000/chat/threads/t1/mute
curl -X PATCH http://localhost:3000/chat/threads/t1/pin
curl -X PATCH http://localhost:3000/chat/threads/t1/unread
curl -X PATCH http://localhost:3000/chat/threads/t1/read ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"u2\"}"
curl -X DELETE http://localhost:3000/chat/threads/t1/clear
```

## Events

```bash
curl http://localhost:3000/events
curl http://localhost:3000/events/e1
curl "http://localhost:3000/events?status=Featured"

curl -X POST http://localhost:3000/events ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Curl Event\",\"organizer\":\"API Tester\",\"date\":\"2026-05-01\",\"time\":\"18:00\",\"location\":\"Dhaka\",\"participants\":50,\"price\":0}"

curl -X PATCH http://localhost:3000/events/e1/rsvp ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"u1\"}"

curl -X PATCH http://localhost:3000/events/e1/save ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"u1\"}"
```

## Marketplace

```bash
curl http://localhost:3000/marketplace
curl http://localhost:3000/marketplace/products
curl http://localhost:3000/marketplace/products/prd1

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
curl http://localhost:3000/bookmarks/p1
curl http://localhost:3000/saved-collections
curl http://localhost:3000/saved-collections/col1

curl -X POST http://localhost:3000/bookmarks ^
  -H "Content-Type: application/json" ^
  -d "{\"id\":\"p1\",\"type\":\"post\"}"

curl -X POST http://localhost:3000/bookmarks/posts/p1

curl -X DELETE http://localhost:3000/bookmarks/p1

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

## Block and Hide

```bash
curl http://localhost:3000/block
curl "http://localhost:3000/block?actorId=u1"
curl "http://localhost:3000/block/u4?actorId=u1"

curl -X POST http://localhost:3000/block ^
  -H "Content-Type: application/json" ^
  -d "{\"actorId\":\"u1\",\"targetId\":\"u4\",\"reason\":\"spam\"}"

curl -X DELETE "http://localhost:3000/block/u4?actorId=u1"

curl http://localhost:3000/hide
curl http://localhost:3000/hide/posts/all
curl http://localhost:3000/hide/p-hidden-1

curl -X POST http://localhost:3000/hide ^
  -H "Content-Type: application/json" ^
  -d "{\"targetId\":\"p1\",\"targetType\":\"post\"}"

curl -X POST http://localhost:3000/hide/posts/p1

curl -X DELETE http://localhost:3000/hide/p1
curl -X DELETE http://localhost:3000/hide/posts/p1
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
curl http://localhost:3000/notifications
curl http://localhost:3000/notifications/inbox
curl http://localhost:3000/notifications/preferences
curl http://localhost:3000/push-notification-preferences

curl -X POST http://localhost:3000/notifications/campaigns ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Curl Campaign\",\"audience\":\"Creators\",\"schedule\":\"2026-04-21T09:00:00.000Z\"}"

curl -X PATCH http://localhost:3000/notification-preferences ^
  -H "Content-Type: application/json" ^
  -d "{\"pushEnabled\":true,\"emailEnabled\":false}"
```

## Settings, Safety, Support

```bash
curl http://localhost:3000/settings
curl http://localhost:3000/settings/state
curl http://localhost:3000/settings/account
curl http://localhost:3000/settings/items
curl http://localhost:3000/settings/items/account-settings
curl http://localhost:3000/settings/sections
curl http://localhost:3000/advanced-privacy-controls
curl "http://localhost:3000/blocked-muted-accounts?actorId=u1"
curl http://localhost:3000/accessibility-support
curl http://localhost:3000/explore-recommendation
curl http://localhost:3000/legal-compliance
curl http://localhost:3000/safety/config
curl http://localhost:3000/support/faqs
curl http://localhost:3000/support-help
curl http://localhost:3000/support/tickets
curl http://localhost:3000/support/chat

curl -X PATCH http://localhost:3000/settings/items/privacy ^
  -H "Content-Type: application/json" ^
  -d "{\"hideLikes\":true}"

curl -X PATCH http://localhost:3000/settings/state ^
  -H "Content-Type: application/json" ^
  -d "{\"privacy.hide_likes\":true,\"notifications.push_enabled\":false}"

curl -X POST http://localhost:3000/support/tickets ^
  -H "Content-Type: application/json" ^
  -d "{\"subject\":\"Need help from curl\",\"category\":\"account\"}"
```

## Realtime, Group Chat, Calls, Live Stream

```bash
curl http://localhost:3000/group-chat
curl http://localhost:3000/group-chat/gc1
curl http://localhost:3000/calls
curl http://localhost:3000/calls/call1
curl http://localhost:3000/calls/rtc-config
curl http://localhost:3000/calls/sessions
curl http://localhost:3000/live-stream
curl http://localhost:3000/live-stream/live1
curl http://localhost:3000/socket/contract

curl -X POST http://localhost:3000/calls/sessions ^
  -H "Content-Type: application/json" ^
  -d "{\"initiatorId\":\"u1\",\"recipientIds\":[\"u2\"],\"mode\":\"video\",\"threadId\":\"t1\"}"

curl -X PATCH http://localhost:3000/calls/sessions/call_session_example/end ^
  -H "Content-Type: application/json" ^
  -d "{\"endedBy\":\"u1\",\"reason\":\"completed\"}"
```

## Profiles, Media, and App Contract Aliases

```bash
curl http://localhost:3000/profile/u1
curl http://localhost:3000/user-profile/u1
curl http://localhost:3000/follow-unfollow/u1/followers
curl http://localhost:3000/follow-unfollow/u1/following
curl http://localhost:3000/creator-dashboard
curl http://localhost:3000/business-profile
curl http://localhost:3000/seller-profile
curl http://localhost:3000/recruiter-profile
curl http://localhost:3000/media-viewer
curl http://localhost:3000/media-viewer/media_p1_1
curl http://localhost:3000/feed/home
curl http://localhost:3000/messages
curl http://localhost:3000/messages/t1
curl "http://localhost:3000/search-discovery?q=creator"

curl -X POST http://localhost:3000/messages/t1 ^
  -H "Content-Type: application/json" ^
  -d "{\"senderId\":\"u1\",\"text\":\"Hello from /messages alias\"}"

curl -X POST http://localhost:3000/posts/create ^
  -H "Content-Type: application/json" ^
  -d "{\"authorId\":\"u1\",\"caption\":\"Created from /posts/create\",\"media\":[\"https://placehold.co/800x600\"],\"tags\":[\"alias\"]}"
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
