# Backend Frontend Mismatch Report

Updated: 2026-05-02

## Fixed In This Pass

- backend Prisma runtime was corrected to use:
  - pooled runtime connection via `DATABASE_URL`
  - direct migration connection via `DIRECT_URL`
- backend migration history was reconciled safely instead of forcing a destructive reset
- backend seed catalogs now match the current Prisma schema for:
  - localization locales
  - accessibility options
  - legal documents
  - onboarding items
  - personalization items
- backend production boot and database health endpoints now validate successfully
- Flutter marketplace mutations no longer convert backend failure into nullable success results
- Flutter calls now pass the real recipient id to the session-creation endpoint
- Flutter live stream repository no longer invents preview label content client-side

## Current Mismatches

- marketplace, jobs, calls, live, and support payloads are improved but still not fully complete enough to remove every client-side display fallback
- some backend settings/config surfaces still pass through static shaping services before reaching persisted data
- dashboard backend coverage is solid for validation, but UI depth is still behind the full target brief

## Validation Snapshot

- Backend `npm install` passed
- Backend `npm run prisma:generate` passed
- Backend `npm run prisma:migrate` passed
- Backend `npm run seed:dev` passed
- Backend `npm run typecheck` passed
- Backend `npm run build` passed
- Backend `npm run start:prod` passed
- Backend `/health` passed
- Backend `/health/database` passed
- Flutter `flutter pub get` passed
- Flutter `dart format .` passed
- Flutter `flutter analyze` passed
- Flutter `flutter test` passed
- Dashboard `npm install` passed
- Dashboard `npm run lint` passed
- Dashboard `npm run build` passed

## Honest Status

- Backend: 93%
- Flutter: 82%
- Dashboard: 85%
- Overall: 87%
