# Content

## Content Policy

- Never invent or publish legal content.
- Never copy NCBE, Themis, BARBRI, UWorld, or third-party questions.
- All substantive legal content requires an approved reviewer.
- Test fixtures must be labeled `DEMO_NOT_FOR_PUBLICATION`.

## Delivery Rules

- Correct answers and explanations must never be sent to the client before submission.
- Essay sample answers must never be sent before submission.
- Client-side code may display placeholder states, progress, and learner-owned responses.
- Server-side code must decide what content is eligible for release.

## Administrative Workflow

Administrative content records move through `DRAFT`, `LEGAL_REVIEW`, `EDITORIAL_REVIEW`, `APPROVED`, `PUBLISHED`, and `RETIRED`.

- Editors may prepare drafts and request legal review.
- Reviewers may perform legal review.
- Editors or administrators may perform editorial approval.
- Administrators publish and retire content.
- When two-person review is configured, the same person cannot author and complete every approval step.
- Import previews must reject invalid rows before persistence and produce an error report.
- Demonstration fixtures must remain labeled `DEMO_NOT_FOR_PUBLICATION`.

## Original Audited MBE-Style Imports

Batch imports under `data/import/` must contain only original practice-question drafts. Batch 003 is imported with:

```bash
npm run content:import -- data/import/mbe_original_question_bank_batch_003_audited.json
```

The import must preserve source, license, taxonomy, authoring, audit, residual-risk, reviewer-flag, answer-choice, rationale, and distractor metadata. Every imported question version must remain unpublished with `LEGAL_REVIEW` status and `publishable: false` until independent legal and editorial approvals are complete. Imported original questions appear only in the server-authorized admin workflow before publication.

## Placeholder Data

This foundation includes no substantive legal content. Future demo records must carry the `DEMO_NOT_FOR_PUBLICATION` label.

## Seed Taxonomy Labels

The seed data may create labels only. These labels are taxonomy scaffolding, not rule statements, questions, prompts, explanations, or copyrighted outline text.

### MBE Subjects

- Civil Procedure
- Constitutional Law
- Contracts
- Criminal Law and Procedure
- Evidence
- Real Property
- Torts

### MBE Categories

- Civil Procedure: Jurisdiction and venue
- Civil Procedure: Law applied by federal courts
- Civil Procedure: Pretrial procedures
- Civil Procedure: Jury trials
- Civil Procedure: Motions
- Civil Procedure: Verdicts, judgments, and appeals
- Constitutional Law: Judicial review
- Constitutional Law: Separation of powers
- Constitutional Law: Federalism
- Constitutional Law: Individual rights
- Contracts: Formation
- Contracts: Defenses to enforceability
- Contracts: Contract content and meaning
- Contracts: Performance, breach, and discharge
- Contracts: Remedies
- Contracts: Third-party rights
- Criminal Law and Procedure: Homicide
- Criminal Law and Procedure: Other crimes
- Criminal Law and Procedure: Inchoate offenses
- Criminal Law and Procedure: Parties
- Criminal Law and Procedure: Defenses
- Criminal Law and Procedure: Constitutional protections for accused persons
- Evidence: Presentation of evidence
- Evidence: Relevance and exclusion
- Evidence: Privileges
- Evidence: Writings, recordings, and photographs
- Real Property: Ownership
- Real Property: Rights in land
- Real Property: Real estate contracts
- Real Property: Mortgages and security devices
- Real Property: Titles
- Torts: Intentional torts
- Torts: Negligence
- Torts: Strict liability
- Torts: Products liability
- Torts: Other torts

### Legacy MEE Subjects Beginning July 2026

- Business Associations
- Civil Procedure
- Constitutional Law
- Contracts
- Criminal Law and Procedure
- Evidence
- Real Property
- Torts

### Empty NextGen Skill Categories

- NextGen Skill Category 01
- NextGen Skill Category 02
- NextGen Skill Category 03
- NextGen Skill Category 04
- NextGen Skill Category 05
