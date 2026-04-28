# Backend API Contract

This contract reflects the current NestJS backend implementation in this repo after the buddy, story, chat, and realtime updates completed on April 28, 2026.

## Auth

### `GET /auth/me`

Sample response:

```json
{
  "success": true,
  "message": "Current user fetched successfully.",
  "user": {
    "id": "u1",
    "name": "Your Name",
    "username": "yourusername",
    "email": "your@email.com",
    "avatar": "https://placehold.co/120x120",
    "avatarUrl": "https://placehold.co/120x120",
    "verified": true
  },
  "profile": {
    "id": "u1",
    "name": "Your Name",
    "username": "yourusername",
    "email": "your@email.com",
    "avatar": "https://placehold.co/120x120",
    "avatarUrl": "https://placehold.co/120x120",
    "verified": true
  },
  "data": {
    "id": "u1",
    "name": "Your Name",
    "username": "yourusername",
    "email": "your@email.com",
    "avatar": "https://placehold.co/120x120",
    "avatarUrl": "https://placehold.co/120x120",
    "verified": true
  }
}
```

## Buddies

Actor resolution:
- preferred: bearer token
- fallback: `userId` or `actorId`

### `GET /buddies`

Sample response:

```json
{
  "success": true,
  "message": "Buddies fetched successfully.",
  "data": [
    {
      "id": "bud_1714327200000",
      "status": "accepted",
      "mutualCount": 5,
      "createdAt": "2026-04-28T10:00:00.000Z",
      "user": {
        "id": "u2",
        "name": "Sadia Noor",
        "username": "sadia.noor",
        "avatar": "https://placehold.co/120x120",
        "avatarUrl": "https://placehold.co/120x120",
        "verified": false
      }
    }
  ],
  "items": [
    {
      "id": "bud_1714327200000",
      "status": "accepted"
    }
  ],
  "results": [
    {
      "id": "bud_1714327200000",
      "status": "accepted"
    }
  ],
  "count": 1
}
```

### `GET /buddies/requests/sent`

```json
{
  "success": true,
  "message": "Sent buddy requests fetched successfully.",
  "data": [
    {
      "id": "br_1714327200001",
      "status": "pending_sent",
      "mutualCount": 2,
      "createdAt": "2026-04-28T10:05:00.000Z",
      "user": {
        "id": "u3",
        "name": "Ariana Khan",
        "username": "ariana.khan",
        "avatar": "https://placehold.co/120x120",
        "avatarUrl": "https://placehold.co/120x120",
        "verified": false
      }
    }
  ]
}
```

### `GET /buddies/requests/received`

```json
{
  "success": true,
  "message": "Received buddy requests fetched successfully.",
  "data": [
    {
      "id": "br_1714327200002",
      "status": "pending_received",
      "mutualCount": 3,
      "createdAt": "2026-04-28T10:08:00.000Z",
      "user": {
        "id": "u4",
        "name": "Maya Quinn",
        "username": "maya.quinn",
        "avatar": "https://placehold.co/120x120",
        "avatarUrl": "https://placehold.co/120x120",
        "verified": true
      }
    }
  ]
}
```

### `POST /buddies/requests`

Body:

```json
{
  "targetUserId": "u2"
}
```

Sample response:

```json
{
  "success": true,
  "message": "Buddy request created successfully.",
  "id": "br_1714327200003",
  "status": "pending_sent",
  "mutualCount": 5,
  "createdAt": "2026-04-28T10:10:00.000Z",
  "user": {
    "id": "u2",
    "name": "Sadia Noor",
    "username": "sadia.noor",
    "avatar": "https://placehold.co/120x120",
    "avatarUrl": "https://placehold.co/120x120",
    "verified": false
  },
  "request": {
    "id": "br_1714327200003",
    "status": "pending_sent"
  }
}
```

### `POST /buddies/requests/{requestId}/accept`

```json
{
  "success": true,
  "message": "Buddy request accepted successfully.",
  "id": "bud_1714327200004",
  "status": "accepted",
  "mutualCount": 5,
  "createdAt": "2026-04-28T10:11:00.000Z",
  "user": {
    "id": "u2",
    "name": "Sadia Noor",
    "username": "sadia.noor",
    "avatar": "https://placehold.co/120x120",
    "avatarUrl": "https://placehold.co/120x120",
    "verified": false
  },
  "buddy": {
    "id": "bud_1714327200004",
    "status": "accepted"
  }
}
```

### `POST /buddies/requests/{requestId}/reject`

