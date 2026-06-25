import Link from "next/link";
import { CheckCircle2, Lock, MoveRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type OnboardingRequiredProps = {
  currentStep?: "plan" | "practice" | "audio" | "essays" | "analytics";
};

const steps = [
  {
    key: "onboarding",
    title: "Finish onboarding",
    description:
      "Confirm your jurisdiction, exam date, track, and weekly study time.",
    state: "current",
  },
  {
    key: "plan",
    title: "Build your schedule",
    description:
      "Use your exam date and availability to generate a daily plan.",
    state: "locked",
  },
  {
    key: "study",
    title: "Start studying",
    description:
      "Practice questions, audio, essays, and analytics unlock after setup.",
    state: "locked",
  },
] as const;

export function OnboardingRequired({
  currentStep = "plan",
}: OnboardingRequiredProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-amber-300 bg-white p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-amber-700">
              Setup required
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-stone-950">
              Finish onboarding first
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
              This section is locked until the app knows your exam date, track,
              availability, and accessibility preferences. After that, MBE Prep
              can build your schedule and open the next study tools in order.
            </p>
          </div>
          <Link className={cn(buttonVariants(), "shrink-0")} href="/onboarding">
            Continue onboarding
            <MoveRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>

      <section
        aria-label="Setup workflow"
        className="grid gap-3 md:grid-cols-3"
      >
        {steps.map((step, index) => (
          <article
            className={cn(
              "rounded-lg border bg-white p-4",
              step.state === "current"
                ? "border-emerald-300"
                : "border-stone-200",
            )}
            key={step.key}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className={cn(
                  "grid size-9 shrink-0 place-items-center rounded-full border text-sm font-semibold",
                  step.state === "current"
                    ? "border-emerald-700 bg-emerald-50 text-emerald-900"
                    : "border-stone-300 bg-stone-50 text-stone-600",
                )}
              >
                {index + 1}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-stone-950">
                    {step.title}
                  </h2>
                  {step.state === "current" ? (
                    <CheckCircle2
                      aria-hidden="true"
                      className="size-4 text-emerald-700"
                    />
                  ) : (
                    <Lock
                      aria-hidden="true"
                      className="size-4 text-stone-500"
                    />
                  )}
                </div>
                <p className="mt-1 text-sm leading-6 text-stone-600">
                  {step.description}
                </p>
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-stone-950">
          Why {sectionLabel(currentStep)} is locked
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          The app needs onboarding to choose the correct exam track and avoid
          giving you a plan or practice set that does not match your exam.
        </p>
      </section>
    </div>
  );
}

function sectionLabel(
  step: NonNullable<OnboardingRequiredProps["currentStep"]>,
) {
  const labels = {
    analytics: "analytics",
    audio: "audio",
    essays: "essays",
    plan: "the schedule",
    practice: "practice",
  } satisfies Record<string, string>;

  return labels[step];
}
