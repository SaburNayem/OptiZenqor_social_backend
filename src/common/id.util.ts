import { randomUUID } from 'crypto';

export type IdPrefix =
  | 'user'
  | 'story'
  | 'post'
  | 'product'
  | 'upload'
  | 'comment'
  | 'reaction'
  | 'reel'
  | 'like'
  | 'share'
  | 'order'
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
