import { notFound } from "next/navigation";

import { requireUser } from "@/auth/app-auth";
import { OnboardingRequired } from "@/components/onboarding/onboarding-required";
import { getSafeEssayWorkspaceForUser } from "@/server/essay-memory-store";
import { getLearnerProfile } from "@/server/onboarding-repository";

import { autosaveEssayAction, submitEssayAction } from "../actions";
import { EssayWorkspaceClient } from "./essay-workspace-client";

type EssayAttemptPageProps = {
  params: Promise<{ attemptId: string }>;
  searchParams?: Promise<{ saved?: string }>;
};

export default async function EssayAttemptPage({
  params,
  searchParams,
}: EssayAttemptPageProps) {
  const user = await requireUser();
  const profile = await getLearnerProfile(user.id);
  if (!profile?.onboardingCompletedAt) {
    return <OnboardingRequired currentStep="essays" />;
  }

  const { attemptId } = await params;
  const query = await searchParams;
  const workspace = getSafeEssayWorkspaceForUser({
    attemptId,
    userId: user.id,
  });

  if (!workspace) {
    notFound();
  }

  return (
    <EssayWorkspaceClient
      autosaveAction={autosaveEssayAction}
      saved={query?.saved === "1"}
      submitAction={submitEssayAction}
      workspace={workspace}
    />
  );
}
