# OptiZenqor Social Backend Curl Reference

## Base URL

```bash
https://opti-zenqor-social-backend.vercel.app
```

## Health and docs

```bash
curl https://opti-zenqor-social-backend.vercel.app/health
curl https://opti-zenqor-social-backend.vercel.app/docs-json
```

## Auth

Login:

```bash
curl -X POST https://opti-zenqor-social-backend.vercel.app/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"maya@optizenqor.app\",\"password\":\"123456\"}"
```

Refresh token:

```bash
curl -X POST https://opti-zenqor-social-backend.vercel.app/auth/refresh-token ^
  -H "Content-Type: application/json" ^
  -d "{\"refreshToken\":\"<refreshToken>\"}"
```

Current user:

```bash
curl https://opti-zenqor-social-backend.vercel.app/auth/me ^
  -H "Authorization: Bearer <accessToken>"
```

Logout:

```bash
curl -X POST https://opti-zenqor-social-backend.vercel.app/auth/logout ^
  -H "Authorization: Bearer <accessToken>"
```

## App bootstrap

```bash
curl https://opti-zenqor-social-backend.vercel.app/app/bootstrap

curl https://opti-zenqor-social-backend.vercel.app/app/bootstrap ^
  -H "Authorization: Bearer <accessToken>"
```

## Feed and posts

```bash
curl https://opti-zenqor-social-backend.vercel.app/feed
curl https://opti-zenqor-social-backend.vercel.app/posts

curl -X POST https://opti-zenqor-social-backend.vercel.app/posts ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"authorId\":\"user_xxx\",\"caption\":\"New post from curl\",\"media\":[\"https://placehold.co/800x600\"],\"tags\":[\"curl\",\"api\"]}"
```

## Stories

```bash
curl https://opti-zenqor-social-backend.vercel.app/stories

curl -X POST https://opti-zenqor-social-backend.vercel.app/stories ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user_xxx\",\"text\":\"Story from curl\",\"media\":\"https://placehold.co/600x900\"}"

curl -X POST https://opti-zenqor-social-backend.vercel.app/stories/story_xxx/view ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user_xxx\"}"
```

## Reels

```bash
curl https://opti-zenqor-social-backend.vercel.app/reels

curl -X POST https://opti-zenqor-social-backend.vercel.app/reels ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"authorId\":\"user_xxx\",\"caption\":\"Reel from curl\",\"audioName\":\"Creator Motion Pack\",\"thumbnail\":\"https://placehold.co/600x900\",\"videoUrl\":\"https://example.com/reel.mp4\"}"
```

## Chat

```bash
curl https://opti-zenqor-social-backend.vercel.app/chat/threads ^
  -H "Authorization: Bearer <accessToken>"

curl https://opti-zenqor-social-backend.vercel.app/chat/threads/conversation_xxx/messages ^
  -H "Authorization: Bearer <accessToken>"

curl -X POST https://opti-zenqor-social-backend.vercel.app/chat/threads/conversation_xxx/messages ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"Hello from curl\"}"
```

## Notifications

```bash
curl https://opti-zenqor-social-backend.vercel.app/notifications ^
  -H "Authorization: Bearer <accessToken>"

curl https://opti-zenqor-social-backend.vercel.app/notifications/preferences ^
  -H "Authorization: Bearer <accessToken>"

curl -X PATCH https://opti-zenqor-social-backend.vercel.app/notifications/notification_xxx/read ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user_xxx\"}"
```

## Bookmarks and drafts

```bash
curl https://opti-zenqor-social-backend.vercel.app/bookmarks ^
  -H "Authorization: Bearer <accessToken>"

curl -X POST https://opti-zenqor-social-backend.vercel.app/bookmarks ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"id\":\"post_xxx\",\"title\":\"Saved post\",\"type\":\"post\"}"

curl https://opti-zenqor-social-backend.vercel.app/drafts ^
  -H "Authorization: Bearer <accessToken>"

curl https://opti-zenqor-social-backend.vercel.app/saved-collections ^
  -H "Authorization: Bearer <accessToken>"

curl -X POST https://opti-zenqor-social-backend.vercel.app/saved-collections ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Creator references\",\"itemIds\":[\"post_xxx\",\"reel_xxx\"]}"
```

## Marketplace

