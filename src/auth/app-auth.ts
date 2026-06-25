import { redirect } from "next/navigation";

import { auth } from "../../auth";
import { canAccessAdmin, hasRole, type AppRole } from "./roles";

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireRole(role: AppRole) {
  const user = await requireUser();

  if (!hasRole(user.roles, role)) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireAdmin() {
  const user = await requireUser();

  if (!canAccessAdmin(user.roles)) {
    redirect("/dashboard");
  }

  return user;
}
