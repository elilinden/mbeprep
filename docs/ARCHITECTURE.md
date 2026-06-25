# Architecture

## Stack

- Next.js App Router
- TypeScript strict mode
- Tailwind CSS
- Prisma ORM
- PostgreSQL
- Vitest
- Playwright
- ESLint and Prettier

## Structure

- `src/app`: App Router routes, layouts, loading states, and error boundaries.
- `src/components`: Reusable accessible UI and application shell components.
- `src/domain`: Business rules and domain modules. React components should not own business logic.
- `src/env`: Environment-variable validation.
- `src/lib`: Infrastructure utilities such as Prisma client creation.
- `src/auth`: Auth.js provider configuration, app auth adapter, role checks, and route policy.
- `src/server`: Server-side persistence/repository helpers.
- `prisma`: Database schema and migrations.
- `tests`: End-to-end tests.

## Server and Client Boundary

Correct answers, explanations, and essay sample answers must remain server-side until submission is complete. Future APIs should enforce this through response DTOs, not only UI hiding.

Authentication and authorization checks must run server-side. Hidden navigation links are only presentation and are never sufficient authorization.

## Database

The Prisma schema defines Auth.js account/session tables, app-owned users/roles, learner profiles, exam configuration, taxonomy, rule versions, question and essay versions, podcast metadata, content licenses/sources, import jobs, content reviews, user reports, and audit logs. It deliberately stores identifiers, settings, labels, demo placeholders, and status fields only, not third-party legal content.

All future migrations must be explained in plain language before they are applied.
