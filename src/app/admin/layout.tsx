import type { ReactNode } from "react";

import { requireAdmin } from "@/auth/app-auth";
import { AdminNavigationShell } from "@/components/shell/shell-navigation";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex gap-6">
      <AdminNavigationShell />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
