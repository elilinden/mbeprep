export const DEMO_CLASSIFICATION = "DEMO_NOT_FOR_PUBLICATION";

export const MBE_SUBJECTS = [
  "Civil Procedure",
  "Constitutional Law",
  "Contracts",
  "Criminal Law and Procedure",
  "Evidence",
  "Real Property",
  "Torts",
] as const;

export const MBE_CATEGORIES_BY_SUBJECT = {
  "Civil Procedure": [
    "Jurisdiction and venue",
    "Law applied by federal courts",
    "Pretrial procedures",
    "Jury trials",
    "Motions",
    "Verdicts, judgments, and appeals",
  ],
  "Constitutional Law": [
    "Judicial review",
    "Separation of powers",
    "Federalism",
    "Individual rights",
  ],
  Contracts: [
    "Formation",
    "Defenses to enforceability",
    "Contract content and meaning",
    "Performance, breach, and discharge",
    "Remedies",
    "Third-party rights",
  ],
  "Criminal Law and Procedure": [
    "Homicide",
    "Other crimes",
    "Inchoate offenses",
    "Parties",
    "Defenses",
    "Constitutional protections for accused persons",
  ],
  Evidence: [
    "Presentation of evidence",
    "Relevance and exclusion",
    "Privileges",
    "Writings, recordings, and photographs",
  ],
  "Real Property": [
    "Ownership",
    "Rights in land",
    "Real estate contracts",
    "Mortgages and security devices",
    "Titles",
  ],
  Torts: [
    "Intentional torts",
    "Negligence",
    "Strict liability",
    "Products liability",
    "Other torts",
  ],
} as const satisfies Record<(typeof MBE_SUBJECTS)[number], readonly string[]>;

export const LEGACY_MEE_SUBJECTS_BEGINNING_JULY_2026 = [
  "Business Associations",
  "Civil Procedure",
  "Constitutional Law",
  "Contracts",
  "Criminal Law and Procedure",
  "Evidence",
  "Real Property",
  "Torts",
] as const;

export const NEXTGEN_SKILL_CATEGORY_LABELS = [
  "NextGen Skill Category 01",
  "NextGen Skill Category 02",
  "NextGen Skill Category 03",
  "NextGen Skill Category 04",
  "NextGen Skill Category 05",
] as const;

export const DEVELOPMENT_USERS = {
  admin: {
    email: "dev-admin@example.test",
    displayName: "Development Administrator",
  },
  learner: {
    email: "dev-learner@example.test",
    displayName: "Development Learner",
  },
} as const;

export function slugifyLabel(label: string) {
  return label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
