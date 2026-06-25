import Link from "next/link";
import {
  AudioLines,
  CalendarDays,
  ClipboardCheck,
  MoveRight,
  ShieldCheck,
} from "lucide-react";

import { PageHeader } from "@/components/shell/page-header";
import { buttonVariants } from "@/components/ui/button";
import { StatusCard } from "@/components/ui/status-card";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Link className={cn(buttonVariants())} href="/login">
            Sign in and start setup
            <MoveRight aria-hidden="true" className="size-4" />
          </Link>
        }
        description="Start by confirming your exam details, then build a realistic schedule, then study with practice, audio, essays, and analytics."
        eyebrow="MBE Prep"
        title="Your guided bar-prep workflow"
      />
      <div className="grid gap-4 md:grid-cols-3">
        <StatusCard
          description="Choose jurisdiction and exam date, resolve the track, and set weekly availability before the study tools open."
          eyebrow="Step 1"
          title="Complete onboarding"
        >
          <ClipboardCheck
            aria-hidden="true"
            className="size-8 text-emerald-700"
          />
        </StatusCard>
        <StatusCard
          description="Generate a daily calendar from your exam date, available minutes, rest days, due reviews, and coverage gaps."
          eyebrow="Step 2"
          title="Make your schedule"
        >
          <CalendarDays aria-hidden="true" className="size-8 text-amber-600" />
        </StatusCard>
        <StatusCard
          description="Use practice questions, audio lessons, essays, review, and analytics after setup anchors the plan."
          eyebrow="Step 3"
          title="Study and review"
        >
          <AudioLines aria-hidden="true" className="size-8 text-rose-700" />
        </StatusCard>
      </div>
      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck
            aria-hidden="true"
            className="mt-1 size-6 text-emerald-700"
          />
          <div>
            <h2 className="text-lg font-semibold text-stone-950">
              Secure content flow
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              Correct answers, explanations, essay review material, and
              reviewer-only content stay server-side until the learner reaches
              the correct submission or review step.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
