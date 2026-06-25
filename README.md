# MBE Prep

Audio-first adaptive bar-preparation web application for planning, practice,
audio study, essays, review, and transparent mastery analytics.

## Requirements

- Node.js 24+
- npm 11+
- Docker Compose for local PostgreSQL

## Setup

```bash
npm install
cp .env.example .env
docker compose up -d postgres
npm run db:generate
npm run db:migrate
npm run db:seed
npm run db:check
npm run dev
```

Open http://localhost:3000.

Development-only health page: http://localhost:3000/dev/health

The local app expects PostgreSQL to be running before evaluation:

```bash
docker compose up -d postgres
npm run db:check
```

Use `/api/health` to confirm the Next.js process is available and
`/api/readiness` to confirm the required PostgreSQL connection is ready.

## Test and Quality Commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

## Database Commands

```bash
docker compose up -d postgres
npm run db:migrate
npm run db:deploy
npm run db:push
npm run db:seed
npm run db:studio
npm run db:check
```

## Environment

Required variables are validated in `src/env/server.ts`.

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_NAME`
- `AUTH_SECRET`
- `ONBOARDING_EXTENDED_TIME_MULTIPLIER_MIN`
- `ONBOARDING_EXTENDED_TIME_MULTIPLIER_MAX`
- `PODCAST_STORAGE_DRIVER`
- `PODCAST_LOCAL_STORAGE_DIR`
- `PODCAST_MAX_UPLOAD_BYTES`
- `PODCAST_SIGNED_URL_SECRET`
- `PODCAST_SIGNED_URL_TTL_SECONDS`
- `S3_ENDPOINT`
- `S3_BUCKET`
- `S3_REGION`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`

## Authentication

The app uses Auth.js through a small application adapter in `src/auth`. Production providers are intentionally replaceable. Outside production, `/login` exposes development-only sign-in buttons for:

- `dev-admin@example.test`
- `dev-learner@example.test`

Authenticated routes are protected by middleware, and admin routes are also guarded server-side.

## Content Safety

Legal content remains controlled by the admin review workflow. Test fixtures
and demos must be labeled `DEMO_NOT_FOR_PUBLICATION`, and any future legal
content requires approved review before publication.

## Original Question Imports

Audited original MBE-style drafts can be imported locally after database setup:

```bash
npm run content:import -- data/import/mbe_original_question_bank_batch_003_audited.json
```

The importer validates the batch before writing. Imported Batch 003 records are idempotently upserted as unpublished `LEGAL_REVIEW` question versions, with `publishable: false`, source/license metadata, taxonomy links, answer choices, rationales, distractor classifications, and internal audit metadata preserved for admin review. They appear in `/admin/questions` and `/admin/questions/batches/original-legacy-mbe-style-batch-003-audited`; they are not eligible for student practice until the configured legal and editorial workflow later publishes an approved version.
