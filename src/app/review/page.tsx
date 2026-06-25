import { Gauge } from "lucide-react";

import { requireUser } from "@/auth/app-auth";
import { OnboardingRequired } from "@/components/onboarding/onboarding-required";
import { PlaceholderPage } from "@/components/shell/placeholder-page";
import { getLearnerProfile } from "@/server/onboarding-repository";

export default async function ReviewPage() {
  const user = await requireUser();
  const profile = await getLearnerProfile(user.id);
  if (!profile?.onboardingCompletedAt) {
    return <OnboardingRequired currentStep="practice" />;
  }

  return (
    <PlaceholderPage
      description="Review items appear after practice, essays, or rule review dates create work to revisit."
      icon={Gauge}
      status="No review items are due for this learner."
      title="Review"
    />
  );
}
