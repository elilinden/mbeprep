import Link from "next/link";
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Pin,
  RefreshCcw,
  SkipForward,
} from "lucide-react";

import { requireUser } from "@/auth/app-auth";
import { OnboardingRequired } from "@/components/onboarding/onboarding-required";
import { PageHeader } from "@/components/shell/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { toStudentContentLabel } from "@/lib/student-content-labels";
import { cn } from "@/lib/utils";
import { getLearnerProfile } from "@/server/onboarding-repository";
import {
  clearStudyPlanNoticeForUser,
  getStudyPlanViewForUser,
} from "@/server/study-plan-memory-store";

import {
  completeStudyTaskAction,
  rebuildStudyPlanAction,
  rescheduleStudyTaskAction,
  skipStudyTaskAction,
  togglePinStudyTaskAction,
} from "./actions";

type PlanPageProps = {
  searchParams?: Promise<Record<string, string | undefined>>;
};

export default async function PlanPage({ searchParams }: PlanPageProps) {
  const user = await requireUser();
  const profile = await getLearnerProfile(user.id);
  if (!profile?.onboardingCompletedAt) {
    return <OnboardingRequired currentStep="plan" />;
  }

  const query = await searchParams;
  const view = await getStudyPlanViewForUser({ userId: user.id });
  const plan = view.plan;
  const notice =
    query?.completed === "1"
      ? "Task completed. The next assignments are still capacity-aware."
      : query?.rebuilt === "1"
        ? "Plan rebuilt from current mastery, reviews, and availability."
        : query?.skipped === "1"
          ? "Task skipped with a reason."
          : query?.pinned === "1"
            ? "Pinned state updated."
            : query?.rescheduled === "1"
              ? "Task rescheduled and pinned."
              : view.notice;

  if (notice) {
    clearStudyPlanNoticeForUser(user.id);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <form action={rebuildStudyPlanAction}>
              <Button type="submit" variant="secondary">
                <RefreshCcw aria-hidden="true" className="size-4" />
                Rebuild plan
              </Button>
            </form>
            <Link
              className={cn(buttonVariants({ variant: "secondary" }))}
              href="/onboarding"
            >
              Update availability
            </Link>
          </div>
        }
        description="Daily assignments are generated from availability, mastery, due reviews, coverage gaps, and reviewed content metadata."
        eyebrow="Study Plan"
        title="Adaptive Calendar"
      />

      {!plan ? (
        <section className="rounded-lg border border-stone-200 bg-white p-6">
          <div className="flex items-start gap-3">
            <CalendarDays
              aria-hidden="true"
              className="mt-1 size-5 text-emerald-700"
            />
            <div>
              <h2 className="text-lg font-semibold text-stone-950">
                No schedule yet
              </h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Build your first schedule from your confirmed onboarding
                settings.
              </p>
              <form action={rebuildStudyPlanAction} className="mt-4">
                <Button type="submit">
                  <RefreshCcw aria-hidden="true" className="size-4" />
                  Build schedule
                </Button>
              </form>
            </div>
          </div>
        </section>
      ) : (
        <>
          {notice ? (
            <p className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              {notice}
            </p>
          ) : null}
          {plan.unrealisticWarning ? (
            <section className="rounded-lg border border-amber-300 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <CircleAlert
                  aria-hidden="true"
                  className="mt-0.5 size-5 text-amber-800"
                />
                <div>
                  <h2 className="font-semibold text-amber-950">
                    Behind Schedule Warning
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-amber-900">
                    {plan.unrealisticWarning}
                  </p>
                </div>
              </div>
            </section>
          ) : null}

          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
            {plan.days.map((day) => (
              <article
                className="rounded-lg border border-stone-200 bg-white p-4"
                key={day.id}
              >
                <p className="text-xs font-medium uppercase text-stone-500">
                  {day.date.toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </p>
                <p className="mt-2 text-2xl font-semibold text-stone-950">
                  {day.scheduledMinutes}/{day.availableMinutes}
                </p>
                <p className="mt-1 text-xs text-stone-600">
                  {day.tasks.filter((task) => task.status === "TODO").length}{" "}
                  open task
                  {day.tasks.filter((task) => task.status === "TODO").length ===
                  1
                    ? ""
                    : "s"}
                </p>
                {day.warning ? (
                  <p className="mt-2 text-xs text-amber-800">{day.warning}</p>
                ) : null}
              </article>
            ))}
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-stone-950">
                Daily List
              </h2>
              {plan.days.map((day) => (
                <details
                  className="rounded-lg border border-stone-200 bg-white p-5"
                  key={day.id}
                  open={view.today?.id === day.id}
                >
                  <summary className="cursor-pointer list-none">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-base font-semibold text-stone-950">
                        {day.date.toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          timeZone: "UTC",
                        })}
                      </h3>
                      <span className="text-sm text-stone-600">
                        {day.scheduledMinutes} of {day.availableMinutes} minutes
                      </span>
                    </div>
                  </summary>
                  <div className="mt-4 space-y-3">
                    {day.tasks.map((task) => (
                      <article
                        className="rounded-md border border-stone-200 p-4"
                        key={task.id}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-medium uppercase text-stone-500">
                              {task.taskType} · {task.status}
                            </p>
                            <h4 className="mt-1 font-semibold text-stone-950">
                              {toStudentContentLabel(task.title)}
                            </h4>
                            <p className="mt-1 text-sm text-stone-600">
                              {task.estimatedMinutes} min · Priority{" "}
                              {task.priority}
                              {task.relatedSubject
                                ? ` · ${task.relatedSubject}`
                                : ""}
                              {task.isPinned ? " · Pinned" : ""}
                            </p>
                          </div>
                          {task.status === "TODO" &&
                          task.taskType !== "REST" ? (
                            <div className="flex flex-wrap gap-2">
                              <TaskButton
                                action={completeStudyTaskAction}
                                icon="complete"
                                taskId={task.id}
                                text="Complete"
                              />
                              <TaskButton
                                action={togglePinStudyTaskAction}
                                icon="pin"
                                taskId={task.id}
                                text={task.isPinned ? "Unpin" : "Pin"}
                              />
                            </div>
                          ) : null}
                        </div>
                        <details className="mt-3">
                          <summary className="cursor-pointer text-sm font-medium text-emerald-800">
                            Why this was assigned
                          </summary>
                          <p className="mt-2 text-sm leading-6 text-stone-700">
                            {task.whyAssigned}
                          </p>
                        </details>
                        {task.status === "TODO" && task.taskType !== "REST" ? (
                          <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <form
                              action={skipStudyTaskAction}
                              className="flex gap-2"
                            >
                              <input
                                name="taskId"
                                type="hidden"
                                value={task.id}
                              />
                              <input
                                aria-label={`Skip reason for ${toStudentContentLabel(task.title)}`}
                                className="min-h-10 min-w-0 flex-1 rounded-md border border-stone-300 px-3 text-sm"
                                name="skipReason"
                                placeholder="Skip reason"
                              />
                              <Button
                                size="sm"
                                type="submit"
                                variant="secondary"
                              >
                                <SkipForward
                                  aria-hidden="true"
                                  className="size-4"
                                />
                                Skip
                              </Button>
                            </form>
                            <form
                              action={rescheduleStudyTaskAction}
                              className="flex gap-2"
                            >
                              <input
                                name="taskId"
                                type="hidden"
                                value={task.id}
                              />
                              <input
                                aria-label={`Reschedule ${toStudentContentLabel(task.title)}`}
                                className="min-h-10 min-w-0 flex-1 rounded-md border border-stone-300 px-3 text-sm"
                                name="date"
                                type="date"
                              />
                              <Button
                                size="sm"
                                type="submit"
                                variant="secondary"
                              >
                                Reschedule
                              </Button>
                            </form>
                          </div>
                        ) : null}
                        {task.skipReason ? (
                          <p className="mt-2 text-sm text-stone-600">
                            Skip reason: {task.skipReason}
                          </p>
                        ) : null}
                      </article>
                    ))}
                  </div>
                </details>
              ))}
            </div>

            <aside className="space-y-4">
              <section className="rounded-lg border border-stone-200 bg-white p-5">
                <h2 className="font-semibold text-stone-950">Generation Run</h2>
                <dl className="mt-3 space-y-2 text-sm text-stone-700">
                  <Row label="Trigger" value={plan.generationRun.trigger} />
                  <Row label="Seed" value={plan.generationRun.seed} />
                  <Row
                    label="Algorithm"
                    value={plan.generationRun.algorithmVersion}
                  />
                  <Row
                    label="Available"
                    value={`${plan.generationRun.inputSummary.availableMinutes} min`}
                  />
                  <Row
                    label="Required"
                    value={`${plan.generationRun.inputSummary.requiredMinutes} min`}
                  />
                </dl>
              </section>
              <section className="rounded-lg border border-stone-200 bg-white p-5">
                <h2 className="font-semibold text-stone-950">Planning Rules</h2>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-stone-600">
                  <li>Due reviews are scheduled before new work.</li>
                  <li>Weak topics outrank maintenance work.</li>
                  <li>
                    Subjects are interleaved to avoid long same-subject runs.
                  </li>
                  <li>Pinned tasks survive replanning.</li>
                  <li>Unpinned missed work does not become a catch-up pile.</li>
                </ul>
              </section>
            </aside>
          </section>
        </>
      )}
    </div>
  );
}

function TaskButton({
  action,
  icon,
  taskId,
  text,
}: {
  action: (formData: FormData) => void | Promise<void>;
  icon: "complete" | "pin";
  taskId: string;
  text: string;
}) {
  const Icon = icon === "complete" ? CheckCircle2 : Pin;

  return (
    <form action={action}>
      <input name="taskId" type="hidden" value={taskId} />
      <Button size="sm" type="submit" variant="secondary">
        <Icon aria-hidden="true" className="size-4" />
        {text}
      </Button>
    </form>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-stone-500">{label}</dt>
      <dd className="text-right font-medium text-stone-950">{value}</dd>
    </div>
  );
}
