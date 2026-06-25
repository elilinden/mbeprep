import type { AppRole } from "./roles";

export function parseAdminEmails(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function resolveProductionRolesForEmail(
  email: string | null | undefined,
  adminEmails: string | undefined,
): AppRole[] {
  const normalizedEmail = email?.trim().toLowerCase();

  if (normalizedEmail && parseAdminEmails(adminEmails).has(normalizedEmail)) {
    return ["ADMIN"];
  }

  return ["STUDENT"];
}

