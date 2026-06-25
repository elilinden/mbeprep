import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import {
  Bookmark,
  CheckCircle2,
  Clock,
  FileText,
  Flag,
  Keyboard,
  StickyNote,
} from "lucide-react";

import { requireUser } from "@/auth/app-auth";
import { OnboardingRequired } from "@/components/onboarding/onboarding-required";
import { Button } from "@/components/ui/button";
import { buildQuestionExplanation } from "@/domain/practice-engine";
import type { SafePracticeQuestion } from "@/domain/practice-types";
import { getLearnerProfile } from "@/server/onboarding-repository";
import { getPracticeQuestionView } from "@/server/practice-memory-store";

import {
  addQuestionNoteAction,
  flagPracticeQuestionAction,
  submitPracticeAnswerAction,
  toggleQuestionBookmarkAction,
  toggleStrikeChoiceAction,
} from "../actions";

type SessionPageProps = {
  params: Promise<{ sessionId: string }>;
  searchParams?: Promise<{ position?: string; duplicate?: string }>;
};

export default async function PracticeSessionPage({
  params,
  searchParams,
}: SessionPageProps) {
  const user = await requireUser();
  const profile = await getLearnerProfile(user.id);
  if (!profile?.onboardingCompletedAt) {
    return <OnboardingRequired currentStep="practice" />;
  }

  const { sessionId } = await params;
  const query = await searchParams;
  const view = getPracticeQuestionView({
    sessionId,
    userId: user.id,
    position: Number(query?.position ?? "0"),
  });

  if (!view) {
    notFound();
  }

  const { session, safeQuestion, attempt, explanation } = view;
  const selectedChoice = attempt?.selectedChoiceIds[0] ?? "";
  const progressText = `Question ${safeQuestion.position + 1} of ${safeQuestion.totalQuestions}`;
  const timerText = safeQuestion.setLevelTimingSeconds
    ? `${safeQuestion.setLevelTimingSeconds} seconds set timer`
    : safeQuestion.timingMode === "TIMED"
      ? `${safeQuestion.estimatedSeconds} seconds target`
      : "Untimed";
  const isSelectTwo = safeQuestion.format === "SELECT_TWO";
  const isChoiceQuestion = safeQuestion.choices.length > 0;

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-stone-200 bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              {safeQuestion.mode} mode
            </p>
            <h1 className="text-2xl font-semibold text-stone-950">
              {progressText}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-stone-600">
            <span className="inline-flex min-h-9 items-center gap-2 rounded-md border border-stone-300 px-3">
              <Clock aria-hidden="true" className="size-4" />
              {timerText}
            </span>
            <Link
              className="inline-flex min-h-9 items-center justify-center rounded-md border border-stone-300 px-3 text-sm font-medium"
              href={`/practice/questions/${session.id}/review` as Route}
            >
              Review session
            </Link>
          </div>
        </div>
        {query?.duplicate === "1" ? (
          <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Duplicate submission ignored. The original attempt is still the
            recorded answer.
          </p>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <article className="rounded-lg border border-stone-200 bg-white p-6">
          <div className="flex flex-wrap gap-2 text-xs font-medium text-stone-500">
            <span>{safeQuestion.examTrack}</span>
            <span>{safeQuestion.format.replaceAll("_", " ")}</span>
            <span>{safeQuestion.subject}</span>
            <span>{safeQuestion.category}</span>
            <span>{safeQuestion.difficulty}</span>
          </div>
          {safeQuestion.commonFactScenario ? (
            <div className="mt-5 rounded-md border border-stone-200 bg-stone-50 p-4">
              <p className="text-sm font-semibold text-stone-950">
                Common Fact Scenario
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-700">
                {safeQuestion.commonFactScenario}
              </p>
            </div>
          ) : null}
          <p className="mt-5 text-base leading-7 text-stone-800">
            {safeQuestion.stem}
          </p>
          <p className="mt-4 font-semibold text-stone-950">
            {safeQuestion.callOfQuestion}
          </p>
          <NextGenResources question={safeQuestion} />

          <form action={submitPracticeAnswerAction} className="mt-5 space-y-4">
            <input name="sessionId" type="hidden" value={session.id} />
            <input
              name="sessionQuestionId"
              type="hidden"
              value={safeQuestion.sessionQuestionId}
            />
            <input
              name="position"
              type="hidden"
              value={safeQuestion.position}
            />
            <input
              name="idempotencyKey"
              type="hidden"
              value={`${session.id}-${safeQuestion.sessionQuestionId}`}
            />
            <input
              name="responseTimeMs"
              type="hidden"
              value={safeQuestion.estimatedSeconds * 1000}
            />
            {isChoiceQuestion ? (
              <fieldset className="space-y-3">
                <legend className="sr-only">Answer choices</legend>
                {isSelectTwo ? (
                  <p className="text-sm font-medium text-stone-700">
                    Select exactly two choices.
                  </p>
                ) : null}
                {safeQuestion.choices.map((choice, index) => (
                  <label
                    className="flex min-h-14 items-start gap-3 rounded-md border border-stone-300 p-3 text-sm text-stone-800 focus-within:ring-2 focus-within:ring-emerald-700"
                    key={choice.id}
                  >
                    <input
                      aria-label={`Choice ${choice.label}`}
                      className="mt-1"
                      defaultChecked={
                        attempt?.selectedChoiceIds.includes(choice.id) ??
                        selectedChoice === choice.id
                      }
                      disabled={Boolean(attempt)}
                      name="choiceId"
                      type={isSelectTwo ? "checkbox" : "radio"}
                      value={choice.id}
                    />
                    <span className={choice.struck ? "line-through" : ""}>
                      <span className="font-semibold">{choice.label}.</span>{" "}
                      {choice.text}
                    </span>
                    <span className="ml-auto text-xs text-stone-500">
                      {index + 1}
                    </span>
                  </label>
                ))}
              </fieldset>
            ) : null}
            {safeQuestion.responseAreas.length > 0 ? (
              <fieldset className="grid gap-4">
                <legend className="sr-only">Written responses</legend>
                {safeQuestion.responseAreas.map((area) => (
                  <label
                    className="grid gap-2 text-sm font-medium text-stone-800"
                    key={area.id}
                  >
                    {area.label}
                    <textarea
                      className="min-h-40 rounded-md border border-stone-300 px-3 py-2 text-sm leading-6"
                      defaultValue={attempt?.writtenResponses[area.id] ?? ""}
                      disabled={Boolean(attempt)}
                      name={`writtenResponse.${area.id}`}
                      placeholder="Type your response"
                    />
                    {area.maxWords ? (
                      <span className="text-xs font-normal text-stone-500">
                        {area.maxWords} word demonstration limit.
                      </span>
                    ) : null}
                  </label>
                ))}
              </fieldset>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-medium text-stone-800">
                Confidence
                <select
                  className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
                  disabled={Boolean(attempt)}
                  name="confidence"
                >
                  <option value="">Select</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-stone-800">
                Answer changes
                <input
                  className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
                  defaultValue="0"
                  disabled={Boolean(attempt)}
                  min="0"
                  name="answerChanges"
                  type="number"
                />
              </label>
            </div>
            <Button disabled={Boolean(attempt)} type="submit">
              Submit answer
            </Button>
          </form>

          {attempt ? (
            <form action={submitPracticeAnswerAction} className="mt-3">
              <input name="sessionId" type="hidden" value={session.id} />
              <input
                name="sessionQuestionId"
                type="hidden"
                value={safeQuestion.sessionQuestionId}
              />
              <input
                name="position"
                type="hidden"
                value={safeQuestion.position}
              />
              <input
                name="idempotencyKey"
                type="hidden"
                value={attempt.idempotencyKey}
              />
              <input
                name="choiceId"
                type="hidden"
                value={attempt.selectedChoiceIds[0]}
              />
              <input name="responseTimeMs" type="hidden" value="1" />
              <input name="answerChanges" type="hidden" value="0" />
              <Button size="sm" type="submit" variant="secondary">
                Submit same answer again
              </Button>
            </form>
          ) : null}
        </article>

        <aside className="space-y-4">
          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="font-semibold text-stone-950">Controls</h2>
            <div className="mt-3 space-y-2">
              <form action={flagPracticeQuestionAction}>
                <input name="sessionId" type="hidden" value={session.id} />
                <input
                  name="sessionQuestionId"
                  type="hidden"
                  value={safeQuestion.sessionQuestionId}
                />
                <input
                  name="flagged"
                  type="hidden"
                  value={String(safeQuestion.flagged)}
                />
                <Button
                  className="w-full justify-start"
                  type="submit"
                  variant="secondary"
                >
                  <Flag aria-hidden="true" className="size-4" />
                  {safeQuestion.flagged ? "Unflag" : "Flag"}
                </Button>
              </form>
              {safeQuestion.choices.map((choice) => (
                <form action={toggleStrikeChoiceAction} key={choice.id}>
                  <input name="sessionId" type="hidden" value={session.id} />
                  <input
                    name="sessionQuestionId"
                    type="hidden"
                    value={safeQuestion.sessionQuestionId}
                  />
                  <input name="choiceId" type="hidden" value={choice.id} />
                  <Button
                    className="w-full justify-start"
                    size="sm"
                    type="submit"
                    variant="ghost"
                  >
                    Strike {choice.label}
                  </Button>
                </form>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <StickyNote
                aria-hidden="true"
                className="size-4 text-emerald-700"
              />
              <h2 className="font-semibold text-stone-950">Notes</h2>
            </div>
            <form action={addQuestionNoteAction} className="mt-3 space-y-3">
              <input name="sessionId" type="hidden" value={session.id} />
              <input
                name="questionVersionId"
                type="hidden"
                value={safeQuestion.questionVersionId}
              />
              <label className="grid gap-2 text-sm font-medium text-stone-800">
                Question note
                <textarea
                  className="min-h-20 rounded-md border border-stone-300 px-3 py-2 text-sm"
                  name="body"
                  placeholder="Add a note"
                />
              </label>
              <Button size="sm" type="submit" variant="secondary">
                Save note
              </Button>
            </form>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <Keyboard
                aria-hidden="true"
                className="size-4 text-emerald-700"
              />
              <h2 className="font-semibold text-stone-950">Keyboard</h2>
            </div>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Tab moves through choices and controls. Space selects a focused
              choice or activates a focused button.
            </p>
          </section>
        </aside>
      </section>

      {attempt ? (
        <section className="rounded-lg border border-stone-200 bg-white p-6">
          <div className="flex items-center gap-2">
            <CheckCircle2
              aria-hidden="true"
              className={
                attempt.isCorrect
                  ? "size-5 text-emerald-700"
                  : "size-5 text-red-700"
              }
            />
            <h2 className="text-lg font-semibold text-stone-950">
              {attempt.isCorrect ? "Correct" : "Incorrect"}
            </h2>
          </div>
          <p className="mt-2 text-sm text-stone-600">
            Score: {attempt.earnedPoints} of {attempt.maxPoints} points on the{" "}
            {attempt.scoreScale.replaceAll("_", " ").toLowerCase()} scale.
          </p>
          {explanation ? (
            <ExplanationView explanation={explanation} />
          ) : (
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Answer saved. Explanations are available at the end of this set.
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2">
            <form action={toggleQuestionBookmarkAction}>
              <input name="sessionId" type="hidden" value={session.id} />
              <input
                name="questionVersionId"
                type="hidden"
                value={safeQuestion.questionVersionId}
              />
              <Button type="submit" variant="secondary">
                <Bookmark aria-hidden="true" className="size-4" />
                Bookmark
              </Button>
            </form>
            <Link
              className="inline-flex min-h-10 items-center justify-center rounded-md border border-stone-300 px-4 text-sm font-medium"
              href={`/practice/questions/${session.id}/review` as Route}
            >
              Review queue
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ExplanationView({
  explanation,
}: {
  explanation: ReturnType<typeof buildQuestionExplanation>;
}) {
  return (
    <div className="mt-4 space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-950">
          Correct answer: {explanation.correctAnswer}
        </p>
        <p className="rounded-md bg-stone-50 p-3 text-sm text-stone-700">
          Related podcast timestamp: {explanation.relatedPodcastTimestamp}
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <InfoBlock label="Tested issue" value={explanation.testedIssue} />
        <InfoBlock label="Governing rule" value={explanation.governingRule} />
        <InfoBlock label="Application" value={explanation.application} />
      </div>
      <div className="space-y-2">
        {explanation.choices.map((choice) => (
          <div
            className="rounded-md border border-stone-200 p-3"
            key={choice.id}
          >
            <p className="text-sm font-semibold text-stone-950">
              {choice.label}. {choice.isCorrect ? "Correct" : "Incorrect"}
            </p>
            <p className="mt-1 text-sm text-stone-600">{choice.rationale}</p>
            <p className="mt-1 text-xs text-stone-500">
              Distractor classification: {choice.distractorType}
            </p>
          </div>
        ))}
      </div>
      <p className="text-sm text-stone-600">
        Related rules: {explanation.relatedRuleIds.join(", ")}. Related
        questions: {explanation.relatedQuestionIds.join(", ") || "None"}.
      </p>
    </div>
  );
}

function NextGenResources({ question }: { question: SafePracticeQuestion }) {
  const resources = [
    ...question.attachedResources,
    ...question.exhibits,
    ...question.performanceTaskLibrary,
  ];

  if (resources.length === 0) {
    return null;
  }

  return (
    <section className="mt-5 grid gap-3 lg:grid-cols-2">
      {resources.map((resource) => (
        <div
          className="rounded-md border border-stone-200 bg-stone-50 p-4"
          key={resource.id}
        >
          <div className="flex items-center gap-2">
            <FileText aria-hidden="true" className="size-4 text-emerald-700" />
            <p className="text-sm font-semibold text-stone-950">
              {resource.title}
            </p>
          </div>
          <p className="mt-1 text-xs font-medium uppercase text-stone-500">
            {resource.resourceType.replaceAll("_", " ")}
          </p>
          {resource.citationLabel ? (
            <p className="mt-2 text-xs text-stone-500">
              {resource.citationLabel}
            </p>
          ) : null}
          <p className="mt-2 text-sm leading-6 text-stone-700">
            {resource.content}
          </p>
        </div>
      ))}
    </section>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-200 p-3">
      <p className="text-xs font-medium uppercase text-stone-500">{label}</p>
      <p className="mt-1 text-sm leading-6 text-stone-700">{value}</p>
    </div>
  );
}