```json
{
  "success": true,
  "message": "Buddy request rejected successfully.",
  "id": "br_1714327200005",
  "status": "rejected",
  "mutualCount": 1,
  "createdAt": "2026-04-28T10:12:00.000Z",
  "user": {
    "id": "u6",
    "name": "Nayeem Hasan",
    "username": "nayeem.hasan",
    "avatar": "https://placehold.co/120x120",
    "avatarUrl": "https://placehold.co/120x120",
    "verified": false
  }
}
```

### `DELETE /buddies/requests/{requestId}`

```json
{
  "success": true,
  "requestId": "br_1714327200005",
  "userId": "u1",
  "deleted": true,
  "message": "Buddy request deleted successfully."
}
```

### `DELETE /buddies/{buddyUserId}`

```json
{
  "success": true,
  "userId": "u1",
  "buddyUserId": "u2",
  "removed": true,
  "message": "Buddy removed successfully."
}
```

## Stories

### `GET /stories`

Supports:
- `GET /stories`
- `GET /stories?userId=u1`
- `GET /stories?scope=buddies`

Sample response:

```json
{
  "success": true,
  "message": "Stories fetched successfully.",
  "data": [
    {
      "id": "s1",
      "userId": "u1",
      "author": {
        "id": "u1",
        "name": "Your Name",
        "username": "yourusername",
        "avatar": "https://placehold.co/120x120"
      },
      "media": "https://example.com/story.jpg",
      "mediaItems": ["https://example.com/story.jpg"],
      "isLocalFile": false,
      "text": "hello",
      "music": "",
      "backgroundColors": [4280173215, 4281053345],
      "textColorValue": 4294967295,
      "privacy": "Everyone",
      "collageLayout": "grid",
      "textOffsetDx": 0,
      "textOffsetDy": 0,
      "textScale": 1,
      "mediaTransforms": [],
      "seen": false,
      "createdAt": "2026-04-28T10:00:00.000Z",
      "expiresAt": "2026-04-29T10:00:00.000Z"
    }
  ]
}
```

### `POST /stories`

Body fields supported:
- `userId`
- `media`
- `mediaItems`
- `text`
- `music`
- `backgroundColors`
- `textColorValue`
- `privacy`
- `collageLayout`
- `textOffsetDx`
- `textOffsetDy`
- `textScale`
- `mediaTransforms`

Sample response:

```json
{
  "id": "s_new",
  "userId": "u1",
  "author": {
    "id": "u1",
    "name": "Your Name",
    "username": "yourusername",
    "avatar": "https://placehold.co/120x120"
  },
  "media": "https://example.com/story.jpg",
  "mediaItems": ["https://example.com/story.jpg"],
  "text": "hello",
  "seen": false,
  "createdAt": "2026-04-28T10:00:00.000Z"
}
```

### `DELETE /stories/{storyId}`

```json
{
  "success": true,
  "removed": {
    "id": "s1"
  },
  "message": "Story deleted successfully."
}
```

### `POST /stories/{storyId}/view`

```json
{
  "success": true,
  "storyId": "s1",
  "userId": "u2",
  "viewedAt": "2026-04-28T10:20:00.000Z",
  "viewerCount": 4
}
```

### `GET /stories/{storyId}/viewers`

```json
{
  "success": true,
  "message": "Story viewers fetched successfully.",
  "data": [
    {
      "id": "u2",
      "name": "Sadia Noor",
      "username": "sadia.noor",
      "avatar": "https://placehold.co/120x120",
      "avatarUrl": "https://placehold.co/120x120",
      "viewedAt": "2026-04-28T10:20:00.000Z"
    }
  ]
}
```

### `POST /stories/{storyId}/reactions`

```json
{
  "storyId": "s1",
  "userId": "u2",
  "reaction": "love",
  "createdAt": "2026-04-28T10:22:00.000Z",
  "user": {
    "id": "u2",
    "name": "Sadia Noor",
    "username": "sadia.noor",
    "avatar": "https://placehold.co/120x120"
  }
}
```

## Chat

### `GET /chat/threads`

```json
{
  "success": true,
  "message": "Threads fetched successfully.",
  "data": [
    {
      "id": "t1",
      "threadId": "t1",
      "chatId": "t1",
      "title": "Sadia Noor",
      "participantsLabel": "2 members",
      "summary": "Direct conversation",
      "participantIds": ["u1", "u2"],
      "participants": [
        {
          "id": "u1",
          "name": "Me",
          "username": "me",
          "avatar": "https://placehold.co/120x120"
        },
        {
          "id": "u2",
          "name": "Sadia Noor",
          "username": "sadia.noor",
          "avatar": "https://placehold.co/120x120"
        }
      ],
      "unreadCount": 1,
      "lastMessage": {
        "id": "m9",
        "chatId": "t1",
        "threadId": "t1",
        "senderId": "u2",
        "text": "Hi",
        "timestamp": "2026-04-28T10:00:00.000Z",
        "read": false,
        "starred": false,
        "replyToMessageId": null,
        "deliveryState": "delivered",
        "kind": "text",
        "mediaPath": null
      }
    }
  ]
}
```

