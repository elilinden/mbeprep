# Security

## Baseline

- Environment variables are validated at startup through `src/env/server.ts`.
- Prisma is the only database access layer in the foundation.
- Secrets must stay out of source control.
- CI runs type checking, linting, unit tests, and a production build.
- Auth.js handles authentication, with providers hidden behind app-level adapter helpers.
- Development login is disabled in production.
- Authenticated and admin routes require server-side checks.

## Legal Content Safety

- Never send correct answers, explanations, or essay sample answers to the client before submission.
- Do not rely on UI-only hiding for restricted content.
- Do not rely on hidden navigation links for authorization.
- Use server-side domain modules and DTOs to control content release.
- Administrative workflow actions require server-side role checks and cannot rely on UI-only controls.

## Operational Notes

- Add authentication and authorization before implementing learner-specific data features.
- Log administrative and content-review actions through audit events.
- Review any migration that touches learner responses, scoring, or content release.
