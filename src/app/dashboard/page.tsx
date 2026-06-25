import Link from "next/link";
import type { Route } from "next";
import {
  AudioLines,
  CalendarDays,
  CheckCircle2,
  Gauge,
  Lock,
  MoveRight,
  PlayCircle,
} from "lucide-react";

import { requireUser } from "@/auth/app-auth";
import { PageHeader } from "@/components/shell/page-header";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusCard } from "@/components/ui/status-card";
import { getTodayAvailableMinutes } from "@/domain/onboarding";
import type { StudyTask } from "@/domain/study-plan-types";
import { toStudentContentLabel } from "@/lib/student-content-labels";
import { cn } from "@/lib/utils";
import { getLearnerProfile } from "@/server/onboarding-repository";
import { getStudyPlanViewForUser } from "@/server/study-plan-memory-store";

export default async function DashboardPage() {
  const user = await requireUser();
  const profile = await getLearnerProfile(user.id);
  const onboardingComplete = Boolean(profile?.onboardingCompletedAt);
  const planView = profile?.onboardingCompletedAt
    ? await getStudyPlanViewForUser({ userId: user.id })
    : null;
  const now = new Date();
  const todayMinutes = getTodayAvailableMinutes(
    profile?.availableMinutesByDay,
    profile?.timeZone,
    now,
  );
  const countdown =
    profile?.examDate == null
      ? null
      : Math.max(
          0,
          Math.ceil(
            (profile.examDate.getTime() - now.getTime()) /
              (1000 * 60 * 60 * 24),
          ),
        );
  const primaryAction = getDashboardPrimaryAction({
    onboardingComplete,
    planView,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap gap-2">
            <Link className={cn(buttonVariants())} href={primaryAction.href}>
              {primaryAction.label}
              <MoveRight aria-hidden="true" className="size-4" />
            </Link>
            {onboardingComplete ? (
              <Link
                className={cn(buttonVariants({ variant: "secondary" }))}
                href="/onboarding"
              >
                Edit onboarding
              </Link>
            ) : null}
          </div>
        }
        description="Follow the setup flow in order: confirm your exam details, build your schedule, then start practice, audio, essays, and analytics."
        eyebrow="Dashboard"
        title={`Welcome${user.name ? `, ${user.name}` : ""}`}
      />
      <section className="rounded-lg border-2 border-emerald-700 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Next action
            </p>
            <h2 className="mt-1 text-xl font-semibold text-stone-950">
              {primaryAction.label}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              {primaryAction.description}
            </p>
          </div>
          <Link
            className={cn(buttonVariants(), "shrink-0")}
            href={primaryAction.href}
          >
            {primaryAction.cta}
            <MoveRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
      <SetupWorkflow
        hasPlan={Boolean(planView?.plan)}
        onboardingComplete={onboardingComplete}
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatusCard
          description={
            countdown == null
              ? "Complete onboarding to set an exam date."
              : `${countdown} day${countdown === 1 ? "" : "s"} until exam day.`
          }
          eyebrow="Exam"
          title="Countdown"
        />
        <StatusCard
          description={`${todayMinutes} minute${todayMinutes === 1 ? "" : "s"} available today.`}
          eyebrow="Availability"
          title="Today"
        />
        <StatusCard
          description={
            profile?.resolvedExamTrackCode ?? "No track confirmed yet."
          }
          eyebrow="Track"
          title="Resolved exam track"
        />
      </div>
      {profile?.resolvedExamTrackCode === "NEXTGEN_UBE" ? (
        <section className="rounded-lg border border-emerald-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-950">
            NextGen UBE Readiness
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            NextGen readiness is tracked separately from legacy MBE mastery.
            Doctrinal signals and lawyering-skill signals will appear as
            reviewed NextGen practice is completed.
          </p>
        </section>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="rounded-lg border border-stone-200 bg-white p-6">
          <div className="flex items-center gap-3">
            <CalendarDays
              aria-hidden="true"
              className="size-5 text-emerald-700"
            />
            <h2 className="text-lg font-semibold text-stone-950">
              Today&apos;s Plan
            </h2>
          </div>
          {planView?.today ? (
            <div className="mt-4 space-y-3">
              <p className="text-sm text-stone-600">
                {planView.today.scheduledMinutes} of{" "}
                {planView.today.availableMinutes} minutes scheduled.
              </p>
              {planView.today.tasks
                .filter((task) => task.status === "TODO")
                .slice(0, 3)
                .map((task) => (
                  <div
                    className="rounded-md border border-stone-200 p-3"
                    key={task.id}
                  >
                    <p className="text-sm font-semibold text-stone-950">
                      {toStudentContentLabel(task.title)}
                    </p>
                    <p className="mt-1 text-xs text-stone-600">
                      {task.estimatedMinutes} min · Priority {task.priority}
                    </p>
                  </div>
                ))}
              <Link className={cn(buttonVariants(), "mt-2")} href="/plan">
                Open today&apos;s schedule
                <MoveRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-6 text-stone-600">
              Complete onboarding first. Then MBE Prep can build a schedule
              from your exam date, available minutes, and confirmed track.
            </p>
          )}
        </section>
        <EmptyState
          description="Mastery summaries appear after you complete scored practice or essay self-assessment."
          icon={Gauge}
          title="No mastery data"
        />
        <EmptyState
          description="Use today&apos;s plan, practice, audio, or essays after setup and scheduling are ready."
          icon={PlayCircle}
          title="Continue studying"
        />
      </div>
      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-center gap-3">
          <AudioLines aria-hidden="true" className="size-6 text-emerald-700" />
          <h2 className="text-lg font-semibold text-stone-950">
            Audio-first study flow
          </h2>
        </div>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          Once onboarding is complete, the student tools unlock in the order
          shown above so the schedule and content match the confirmed exam
          track.
        </p>
      </section>
    </div>
  );
}

type DashboardPlanView = Awaited<ReturnType<typeof getStudyPlanViewForUser>>;

function getDashboardPrimaryAction(input: {
  onboardingComplete: boolean;
  planView: DashboardPlanView | null;
}) {
  if (!input.onboardingComplete) {
    return {
      label: "Start onboarding",
      cta: "Start onboarding",
      href: "/onboarding" as Route,
      description:
        "Confirm jurisdiction, exam date, exam track, availability, and accessibility preferences before the study tools unlock.",
    };
  }

  const nextTask = input.planView?.today?.tasks.find(
    (task) => task.status === "TODO" && task.taskType !== "REST",
  );

  if (nextTask) {
    return {
      label: "Start today's plan",
      cta: "Open today",
      href: "/plan" as Route,
      description: `Next task: ${formatTaskSummary(nextTask)}.`,
    };
  }

  if (!input.planView?.plan) {
    return {
      label: "Create your schedule",
      cta: "Build schedule",
      href: "/plan" as Route,
      description:
        "Build a daily plan from your saved exam date, availability, due reviews, and reviewed content metadata.",
    };
  }

  return {
    label: "Begin recommended practice",
    cta: "Open practice",
    href: "/practice/questions" as Route,
    description:
      "Your schedule has no open task for today. Start a secure practice set for your confirmed exam track.",
  };
}

function formatTaskSummary(task: StudyTask) {
  return `${toStudentContentLabel(task.title)} (${task.estimatedMinutes} min)`;
}

function SetupWorkflow({
  hasPlan,
  onboardingComplete,
}: {
  hasPlan: boolean;
  onboardingComplete: boolean;
}) {
  const items = [
    {
      cta: onboardingComplete ? "Review settings" : "Start onboarding",
      description:
        "Confirm jurisdiction, exam date, track, weekly minutes, and accessibility preferences.",
      href: "/onboarding",
      locked: false,
      state: onboardingComplete ? "Complete" : "Do this first",
      title: "1. Finish onboarding",
    },
    {
      cta: hasPlan ? "Open schedule" : "Build schedule",
      description:
        "Generate a realistic daily calendar from the exam date and your available study time.",
      href: "/plan",
      locked: !onboardingComplete,
      state: !onboardingComplete ? "Locked" : hasPlan ? "Ready" : "Next step",
      title: "2. Make your schedule",
    },
    {
      cta: "Start studying",
      description:
        "Use practice, audio, essays, review, and analytics after setup anchors the plan.",
      href: "/practice/questions",
      locked: !onboardingComplete,
      state: onboardingComplete ? "Available" : "Locked",
      title: "3. Study and review",
    },
  ];

  return (
    <section aria-labelledby="setup-workflow-title" className="space-y-3">
      <div>
        <p className="text-sm font-medium text-emerald-700">Your workflow</p>
        <h2
          className="text-xl font-semibold text-stone-950"
          id="setup-workflow-title"
        >
          Complete these steps in order
        </h2>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {items.map((item) => (
          <article
            className={cn(
              "rounded-lg border bg-white p-5",
              item.locked
                ? "border-stone-200 opacity-80"
                : item.state === "Do this first" || item.state === "Next step"
                  ? "border-emerald-300"
                  : "border-stone-200",
            )}
            key={item.title}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border",
                  item.locked
                    ? "border-stone-300 bg-stone-50 text-stone-500"
                    : "border-emerald-700 bg-emerald-50 text-emerald-800",
                )}
              >
                {item.locked ? (
                  <Lock className="size-4" />
                ) : (
                  <CheckCircle2 className="size-4" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                  {item.state}
                </p>
                <h3 className="mt-1 text-base font-semibold text-stone-950">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-stone-600">
                  {item.description}
                </p>
              </div>
            </div>
            {item.locked ? (
              <p className="mt-4 rounded-md bg-stone-50 px-3 py-2 text-sm text-stone-600">
                Finish onboarding to unlock this step.
              </p>
            ) : (
              <Link
                className={cn(buttonVariants({ variant: "secondary" }), "mt-4")}
                href={item.href as Route}
              >
                {item.cta}
                <MoveRight aria-hidden="true" className="size-4" />
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