```bash
curl https://opti-zenqor-social-backend.vercel.app/marketplace/products
curl "https://opti-zenqor-social-backend.vercel.app/marketplace/products?page=1&limit=12&category=Electronics&sort=price&order=asc"

curl -X POST https://opti-zenqor-social-backend.vercel.app/marketplace/products ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Phone\",\"description\":\"Good condition\",\"price\":12000,\"category\":\"Electronics\",\"subcategory\":\"Phones\",\"sellerId\":\"user_xxx\",\"sellerName\":\"Seller\",\"location\":\"Dhaka\",\"images\":[\"https://placehold.co/600x600\"],\"condition\":\"Used\"}"

curl -X POST https://opti-zenqor-social-backend.vercel.app/marketplace/checkout ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"productId\":\"product_xxx\",\"address\":\"House 14, Road 7, Dhaka\",\"deliveryMethod\":\"Home delivery\",\"paymentMethod\":\"Cash on delivery\"}"
```

## Jobs

```bash
curl https://opti-zenqor-social-backend.vercel.app/jobs
curl "https://opti-zenqor-social-backend.vercel.app/jobs?page=1&limit=10&status=open&type=fullTime&search=flutter"
curl https://opti-zenqor-social-backend.vercel.app/jobs-networking ^
  -H "Authorization: Bearer <accessToken>"
curl https://opti-zenqor-social-backend.vercel.app/jobs/alerts ^
  -H "Authorization: Bearer <accessToken>"
curl https://opti-zenqor-social-backend.vercel.app/jobs/profile ^
  -H "Authorization: Bearer <accessToken>"
curl https://opti-zenqor-social-backend.vercel.app/jobs/employer-stats ^
  -H "Authorization: Bearer <accessToken>"
curl https://opti-zenqor-social-backend.vercel.app/jobs/employer-profile ^
  -H "Authorization: Bearer <accessToken>"
curl https://opti-zenqor-social-backend.vercel.app/jobs/applicants ^
  -H "Authorization: Bearer <accessToken>"
curl https://opti-zenqor-social-backend.vercel.app/jobs/companies

curl -X POST https://opti-zenqor-social-backend.vercel.app/jobs/create ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Flutter Developer\",\"company\":\"OptiZenqor\",\"location\":\"Dhaka\",\"salary\":\"50000-80000\",\"type\":\"fullTime\",\"experienceLevel\":\"mid\"}"

curl -X POST https://opti-zenqor-social-backend.vercel.app/jobs/job_xxx/apply ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"applicantName\":\"Maya Quinn\"}"
```

## Events

```bash
curl https://opti-zenqor-social-backend.vercel.app/events
curl "https://opti-zenqor-social-backend.vercel.app/events?page=1&limit=10&status=Approved&category=community&sort=date&order=asc"

curl -X POST https://opti-zenqor-social-backend.vercel.app/events ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Creator Meetup\",\"organizer\":\"OptiZenqor\",\"date\":\"2026-05-10\",\"time\":\"18:00\",\"location\":\"Dhaka\",\"participants\":0,\"price\":0,\"status\":\"Approved\"}"

curl -X PATCH https://opti-zenqor-social-backend.vercel.app/events/event_xxx/rsvp ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user_xxx\"}"
```

## Communities and pages

```bash
curl https://opti-zenqor-social-backend.vercel.app/communities
curl "https://opti-zenqor-social-backend.vercel.app/communities?page=1&limit=10&privacy=public&search=creator"
curl https://opti-zenqor-social-backend.vercel.app/pages
curl "https://opti-zenqor-social-backend.vercel.app/pages?page=1&limit=10&category=Business&sort=followerCount&order=desc"

curl -X POST https://opti-zenqor-social-backend.vercel.app/communities ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Creator Circle\",\"description\":\"Community created from curl\",\"privacy\":\"public\"}"

curl -X POST https://opti-zenqor-social-backend.vercel.app/communities/community_xxx/join ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user_xxx\"}"
```

## Wallet and monetization

```bash
curl https://opti-zenqor-social-backend.vercel.app/wallet ^
  -H "Authorization: Bearer <accessToken>"

curl https://opti-zenqor-social-backend.vercel.app/monetization/overview ^
  -H "Authorization: Bearer <accessToken>"

curl https://opti-zenqor-social-backend.vercel.app/premium-plans
```

## Uploads

```bash
curl -X POST https://opti-zenqor-social-backend.vercel.app/uploads ^
  -H "Authorization: Bearer <accessToken>" ^
  -F "file=@C:/path/to/image.png" ^
  -F "folder=optizenqor/posts" ^
  -F "resourceType=auto"
```

## Important note

These examples focus on the routes already preferred for real backend integration. Some older utility/admin/discovery routes still exist in the repo, but they are not all fully migrated away from static helper services yet.
