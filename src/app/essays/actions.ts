"use server";

import type { Route } from "next";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/auth/app-auth";
import { getErrorMessage } from "@/lib/database-errors";
import { requireCompletedOnboarding } from "@/server/onboarding-access";
import {
  autosaveEssayForUser,
  startEssayAttemptForUser,
  submitEssayForUser,
  submitEssaySelfAssessmentForUser,
} from "@/server/essay-memory-store";

export type EssayStartState = {
  error?: string;
};

export async function startEssayAttemptAction(formData: FormData) {
  const attemptPath = await startEssayAttemptFromForm(formData);

  redirect(attemptPath);
}

export async function startEssayAttemptWithStateAction(
  _previousState: EssayStartState,
  formData: FormData,
): Promise<EssayStartState> {
  const user = await requireUser();
  const profile = await requireCompletedOnboarding(user.id);
  let attemptPath: Route;

  try {
    attemptPath = createEssayAttemptPathFromForm({
      formData,
      userId: user.id,
      extendedTimeMultiplier: profile.extendedTimeMultiplier ?? 1,
    });
  } catch (error) {
    return {
      error: getEssayStartErrorMessage(error),
    };
  }

  redirect(attemptPath);
}

async function startEssayAttemptFromForm(formData: FormData) {
  const user = await requireUser();
  const profile = await requireCompletedOnboarding(user.id);
  return createEssayAttemptPathFromForm({
    formData,
    userId: user.id,
    extendedTimeMultiplier: profile?.extendedTimeMultiplier ?? 1,
  });
}

function createEssayAttemptPathFromForm(input: {
  formData: FormData;
  userId: string;
  extendedTimeMultiplier: number;
}) {
  const attempt = startEssayAttemptForUser({
    userId: input.userId,
    essayVersionId: String(input.formData.get("essayVersionId") ?? ""),
    extendedTimeMultiplier: input.extendedTimeMultiplier,
    idempotencyKey: optionalString(input.formData.get("startIntentId")),
  });

  return `/essays/${attempt.id}` as Route;
}

export async function autosaveEssayAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  const attemptId = String(formData.get("attemptId") ?? "");
  autosaveEssayForUser({
    attemptId,
    userId: user.id,
    outline: String(formData.get("outline") ?? ""),
    answer: String(formData.get("answer") ?? ""),
    clientSavedAt: optionalDate(formData.get("clientSavedAt")),
  });
  revalidatePath(`/essays/${attemptId}`);
  redirect(`/essays/${attemptId}?saved=1` as Route);
}

export async function submitEssayAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  const attemptId = String(formData.get("attemptId") ?? "");
  const result = submitEssayForUser({
    attemptId,
    userId: user.id,
    outline: String(formData.get("outline") ?? ""),
    answer: String(formData.get("answer") ?? ""),
    idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
  });
  const query = result.duplicate ? "?duplicate=1" : "";

  revalidatePath(`/essays/${attemptId}`);
  redirect(`/essays/${attemptId}/review${query}` as Route);
}

export async function submitEssaySelfAssessmentAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  const attemptId = String(formData.get("attemptId") ?? "");
  submitEssaySelfAssessmentForUser({
    attemptId,
    userId: user.id,
    missedRubricItemIds: formData.getAll("missedRubricItemId").map(String),
    notes: optionalString(formData.get("notes")),
  });

  revalidatePath(`/essays/${attemptId}/review`);
  revalidatePath("/analytics");
  redirect(`/essays/${attemptId}/review?assessed=1` as Route);
}

function optionalString(value: FormDataEntryValue | null) {
  const stringValue = typeof value === "string" ? value.trim() : "";
  return stringValue || undefined;
}

function getEssayStartErrorMessage(error: unknown) {
  const message = getErrorMessage(error);

  if (
    message.includes("Essay fixture") ||
    message.includes("Extended-time multiplier")
  ) {
    return message;
  }

  return "Writing workspace could not be opened. Try again.";
}

function optionalDate(value: FormDataEntryValue | null) {
  const stringValue = optionalString(value);

  if (!stringValue) {
    return undefined;
  }

  const date = new Date(stringValue);
  return Number.isNaN(date.getTime()) ? undefined : date;
}
