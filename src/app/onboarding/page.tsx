import { PageHeader } from "@/components/shell/page-header";
import { Button } from "@/components/ui/button";
import {
  DAYS_OF_WEEK,
  TEXT_SIZE_OPTIONS,
  resolveTrackForOnboarding,
} from "@/domain/onboarding";
import { env } from "@/env/server";
import { listExamVersionConfigs } from "@/server/exam-config-repository";
import { getLearnerProfile } from "@/server/onboarding-repository";
import { requireUser } from "@/auth/app-auth";

import { resolveTrackAction, saveOnboardingAction } from "./actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ jurisdiction?: string; examDate?: string }>;
}) {
  const user = await requireUser();
  const profile = await getLearnerProfile(user.id);
  const params = await searchParams;
  const jurisdiction = params.jurisdiction ?? profile?.jurisdiction ?? "UBE";
  const examDate =
    params.examDate ??
    (profile?.examDate ? toInputDate(profile.examDate) : "2026-07-28");
  const parsedExamDate = new Date(`${examDate}T00:00:00.000Z`);
  const configs = await listExamVersionConfigs();
  const resolved =
    jurisdiction && examDate && Number.isFinite(parsedExamDate.getTime())
      ? resolveTrackForOnboarding(configs, jurisdiction, parsedExamDate)
      : null;

  return (
    <div className="space-y-6">
      <PageHeader
        description="Start here. The rest of the student app unlocks after you confirm your exam track and study availability."
        eyebrow="Account setup"
        title={
          profile?.onboardingCompletedAt ? "Edit onboarding" : "Onboarding"
        }
      />
      <section
        aria-label="Student setup workflow"
        className="grid gap-3 md:grid-cols-3"
      >
        <WorkflowStep
          description="Resolve your jurisdiction, exam date, and exam track."
          state="Current"
          title="1. Confirm exam"
        />
        <WorkflowStep
          description="Tell MBE Prep which days and minutes are realistic."
          state="Next"
          title="2. Set availability"
        />
        <WorkflowStep
          description="Save the profile, then build your schedule."
          state="Locked until saved"
          title="3. Make schedule"
        />
      </section>
      <section className="rounded-lg border border-stone-200 bg-white p-6">
        <form action={resolveTrackAction} className="grid gap-4 md:grid-cols-3">
          <label className="grid gap-2 text-sm font-medium text-stone-800">
            Jurisdiction
            <input
              className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
              defaultValue={jurisdiction}
              name="jurisdiction"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-stone-800">
            Exam date
            <input
              className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
              defaultValue={examDate}
              min={toInputDate(new Date())}
              name="examDate"
              required
              type="date"
            />
          </label>
          <div className="flex items-end">
            <Button className="w-full" type="submit" variant="secondary">
              Resolve track
            </Button>
          </div>
        </form>
      </section>

      {resolved ? (
        <form action={saveOnboardingAction} className="space-y-6">
          <input name="jurisdiction" type="hidden" value={jurisdiction} />
          <input name="examDate" type="hidden" value={examDate} />
          <input
            name="selectedExamVersionId"
            type="hidden"
            value={resolved.id}
          />
          <input
            name="resolvedExamTrackCode"
            type="hidden"
            value={resolved.examTrackCode}
          />
          <section className="rounded-lg border border-emerald-200 bg-white p-6">
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
              Resolved Track
            </p>
            <h2 className="mt-2 text-xl font-semibold text-stone-950">
              {formatTrack(resolved.examTrackCode)}
            </h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {resolved.explanation}
            </p>
            <label className="mt-4 flex gap-3 text-sm font-medium text-stone-800">
              <input
                className="mt-1 size-4"
                defaultChecked={profile?.resolvedTrackConfirmed ?? false}
                name="resolvedTrackConfirmed"
                type="checkbox"
              />
              I confirm this is the exam track I am preparing for.
            </label>
          </section>

          <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-6 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Attempt status
              <select
                className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
                defaultValue={
                  profile?.firstTimeTaker === false ? "retaker" : "first-time"
                }
                name="firstTimeTaker"
              >
                <option value="first-time">First-time taker</option>
                <option value="retaker">Retaker</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Time zone
              <input
                className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
                defaultValue={profile?.timeZone ?? "America/Los_Angeles"}
                name="timeZone"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Study start date
              <input
                className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
                defaultValue={
                  profile?.studyStartDate
                    ? toInputDate(profile.studyStartDate)
                    : toInputDate(new Date())
                }
                name="studyStartDate"
                type="date"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Extended-time multiplier
              <input
                className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
                defaultValue={profile?.extendedTimeMultiplier ?? 1}
                max={env.ONBOARDING_EXTENDED_TIME_MULTIPLIER_MAX}
                min={env.ONBOARDING_EXTENDED_TIME_MULTIPLIER_MIN}
                name="extendedTimeMultiplier"
                step="0.25"
                type="number"
              />
            </label>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-6">
            <h2 className="text-lg font-semibold text-stone-950">
              Availability
            </h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {DAYS_OF_WEEK.map((day) => (
                <div className="grid gap-2 sm:grid-cols-[1fr_8rem]" key={day}>
                  <label className="flex items-center gap-3 text-sm font-medium text-stone-800">
                    <input
                      className="size-4"
                      defaultChecked={
                        profile?.availableDays.includes(day) ?? day !== "Sunday"
                      }
                      name="availableDays"
                      type="checkbox"
                      value={day}
                    />
                    {day}
                  </label>
                  <input
                    aria-label={`${day} available minutes`}
                    className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
                    defaultValue={profile?.availableMinutesByDay?.[day] ?? 45}
                    min={0}
                    name={`minutes-${day}`}
                    type="number"
                  />
                </div>
              ))}
            </div>
            <label className="mt-4 grid max-w-xs gap-2 text-sm font-medium text-stone-800">
              Rest day
              <select
                className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
                defaultValue={profile?.restDay ?? "Sunday"}
                name="restDay"
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="grid gap-4 rounded-lg border border-stone-200 bg-white p-6 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-medium text-stone-800">
              Preferred text size
              <select
                className="min-h-10 rounded-md border border-stone-300 px-3 text-sm"
                defaultValue={profile?.preferredTextSize ?? "MEDIUM"}
                name="preferredTextSize"
              >
                {TEXT_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {formatTextSize(size)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-3 text-sm font-medium text-stone-800">
              <input
                className="size-4"
                defaultChecked={profile?.highContrastPreference ?? false}
                name="highContrastPreference"
                type="checkbox"
              />
              High contrast
            </label>
            <label className="flex items-center gap-3 text-sm font-medium text-stone-800">
              <input
                className="size-4"
                defaultChecked={profile?.reducedMotionPreference ?? false}
                name="reducedMotionPreference"
                type="checkbox"
              />
              Reduced motion
            </label>
          </section>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit">Save profile and go to dashboard</Button>
            <p className="text-sm text-stone-600">
              After saving, your schedule and study tools will be available.
            </p>
          </div>
        </form>
      ) : (
        <section className="rounded-lg border border-amber-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-stone-950">
            Track not resolved
          </h2>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            Enter a jurisdiction and future exam date to continue.
          </p>
        </section>
      )}
    </div>
  );
}

function WorkflowStep({
  description,
  state,
  title,
}: {
  description: string;
  state: string;
  title: string;
}) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
        {state}
      </p>
      <h2 className="mt-1 text-base font-semibold text-stone-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
    </article>
  );
}

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatTrack(track: string) {
  return track
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTextSize(size: string) {
  return size
    .toLowerCase()
    .split("_")
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}
