import { ListChecks, SlidersHorizontal } from "lucide-react";
import { randomUUID } from "node:crypto";

import { requireUser } from "@/auth/app-auth";
import { OnboardingRequired } from "@/components/onboarding/onboarding-required";
import { EmptyState } from "@/components/ui/empty-state";
import { getLearnerProfile } from "@/server/onboarding-repository";
import { listAvailablePracticeMetadata } from "@/server/practice-memory-store";

import { PracticeBuilderForm } from "./practice-builder-form";

export default async function PracticeQuestionsPage() {
  const user = await requireUser();
  const profile = await getLearnerProfile(user.id);
  if (!profile?.onboardingCompletedAt) {
    return <OnboardingRequired currentStep="practice" />;
  }
  if (!profile.resolvedExamTrackCode) {
    return <OnboardingRequired currentStep="practice" />;
  }

  const metadata = listAvailablePracticeMetadata(profile.resolvedExamTrackCode);
  const startIntentId = randomUUID();

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <ListChecks aria-hidden="true" className="size-5 text-emerald-700" />
          <div>
            <p className="text-sm font-medium text-emerald-700">Practice</p>
            <h1 className="text-2xl font-semibold text-stone-950">
              Question Practice
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          Build a secure session for your confirmed exam track. Correct
          answers, explanations, and scoring rubrics stay server-side until
          after submission.
        </p>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <SlidersHorizontal
            aria-hidden="true"
            className="size-5 text-emerald-700"
          />
          <h2 className="text-lg font-semibold text-stone-950">
            Custom Builder
          </h2>
        </div>
        {metadata.subjects.length > 0 ? (
          <PracticeBuilderForm
            examTrack={profile.resolvedExamTrackCode}
            metadata={metadata}
            startIntentId={startIntentId}
          />
        ) : (
          <EmptyState
            description="No reviewed questions are available for your confirmed exam track yet. Adjust onboarding only if your exam track is wrong."
            icon={ListChecks}
            title="No questions"
          />
        )}
      </section>
    </div>
  );
}
