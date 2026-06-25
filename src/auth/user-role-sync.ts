import { env } from "@/env/server";
import { prisma } from "@/lib/prisma";
import { UserRoleCode } from "@/generated/prisma/client";

import { findDevelopmentUser } from "./dev-users";
import { resolveProductionRolesForEmail } from "./production-roles";
import { normalizeRoles, type AppRole } from "./roles";

const appRoleToUserRoleCode: Record<AppRole, UserRoleCode> = {
  STUDENT: UserRoleCode.STUDENT,
  EDITOR: UserRoleCode.EDITOR,
  REVIEWER: UserRoleCode.REVIEWER,
  ADMIN: UserRoleCode.ADMIN,
};

export async function resolveRolesForAuthenticatedUser(input: {
  userId: string;
  email?: string | null;
  sessionRoles?: readonly string[] | null;
}) {
  const existingRoles = await prisma.userRole.findMany({
    where: {
      userId: input.userId,
      status: "ACTIVE",
    },
    select: {
      role: true,
    },
  });

  if (existingRoles.length > 0) {
    return normalizeRoles(existingRoles.map((item) => item.role));
  }

  const fallbackRoles = resolveFallbackRoles(input.email, input.sessionRoles);

  if (fallbackRoles.length === 0) {
    return fallbackRoles;
  }

  await prisma.userRole.createMany({
    data: fallbackRoles.map((role) => ({
      userId: input.userId,
      role: appRoleToUserRoleCode[role],
    })),
    skipDuplicates: true,
  });

  return fallbackRoles;
}

function resolveFallbackRoles(
  email: string | null | undefined,
  sessionRoles: readonly string[] | null | undefined,
) {
  if (env.NODE_ENV === "production") {
    return resolveProductionRolesForEmail(email, env.ADMIN_EMAILS);
  }

  const developmentUser = email ? findDevelopmentUser(email) : null;
  return normalizeRoles(sessionRoles ?? developmentUser?.roles);
}

