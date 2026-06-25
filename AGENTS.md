# Agent Instructions

- Never invent or publish legal content.
- Never copy NCBE, Themis, BARBRI, UWorld, or third-party questions.
- Test fixtures must be labeled `DEMO_NOT_FOR_PUBLICATION`.
- Correct answers and explanations must never be sent to the client before submission.
- Essay sample answers must never be sent before submission.
- All substantive legal content requires an approved reviewer.
- TypeScript must remain in strict mode.
- Business logic belongs in domain modules, not React components.
- Run relevant tests before declaring work complete.
- Avoid unrelated refactors.
- Explain all database migrations.

## Engineering Notes

- Keep legal-content handling server-side until a learner submits an answer.
- Prefer small domain modules under `src/domain` for scoring, planning, mastery, content policy, and session behavior.
- Keep React components focused on rendering and interaction state.
- Label all demos, tests, and seed data with `DEMO_NOT_FOR_PUBLICATION`.
