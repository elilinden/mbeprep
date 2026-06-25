import { describe, expect, it } from "vitest";

import {
  parseAdminEmails,
  resolveProductionRolesForEmail,
} from "./production-roles";

describe("production auth role assignment", () => {
  it("normalizes administrator email allowlists", () => {
    expect(
      parseAdminEmails(" Admin@Example.com, reviewer@example.com ,, "),
    ).toEqual(new Set(["admin@example.com", "reviewer@example.com"]));
  });

  it("assigns admin only to configured emails", () => {
    expect(
      resolveProductionRolesForEmail(
        "Admin@Example.com",
        "admin@example.com",
      ),
    ).toEqual(["ADMIN"]);
  });

  it("assigns student to ordinary production sign-ins", () => {
    expect(
      resolveProductionRolesForEmail("learner@example.com", "admin@example.com"),
    ).toEqual(["STUDENT"]);
  });
});
