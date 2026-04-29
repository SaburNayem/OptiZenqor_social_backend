# OptiZenqor Social Backend Curl Reference

## Base URL

```bash
http://localhost:3000
```

## Health and docs

```bash
curl http://localhost:3000/health
curl http://localhost:3000/docs-json
```

## Auth

Login:

```bash
curl -X POST http://localhost:3000/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"maya@optizenqor.app\",\"password\":\"123456\"}"
```

Refresh token:

```bash
curl -X POST http://localhost:3000/auth/refresh-token ^
  -H "Content-Type: application/json" ^
  -d "{\"refreshToken\":\"<refreshToken>\"}"
```

Current user:

```bash
curl http://localhost:3000/auth/me ^
  -H "Authorization: Bearer <accessToken>"
```

Logout:

```bash
curl -X POST http://localhost:3000/auth/logout ^
  -H "Authorization: Bearer <accessToken>"
```

## App bootstrap

```bash
curl http://localhost:3000/app/bootstrap

curl http://localhost:3000/app/bootstrap ^
  -H "Authorization: Bearer <accessToken>"
```

## Feed and posts

```bash
curl http://localhost:3000/feed
curl http://localhost:3000/posts

curl -X POST http://localhost:3000/posts ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"authorId\":\"user_xxx\",\"caption\":\"New post from curl\",\"media\":[\"https://placehold.co/800x600\"],\"tags\":[\"curl\",\"api\"]}"
```

## Stories

```bash
curl http://localhost:3000/stories

curl -X POST http://localhost:3000/stories ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user_xxx\",\"text\":\"Story from curl\",\"media\":\"https://placehold.co/600x900\"}"

curl -X POST http://localhost:3000/stories/story_xxx/view ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user_xxx\"}"
```

## Reels

```bash
curl http://localhost:3000/reels

curl -X POST http://localhost:3000/reels ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"authorId\":\"user_xxx\",\"caption\":\"Reel from curl\",\"audioName\":\"Creator Motion Pack\",\"thumbnail\":\"https://placehold.co/600x900\",\"videoUrl\":\"https://example.com/reel.mp4\"}"
```

## Chat

```bash
curl http://localhost:3000/chat/threads ^
  -H "Authorization: Bearer <accessToken>"

curl http://localhost:3000/chat/threads/conversation_xxx/messages ^
  -H "Authorization: Bearer <accessToken>"

curl -X POST http://localhost:3000/chat/threads/conversation_xxx/messages ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"text\":\"Hello from curl\"}"
```

## Notifications

```bash
curl http://localhost:3000/notifications ^
  -H "Authorization: Bearer <accessToken>"

curl http://localhost:3000/notifications/preferences ^
  -H "Authorization: Bearer <accessToken>"

curl -X PATCH http://localhost:3000/notifications/notification_xxx/read ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user_xxx\"}"
```

## Bookmarks and drafts

```bash
curl http://localhost:3000/bookmarks ^
  -H "Authorization: Bearer <accessToken>"

curl -X POST http://localhost:3000/bookmarks ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"id\":\"post_xxx\",\"title\":\"Saved post\",\"type\":\"post\"}"

curl http://localhost:3000/drafts ^
  -H "Authorization: Bearer <accessToken>"

curl http://localhost:3000/saved-collections ^
  -H "Authorization: Bearer <accessToken>"

curl -X POST http://localhost:3000/saved-collections ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Creator references\",\"itemIds\":[\"post_xxx\",\"reel_xxx\"]}"
```

## Marketplace

```bash
curl http://localhost:3000/marketplace/products
curl "http://localhost:3000/marketplace/products?page=1&limit=12&category=Electronics&sort=price&order=asc"

curl -X POST http://localhost:3000/marketplace/products ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Phone\",\"description\":\"Good condition\",\"price\":12000,\"category\":\"Electronics\",\"subcategory\":\"Phones\",\"sellerId\":\"user_xxx\",\"sellerName\":\"Seller\",\"location\":\"Dhaka\",\"images\":[\"https://placehold.co/600x600\"],\"condition\":\"Used\"}"

curl -X POST http://localhost:3000/marketplace/checkout ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"productId\":\"product_xxx\",\"address\":\"House 14, Road 7, Dhaka\",\"deliveryMethod\":\"Home delivery\",\"paymentMethod\":\"Cash on delivery\"}"
```

## Jobs

```bash
curl http://localhost:3000/jobs
curl "http://localhost:3000/jobs?page=1&limit=10&status=open&type=fullTime&search=flutter"

curl -X POST http://localhost:3000/jobs/create ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Flutter Developer\",\"company\":\"OptiZenqor\",\"location\":\"Dhaka\",\"salary\":\"50000-80000\",\"type\":\"fullTime\",\"experienceLevel\":\"mid\"}"

curl -X POST http://localhost:3000/jobs/job_xxx/apply ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"applicantName\":\"Maya Quinn\"}"
```

## Events

```bash
curl http://localhost:3000/events
curl "http://localhost:3000/events?page=1&limit=10&status=Approved&category=community&sort=date&order=asc"

curl -X POST http://localhost:3000/events ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"title\":\"Creator Meetup\",\"organizer\":\"OptiZenqor\",\"date\":\"2026-05-10\",\"time\":\"18:00\",\"location\":\"Dhaka\",\"participants\":0,\"price\":0,\"status\":\"Approved\"}"

curl -X PATCH http://localhost:3000/events/event_xxx/rsvp ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user_xxx\"}"
```

## Communities and pages

```bash
curl http://localhost:3000/communities
curl "http://localhost:3000/communities?page=1&limit=10&privacy=public&search=creator"
curl http://localhost:3000/pages
curl "http://localhost:3000/pages?page=1&limit=10&category=Business&sort=followerCount&order=desc"

curl -X POST http://localhost:3000/communities ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Creator Circle\",\"description\":\"Community created from curl\",\"privacy\":\"public\"}"

curl -X POST http://localhost:3000/communities/community_xxx/join ^
  -H "Authorization: Bearer <accessToken>" ^
  -H "Content-Type: application/json" ^
  -d "{\"userId\":\"user_xxx\"}"
```

## Wallet and monetization

```bash
curl http://localhost:3000/wallet ^
  -H "Authorization: Bearer <accessToken>"

curl http://localhost:3000/monetization/overview ^
  -H "Authorization: Bearer <accessToken>"

curl http://localhost:3000/premium-plans
```

## Uploads

```bash
curl -X POST http://localhost:3000/uploads ^
  -H "Authorization: Bearer <accessToken>" ^
  -F "file=@C:/path/to/image.png" ^
  -F "folder=optizenqor/posts" ^
  -F "resourceType=auto"
```

## Important note

These examples focus on the routes already preferred for real backend integration. Some older utility/admin/discovery routes still exist in the repo, but they are not all fully migrated away from static helper services yet.
