"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Route } from "next";

import { requireUser } from "@/auth/app-auth";
import type { AttemptConfidence, MistakeTag } from "@/domain/practice-types";
import { getErrorMessage } from "@/lib/database-errors";
import {
  addMistakeTagForUser,
  addQuestionNoteForUser,
  setQuestionFlagForUser,
  startLearnerPracticeSession,
  submitPracticeAnswerForUser,
  toggleBookmarkForUser,
  toggleStrikeForUser,
} from "@/server/practice-memory-store";
import { requireCompletedOnboarding } from "@/server/onboarding-access";

export type PracticeStartState = {
  error?: string;
};

export async function createPracticeSessionAction(formData: FormData) {
  const sessionPath = await startPracticeSessionFromForm(formData);

  redirect(sessionPath);
}

export async function createPracticeSessionWithStateAction(
  _previousState: PracticeStartState,
  formData: FormData,
): Promise<PracticeStartState> {
  const user = await requireUser();
  const profile = await requireCompletedOnboarding(user.id);
  let sessionPath: Route;

  try {
    sessionPath = createPracticeSessionPathFromForm({
      formData,
      userId: user.id,
      learnerExamTrack: profile.resolvedExamTrackCode,
    });
  } catch (error) {
    return {
      error: getPracticeStartErrorMessage(error),
    };
  }

  redirect(sessionPath);
}

async function startPracticeSessionFromForm(formData: FormData) {
  const user = await requireUser();
  const profile = await requireCompletedOnboarding(user.id);
  return createPracticeSessionPathFromForm({
    formData,
    userId: user.id,
    learnerExamTrack: profile.resolvedExamTrackCode,
  });
}

function createPracticeSessionPathFromForm(input: {
  formData: FormData;
  userId: string;
  learnerExamTrack?: Parameters<
    typeof startLearnerPracticeSession
  >[0]["learnerExamTrack"];
}) {
  const { formData } = input;
  const session = startLearnerPracticeSession({
    userId: input.userId,
    learnerExamTrack: input.learnerExamTrack,
    idempotencyKey: optionalString(formData.get("startIntentId")),
    filters: {
      mode: String(formData.get("mode") ?? "LEARNING") as never,
      examTrack: optionalString(formData.get("examTrack")) as never,
      subject: optionalString(formData.get("subject")),
      category: optionalString(formData.get("category")),
      subtopic: optionalString(formData.get("subtopic")),
      questionCount: Number(formData.get("questionCount") ?? "1"),
      difficulty: optionalString(formData.get("difficulty")) as never,
      unseen: formData.get("unseen") === "on",
      incorrect: formData.get("incorrect") === "on",
      bookmarked: formData.get("bookmarked") === "on",
      timingMode: String(formData.get("timingMode") ?? "UNTIMED") as never,
      feedbackMode: String(
        formData.get("feedbackMode") ?? "END_OF_SET",
      ) as never,
      topicPriority: optionalString(formData.get("subtopic"))
        ? [String(formData.get("subtopic"))]
        : [],
    },
  });

  return `/practice/questions/${session.id}` as Route;
}

export async function submitPracticeAnswerAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  const sessionId = String(formData.get("sessionId") ?? "");
  const result = submitPracticeAnswerForUser({
    sessionId,
    userId: user.id,
    sessionQuestionId: String(formData.get("sessionQuestionId") ?? ""),
    selectedChoiceIds: formData.getAll("choiceId").map(String),
    writtenResponses: getWrittenResponses(formData),
    responseTimeMs: Number(formData.get("responseTimeMs") ?? "0"),
    confidence: optionalString(formData.get("confidence")) as
      | AttemptConfidence
      | undefined,
    answerChanges: Number(formData.get("answerChanges") ?? "0"),
    idempotencyKey: String(formData.get("idempotencyKey") ?? ""),
  });
  const submittedPosition = Number(formData.get("position") ?? "0");
  const targetPosition =
    result.session.feedbackMode === "IMMEDIATE"
      ? submittedPosition
      : result.session.currentQuestionIndex;
  const query = new URLSearchParams({
    position: String(targetPosition),
  });

  if (result.duplicate) {
    query.set("duplicate", "1");
  }

  revalidatePath(`/practice/questions/${sessionId}`);
  redirect(`/practice/questions/${sessionId}?${query.toString()}` as Route);
}

export async function flagPracticeQuestionAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  const sessionId = String(formData.get("sessionId") ?? "");
  setQuestionFlagForUser({
    sessionId,
    userId: user.id,
    sessionQuestionId: String(formData.get("sessionQuestionId") ?? ""),
    flagged: formData.get("flagged") !== "true",
  });
  revalidatePath(`/practice/questions/${sessionId}`);
}

export async function toggleStrikeChoiceAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  const sessionId = String(formData.get("sessionId") ?? "");
  toggleStrikeForUser({
    sessionId,
    userId: user.id,
    sessionQuestionId: String(formData.get("sessionQuestionId") ?? ""),
    choiceId: String(formData.get("choiceId") ?? ""),
  });
  revalidatePath(`/practice/questions/${sessionId}`);
}

export async function toggleQuestionBookmarkAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  const sessionId = String(formData.get("sessionId") ?? "");
  toggleBookmarkForUser({
    sessionId,
    userId: user.id,
    questionVersionId: String(formData.get("questionVersionId") ?? ""),
  });
  revalidatePath(`/practice/questions/${sessionId}`);
  revalidatePath(`/practice/questions/${sessionId}/review`);
}

export async function addQuestionNoteAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  const sessionId = String(formData.get("sessionId") ?? "");
  addQuestionNoteForUser({
    sessionId,
    userId: user.id,
    questionVersionId: String(formData.get("questionVersionId") ?? ""),
    body: String(formData.get("body") ?? ""),
  });
  revalidatePath(`/practice/questions/${sessionId}`);
}

export async function addMistakeTagAction(formData: FormData) {
  const user = await requireUser();
  await requireCompletedOnboarding(user.id);
  const sessionId = String(formData.get("sessionId") ?? "");
  addMistakeTagForUser({
    sessionId,
    userId: user.id,
    attemptId: String(formData.get("attemptId") ?? ""),
    tag: String(formData.get("tag") ?? "CONTENT_GAP") as MistakeTag,
  });
  revalidatePath(`/practice/questions/${sessionId}/review`);
}

function optionalString(value: FormDataEntryValue | null) {
  const stringValue = typeof value === "string" ? value.trim() : "";
  return stringValue ? stringValue : undefined;
}

function getPracticeStartErrorMessage(error: unknown) {
  const message = getErrorMessage(error);

  if (
    message.includes("No questions are available") ||
    message.includes("Complete onboarding") ||
    message.includes("exam track")
  ) {
    return message;
  }

  return "Practice could not be created. Check the filters and try again.";
}

function getWrittenResponses(formData: FormData) {
  const responses: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("writtenResponse.") || typeof value !== "string") {
      continue;
    }

    const responseAreaId = key.slice("writtenResponse.".length);
    if (responseAreaId) {
      responses[responseAreaId] = value.trim();
    }
  }

  return responses;
}
