import {
  BarChart3,
  BookOpenCheck,
  CalendarClock,
  Gauge,
  Target,
} from "lucide-react";

import { requireUser } from "@/auth/app-auth";
import { OnboardingRequired } from "@/components/onboarding/onboarding-required";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { getMasteryAnalyticsForUser } from "@/server/mastery-memory-store";
import { getLearnerProfile } from "@/server/onboarding-repository";

import { createPracticeSessionAction } from "../practice/questions/actions";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const profile = await getLearnerProfile(user.id);
  if (!profile?.onboardingCompletedAt) {
    return <OnboardingRequired currentStep="analytics" />;
  }

  const analytics = getMasteryAnalyticsForUser(user.id, new Date());

  return (
    <div className="space-y-8">
      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <BarChart3 aria-hidden="true" className="size-5 text-emerald-700" />
          <div>
            <p className="text-sm font-medium text-emerald-700">Analytics</p>
            <h1 className="text-2xl font-semibold text-stone-950">
              Topic Mastery
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">
          Scores are transparent, provisional when evidence is limited, and
          broken into knowledge, retention, coverage, timing, and confidence
          calibration components. Legacy MBE mastery and NextGen lawyering-skill
          mastery are reported as separate signals.
        </p>
      </section>

      {analytics.subjects.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {analytics.subjects.map((subject) => (
            <section
              className="rounded-lg border border-stone-200 bg-white p-5"
              key={subject.subject}
            >
              <p className="text-sm font-medium text-stone-500">
                {subject.subject}
              </p>
              <p className="mt-2 text-3xl font-semibold text-stone-950">
                {subject.overallScore}/100
              </p>
              <p className="mt-1 text-sm text-stone-600">
                {subject.dueReviewCount} due review items
              </p>
            </section>
          ))}
        </div>
      ) : (
        <EmptyState
          description="Complete a demonstration practice attempt to create a transparent topic score."
          icon={BarChart3}
          title="No mastery data yet"
        />
      )}

      <section className="space-y-4">
        {analytics.states.map((state) => {
          const reviewItems = analytics.reviewItems.filter(
            (item) => item.taxonomyNodeId === state.taxonomyNodeId,
          );

          return (
            <details
              className="rounded-lg border border-stone-200 bg-white p-5"
              key={state.taxonomyNodeId}
              open
            >
              <summary className="cursor-pointer list-none">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-stone-500">
                      {state.subject}
                    </p>
                    <h2 className="text-xl font-semibold text-stone-950">
                      {state.category} {state.overallScore}/100
                    </h2>
                  </div>
                  <div className="text-sm text-stone-600">
                    Trend: {state.eventCount > 1 ? "Updated" : "New"} ·{" "}
                    {state.dataConfidence} confidence
                  </div>
                </div>
              </summary>

              <div className="mt-5 grid gap-3 md:grid-cols-5">
                <ComponentCard
                  icon={Target}
                  label="Accuracy"
                  value={state.knowledgeComponent}
                />
                <ComponentCard
                  icon={CalendarClock}
                  label="Retention"
                  value={state.retentionComponent}
                />
                <ComponentCard
                  icon={BookOpenCheck}
                  label="Coverage"
                  value={state.coverageComponent}
                />
                <ComponentCard
                  icon={Gauge}
                  label="Timing"
                  value={state.speedComponent}
                />
                <ComponentCard
                  icon={BarChart3}
                  label="Confidence"
                  value={state.confidenceCalibrationComponent}
                />
              </div>

              <div className="mt-5 rounded-md bg-stone-50 p-4">
                <p className="text-sm font-semibold text-stone-950">
                  Why this score has its value
                </p>
                <p className="mt-2 text-sm text-stone-700">
                  {state.explanation.summary}
                </p>
                <ul className="mt-3 space-y-1 text-sm text-stone-600">
                  {state.explanation.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <form action={createPracticeSessionAction}>
                  <input name="mode" type="hidden" value="CUSTOM" />
                  <input name="subject" type="hidden" value={state.subject} />
                  <input name="category" type="hidden" value={state.category} />
                  <input
                    name="subtopic"
                    type="hidden"
                    value={state.taxonomyNodeId}
                  />
                  <input name="questionCount" type="hidden" value="1" />
                  <input name="timingMode" type="hidden" value="UNTIMED" />
                  <input name="feedbackMode" type="hidden" value="IMMEDIATE" />
                  <Button type="submit">Practice this topic</Button>
                </form>
                <p className="text-sm text-stone-600">
                  Next review:{" "}
                  {state.nextReviewAt
                    ? state.nextReviewAt.toISOString().slice(0, 10)
                    : "Not scheduled"}
                </p>
              </div>

              <div className="mt-5">
                <h3 className="font-semibold text-stone-950">
                  Automatic Error Notebook
                </h3>
                {reviewItems.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {reviewItems.map((item) => (
                      <div
                        className="rounded-md border border-stone-200 p-3 text-sm"
                        key={item.id}
                      >
                        <p className="font-semibold text-stone-950">
                          {item.topic} · {item.errorReason}
                        </p>
                        <p className="mt-1 text-stone-600">
                          Student answer: {item.studentAnswer}. Correct answer:{" "}
                          {item.correctAnswer}.
                        </p>
                        <p className="mt-1 text-stone-600">
                          Critical fact: {item.criticalFact}
                        </p>
                        <p className="mt-1 text-stone-500">
                          Related podcast: {item.relatedPodcast}. Due{" "}
                          {item.dueAt.toISOString().slice(0, 10)}.
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-stone-600">
                    No review items for this topic.
                  </p>
                )}
              </div>
            </details>
          );
        })}
      </section>
    </div>
  );
}

function ComponentCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BarChart3;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border border-stone-200 p-3">
      <div className="flex items-center gap-2 text-xs font-medium uppercase text-stone-500">
        <Icon aria-hidden="true" className="size-4 text-emerald-700" />
        {label}
      </div>
      <p className="mt-2 text-xl font-semibold text-stone-950">
        {Math.round(value * 100)}
      </p>
    </div>
  );
}
