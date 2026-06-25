import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, FileText, NotebookPen } from "lucide-react";

import { requireUser } from "@/auth/app-auth";
import { OnboardingRequired } from "@/components/onboarding/onboarding-required";
import { Button } from "@/components/ui/button";
import { getEssayReviewForUser } from "@/server/essay-memory-store";
import { getLearnerProfile } from "@/server/onboarding-repository";

import { submitEssaySelfAssessmentAction } from "../../actions";

type EssayReviewPageProps = {
  params: Promise<{ attemptId: string }>;
  searchParams?: Promise<{ assessed?: string; duplicate?: string }>;
};

export default async function EssayReviewPage({
  params,
  searchParams,
}: EssayReviewPageProps) {
  const user = await requireUser();
  const profile = await getLearnerProfile(user.id);
  if (!profile?.onboardingCompletedAt) {
    return <OnboardingRequired currentStep="essays" />;
  }

  const { attemptId } = await params;
  const query = await searchParams;
  let review;

  try {
    review = getEssayReviewForUser(attemptId, user.id);
  } catch {
    review = null;
  }

  if (!review) {
    notFound();
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <FileText aria-hidden="true" className="size-5 text-emerald-700" />
            <div>
              <p className="text-sm font-medium text-emerald-700">
                {review.subject} · {review.topic}
              </p>
              <h1 className="text-2xl font-semibold text-stone-950">
                Essay Review
              </h1>
              <p className="mt-1 text-sm text-stone-600">{review.title}</p>
            </div>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-md border border-stone-300 px-3 text-sm font-medium"
            href={"/analytics" as Route}
          >
            View analytics
          </Link>
        </div>
        {query?.duplicate === "1" ? (
          <p className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Duplicate submission ignored. The original submitted essay remains
            the record.
          </p>
        ) : null}
        {query?.assessed === "1" ? (
          <p className="mt-3 rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            Self-assessment saved. Missed issues were added to the review
            system.
          </p>
        ) : null}
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="rounded-lg border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-950">
            Student Answer
          </h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-700">
            {review.studentAnswer || "No answer text submitted."}
          </p>
        </article>
        <article className="rounded-lg border border-stone-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-950">
            Sample Answer
          </h2>
          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-stone-700">
            {review.sampleAnswer}
          </p>
        </article>
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <NotebookPen aria-hidden="true" className="size-5 text-emerald-700" />
          <h2 className="text-lg font-semibold text-stone-950">
            Rubric Self-Assessment
          </h2>
        </div>
        <form
          action={submitEssaySelfAssessmentAction}
          className="mt-5 space-y-4"
        >
          <input name="attemptId" type="hidden" value={review.attemptId} />
          {review.issueChecklist.map((item) => (
            <article
              className="rounded-md border border-stone-200 p-4"
              key={item.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-stone-950">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-stone-600">
                    {item.description}
                  </p>
                </div>
                <span className="rounded-md border border-stone-300 px-2 py-1 text-sm font-medium text-stone-700">
                  {item.maxPoints} pts
                </span>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-3">
                <Detail title="Rule Statement" value={item.ruleStatement} />
                <Detail
                  title="Fact-Application Guidance"
                  value={item.factApplicationGuidance}
                />
                <Detail
                  title="Common Mistakes"
                  value={item.commonMistakes.join(" ")}
                />
              </div>
              <label className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-md border border-stone-300 px-3 text-sm font-medium text-stone-800">
                <input
                  name="missedRubricItemId"
                  type="checkbox"
                  value={item.id}
                />
                Mark as missed
              </label>
            </article>
          ))}
          <label className="grid gap-2 text-sm font-medium text-stone-800">
            Notes
            <textarea
              className="min-h-24 rounded-md border border-stone-300 px-3 py-2 text-sm"
              name="notes"
              placeholder="Add self-assessment notes"
            />
          </label>
          <Button type="submit">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            Save self-assessment
          </Button>
        </form>
        {review.assessment ? (
          <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950">
            Latest self-assessment: {review.assessment.earnedPoints} of{" "}
            {review.assessment.totalPoints} points using rubric version{" "}
            {review.assessment.rubricVersion}.
          </div>
        ) : null}
      </section>
    </div>
  );
}

function Detail({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-stone-200 p-3">
      <p className="text-xs font-medium uppercase text-stone-500">{title}</p>
      <p className="mt-2 text-sm leading-6 text-stone-700">{value}</p>
    </div>
  );
}
