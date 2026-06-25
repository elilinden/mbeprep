"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/auth/app-auth";
import {
  parseOnboardingForm,
  resolveTrackForOnboarding,
} from "@/domain/onboarding";
import { env } from "@/env/server";
import { listExamVersionConfigs } from "@/server/exam-config-repository";
import { saveLearnerOnboarding } from "@/server/onboarding-repository";
import { rebuildStudyPlanAfterOnboarding } from "@/server/study-plan-memory-store";

export async function resolveTrackAction(formData: FormData) {
  await requireUser();
  const jurisdiction = String(formData.get("jurisdiction") ?? "").trim();
  const examDate = String(formData.get("examDate") ?? "").trim();

  if (!jurisdiction || !examDate) {
    redirect("/onboarding");
  }

  redirect(
    `/onboarding?jurisdiction=${encodeURIComponent(jurisdiction)}&examDate=${encodeURIComponent(examDate)}`,
  );
}

export async function saveOnboardingAction(formData: FormData) {
  const user = await requireUser();
  const settings = parseOnboardingForm(formData, {
    minExtendedTimeMultiplier: env.ONBOARDING_EXTENDED_TIME_MULTIPLIER_MIN,
    maxExtendedTimeMultiplier: env.ONBOARDING_EXTENDED_TIME_MULTIPLIER_MAX,
    today: new Date(),
  });
  const configs = await listExamVersionConfigs();
  const resolved = resolveTrackForOnboarding(
    configs,
    settings.jurisdiction,
    settings.examDate,
  );

  if (
    !resolved ||
    resolved.id !== settings.selectedExamVersionId ||
    resolved.examTrackCode !== settings.resolvedExamTrackCode
  ) {
    throw new Error(
      "Resolved exam track no longer matches the submitted profile.",
    );
  }

  await saveLearnerOnboarding(user.id, settings);
  await rebuildStudyPlanAfterOnboarding(user.id);
  redirect("/dashboard");
}
