import { redirect } from "next/navigation";

import { getLearnerProfile } from "@/server/onboarding-repository";

export async function requireCompletedOnboarding(userId: string) {
  const profile = await getLearnerProfile(userId);

  if (!profile?.onboardingCompletedAt) {
    redirect("/onboarding");
  }

  return profile;
}
