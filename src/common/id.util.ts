import { randomUUID } from 'crypto';

export function makeId<T extends string>(prefix: T): `${T}_${string}` {
  return `${prefix}_${randomUUID().replace(/-/g, '')}` as `${T}_${string}`;
}
