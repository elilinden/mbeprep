import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, BarChart3, Bookmark, RotateCcw } from "lucide-react";

import { requireUser } from "@/auth/app-auth";
import { OnboardingRequired } from "@/components/onboarding/onboarding-required";
import { Button } from "@/components/ui/button";
import { buildQuestionExplanation } from "@/domain/practice-engine";
import type { PracticeAttempt } from "@/domain/practice-types";
import { getLearnerProfile } from "@/server/onboarding-repository";
import { getPracticeReviewForUser } from "@/server/practice-memory-store";

import {
  addMistakeTagAction,
  toggleQuestionBookmarkAction,
} from "../../actions";

type ReviewPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function PracticeReviewPage({ params }: ReviewPageProps) {
  const user = await requireUser();
  const profile = await getLearnerProfile(user.id);
  if (!profile?.onboardingCompletedAt) {
    return <OnboardingRequired currentStep="practice" />;
  }

  const { sessionId } = await params;
  const review = getPracticeReviewForUser(sessionId, user.id);

  if (!review) {
    notFound();
  }

  const { session, summary } = review;

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <BarChart3 aria-hidden="true" className="size-5 text-emerald-700" />
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Session Review
            </p>
            <h1 className="text-2xl font-semibold text-stone-950">
              Score {summary.score} of {summary.total}
            </h1>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <Metric
            label="Accuracy"
            value={`${Math.round(summary.accuracy * 100)}%`}
          />
          <Metric
            label="Average time"
            value={`${Math.round(summary.averageTimeMs / 1000)}s`}
          />
          <Metric
            label="High-confidence errors"
            value={String(summary.highConfidenceErrors.length)}
          />
          <Metric
            label="Changed answers"
            value={String(summary.changedAnswerCount)}
          />
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-stone-950">
          Performance by Topic
        </h2>
        <div className="mt-4 space-y-2">
          {summary.byTopic.map((topic) => (
            <div
              className="flex items-center justify-between rounded-md border border-stone-200 p-3 text-sm"
              key={topic.topic}
            >
              <span>{topic.topic}</span>
              <span>
                {topic.correct}/{topic.total}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <AlertTriangle aria-hidden="true" className="size-5 text-amber-700" />
          <h2 className="text-lg font-semibold text-stone-950">
            Incorrect-Answer Review
          </h2>
        </div>
        <div className="mt-4 space-y-4">
          {summary.incorrectAttempts.map((attempt) => {
            const sessionQuestion = session.questions.find(
              (question) => question.id === attempt.sessionQuestionId,
            );

            if (!sessionQuestion) {
              return null;
            }

            const explanation = buildQuestionExplanation(
              sessionQuestion.question,
            );

            return (
              <div
                className="rounded-lg border border-stone-200 p-4"
                key={attempt.id}
              >
                <p className="text-sm font-semibold text-stone-950">
                  {sessionQuestion.question.subject}:{" "}
                  {sessionQuestion.question.category}
                </p>
                <p className="mt-2 text-sm text-stone-600">
                  Response {formatAttemptResponse(attempt)}. Correct{" "}
                  {explanation.correctAnswer}. Points {attempt.earnedPoints} of{" "}
                  {attempt.maxPoints}.
                </p>
                <p className="mt-2 text-sm text-stone-700">
                  {explanation.application}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={addMistakeTagAction}>
                    <input name="sessionId" type="hidden" value={session.id} />
                    <input name="attemptId" type="hidden" value={attempt.id} />
                    <label className="inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm">
                      Mistake reason
                      <select className="bg-white" name="tag">
                        <option value="MISREAD_FACTS">Misread facts</option>
                        <option value="MISREAD_CALL">Misread call</option>
                        <option value="RULE_CONFUSION">Rule confusion</option>
                        <option value="TIMING_PRESSURE">Timing pressure</option>
                        <option value="SECOND_GUESSING">Second guessing</option>
                        <option value="CONTENT_GAP">Content gap</option>
                      </select>
                    </label>
                    <Button className="ml-2" size="sm" type="submit">
                      Add reason
                    </Button>
                  </form>
                  <form action={toggleQuestionBookmarkAction}>
                    <input name="sessionId" type="hidden" value={session.id} />
                    <input
                      name="questionVersionId"
                      type="hidden"
                      value={attempt.questionVersionId}
                    />
                    <Button size="sm" type="submit" variant="secondary">
                      <Bookmark aria-hidden="true" className="size-4" />
                      Bookmark
                    </Button>
                  </form>
                  <Link
                    className="inline-flex min-h-9 items-center justify-center rounded-md border border-stone-300 px-3 text-xs font-medium"
                    href={
                      `/practice/questions/${session.id}?position=${sessionQuestion.position}` as Route
                    }
                  >
                    <RotateCcw aria-hidden="true" className="mr-2 size-4" />
                    Revisit
                  </Link>
                </div>
                {attempt.mistakeTags.length > 0 ? (
                  <p className="mt-2 text-xs text-stone-500">
                    Review queue additions: {attempt.mistakeTags.join(", ")}
                  </p>
                ) : null}
              </div>
            );
          })}
          {summary.incorrectAttempts.length === 0 ? (
            <p className="text-sm text-stone-600">
              No incorrect demonstration attempts in this session.
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-200 p-3">
      <p className="text-xs font-medium uppercase text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function formatAttemptResponse(attempt: PracticeAttempt) {
  if (Object.keys(attempt.writtenResponses).length > 0) {
    return Object.entries(attempt.writtenResponses)
      .map(([key, value]) => `${key}: ${value}`)
      .join(" | ");
  }

  return attempt.selectedChoiceIds.join(", ");
}