### `POST /chat/threads`

Body:

```json
{
  "targetUserId": "u2"
}
```

Sample response:

```json
{
  "success": true,
  "message": "Thread created successfully.",
  "thread": {
    "id": "t1",
    "chatId": "t1"
  }
}
```

### `GET /chat/threads/{threadId}`

```json
{
  "success": true,
  "message": "Thread fetched successfully.",
  "thread": {
    "id": "t1",
    "chatId": "t1",
    "participants": [
      {
        "id": "u1",
        "name": "Me",
        "username": "me",
        "avatar": "https://placehold.co/120x120"
      },
      {
        "id": "u2",
        "name": "Sadia Noor",
        "username": "sadia.noor",
        "avatar": "https://placehold.co/120x120"
      }
    ],
    "messages": []
  }
}
```

### `GET /chat/threads/{threadId}/messages`

```json
{
  "success": true,
  "message": "Thread messages fetched successfully.",
  "data": [
    {
      "id": "m1",
      "chatId": "t1",
      "threadId": "t1",
      "senderId": "u2",
      "text": "Hello",
      "timestamp": "2026-04-28T10:00:00.000Z",
      "read": false,
      "starred": false,
      "replyToMessageId": null,
      "deliveryState": "sent",
      "kind": "text",
      "mediaPath": null
    }
  ]
}
```

### `POST /chat/threads/{threadId}/messages`

```json
{
  "success": true,
  "message": "Message sent successfully.",
  "id": "m2",
  "chatId": "t1",
  "threadId": "t1",
  "senderId": "u1",
  "text": "Hello back",
  "timestamp": "2026-04-28T10:01:00.000Z",
  "read": false,
  "starred": false,
  "replyToMessageId": null,
  "deliveryState": "sent",
  "kind": "text",
  "mediaPath": null
}
```

### `POST /chat/threads/{threadId}/read`

```json
{
  "success": true,
  "message": "Thread marked as read successfully.",
  "threadId": "t1",
  "userId": "u1",
  "updatedCount": 2,
  "messages": []
}
```

### `GET /chat/presence`

```json
{
  "success": true,
  "message": "Chat presence fetched successfully.",
  "presence": {
    "onlineUserIds": ["u1"],
    "users": [
      {
        "userId": "u1",
        "online": true,
        "socketCount": 1,
        "lastSeen": "now"
      }
    ],
    "threadTyping": []
  }
}
```

### `POST /chat/presence`

```json
{
  "success": true,
  "message": "Chat presence updated successfully.",
  "presence": {
    "users": [
      {
        "userId": "u1",
        "online": true,
        "lastSeen": "now",
        "typingInThreadId": "t1"
      }
    ]
  }
}
```

### `GET /chat/preferences`

```json
{
  "success": true,
  "message": "Chat preferences fetched successfully.",
  "preferences": {
    "conversationPreferences": [
      {
        "threadId": "t1",
        "archived": false,
        "muted": false,
        "pinned": true,
        "unread": true,
        "clearedAt": null
      }
    ],
    "notificationPreferences": {
      "pushCategories": [
        {
          "title": "Messages",
          "enabled": true
        }
      ],
      "emailEnabled": true,
      "pushEnabled": true
    },
    "safetyConfig": {
      "reportCategories": [
        {
          "reason": "Harassment",
          "status": "active"
        }
      ]
    }
  }
}
```

### `PUT /chat/preferences`

Body:

```json
{
  "patch": {
    "notificationPreferences": {
      "pushEnabled": false
    }
  }
}
```

Sample response:

```json
{
  "success": true,
  "message": "Chat preferences updated successfully.",
  "preferences": {
    "notificationPreferences": {
      "pushEnabled": false
    }
  }
}
```

### Useful extras

- `POST /chat/threads/{threadId}/archive`
- `POST /chat/threads/{threadId}/mute`
- `POST /chat/threads/{threadId}/pin`

## Socket events

Namespace:

```text
/realtime
```

Server events now exposed for chat/presence:
- `message:new`
- `message:read`
- `presence:update`

Existing parallel events still available:
- `chat.message.created`
- `chat.message.read`
- `presence.updated`
