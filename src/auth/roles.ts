export const USER_ROLES = ["STUDENT", "EDITOR", "REVIEWER", "ADMIN"] as const;

export type AppRole = (typeof USER_ROLES)[number];

const roleRank: Record<AppRole, number> = {
  STUDENT: 1,
  EDITOR: 2,
  REVIEWER: 3,
  ADMIN: 4,
};

export function hasRole(
  roles: readonly string[] | null | undefined,
  requiredRole: AppRole,
) {
  return roles?.includes(requiredRole) ?? false;
}

export function hasAtLeastRole(
  roles: readonly string[] | null | undefined,
  requiredRole: AppRole,
) {
  return (
    roles?.some(
      (role) => isAppRole(role) && roleRank[role] >= roleRank[requiredRole],
    ) ?? false
  );
}

export function canAccessAdmin(roles: readonly string[] | null | undefined) {
  return hasRole(roles, "ADMIN");
}

export function isAppRole(role: string): role is AppRole {
  return USER_ROLES.includes(role as AppRole);
}

export function normalizeRoles(roles: readonly string[] | null | undefined) {
  return roles?.filter(isAppRole) ?? [];
}
