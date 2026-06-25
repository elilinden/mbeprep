import type { ReactNode } from "react";

import { getCurrentUser } from "@/auth/app-auth";
import { canAccessAdmin } from "@/auth/roles";
import { GlobalHeader } from "@/components/shell/shell-navigation";
import { getLearnerProfile } from "@/server/onboarding-repository";

type AppShellProps = {
  children: ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const user = await getCurrentUser();
  const hasAdminAccess = canAccessAdmin(user?.roles);
  const profile = user ? await getLearnerProfile(user.id) : null;
  const onboardingComplete = Boolean(profile?.onboardingCompletedAt);

  return (
    <div className="min-h-dvh overflow-x-clip bg-stone-50 text-stone-950">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-stone-950 focus:shadow focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:ring-offset-2"
        href="#main-content"
      >
        Skip to main content
      </a>
      <GlobalHeader
        hasAdminAccess={hasAdminAccess}
        isAuthenticated={Boolean(user)}
        onboardingComplete={onboardingComplete}
        user={
          user
            ? {
                email: user.email,
                name: user.name,
              }
            : null
        }
      />
      <main
        className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        id="main-content"
      >
        {children}
      </main>
    </div>
  );
}
