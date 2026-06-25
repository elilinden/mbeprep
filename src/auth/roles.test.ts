import { describe, expect, it } from "vitest";

import {
  canAccessAdmin,
  hasAtLeastRole,
  hasRole,
  normalizeRoles,
} from "./roles";
import { isAdminRoute, isAuthenticatedRoute } from "./route-policy";

describe("authorization roles", () => {
  it.each([
    ["STUDENT", false],
    ["EDITOR", false],
    ["REVIEWER", false],
    ["ADMIN", true],
  ] as const)("checks admin access for %s", (role, expected) => {
    expect(canAccessAdmin([role])).toBe(expected);
  });

  it("checks exact and ranked role access", () => {
    expect(hasRole(["EDITOR"], "EDITOR")).toBe(true);
    expect(hasRole(["EDITOR"], "ADMIN")).toBe(false);
    expect(hasAtLeastRole(["REVIEWER"], "EDITOR")).toBe(true);
    expect(hasAtLeastRole(["STUDENT"], "REVIEWER")).toBe(false);
  });

  it("filters unknown roles from sessions", () => {
    expect(normalizeRoles(["STUDENT", "OWNER", "ADMIN"])).toEqual([
      "STUDENT",
      "ADMIN",
    ]);
  });
});

describe("route authorization policy", () => {
  it("identifies authenticated route prefixes", () => {
    expect(isAuthenticatedRoute("/dashboard")).toBe(true);
    expect(isAuthenticatedRoute("/practice/questions")).toBe(true);
    expect(isAuthenticatedRoute("/login")).toBe(false);
  });

  it("identifies admin routes", () => {
    expect(isAdminRoute("/admin")).toBe(true);
    expect(isAdminRoute("/admin/content")).toBe(true);
    expect(isAdminRoute("/dashboard")).toBe(false);
  });
});
