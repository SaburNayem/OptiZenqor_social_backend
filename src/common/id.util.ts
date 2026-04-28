import { randomUUID } from 'crypto';

export type IdPrefix =
  | 'user'
  | 'story'
  | 'post'
  | 'product'
  | 'bookmark'
  | 'upload'
  | 'comment'
  | 'reaction'
  | 'reel'
  | 'draft'
  | 'like'
  | 'share'
  | 'order'
  | 'report'
  | 'thread'
  | 'session'
  | 'notification'
  | 'message'
  | 'conversation'
  | 'buddy_request'
  | 'buddy_relation'
  | 'call_session'
  | 'call_signal';

export function makeId<T extends IdPrefix>(prefix: T): `${T}_${string}` {
  return `${prefix}_${randomUUID().replace(/-/g, '')}` as `${T}_${string}`;
}
