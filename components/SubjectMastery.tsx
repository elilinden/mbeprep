import { GlassCard } from "@/components/GlassCard";
import { ProgressBar } from "@/components/ProgressBar";
import { cleanTopicTitle } from "@/lib/display";
import type { SubjectStats } from "@/lib/types";

function sampleStatus(subject: SubjectStats) {
  if (subject.attempted === 0) {
    return "Not started";
  }

  if (subject.attempted < 5) {
    return "More data needed";
  }

  if (subject.attempted < 10) {
    return "Early results";
  }

  if (subject.weaknessScore >= 50) {
    return "Needs review";
  }

  if (subject.weaknessScore >= 25) {
    return "Watch closely";
  }

  return "On track";
}

export function SubjectMastery({ subjects }: { subjects: SubjectStats[] }) {
  if (!subjects.length) {
    return (
      <GlassCard>
        <h2 className="text-xl font-semibold">Subject Performance</h2>
        <p className="mt-3 text-slate-950/62">Answer a few questions and your subject map will appear here.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Subject Performance</h2>
        <p className="mt-1 text-sm text-slate-950/58">Accuracy by subject, with sample size shown clearly.</p>
      </div>
      <div className="space-y-4">
        {subjects.map((subject) => (
          <div key={subject.subject} className="rounded-3xl bg-white/58 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{subject.subject}</p>
                <p className="text-sm text-slate-950/58">
                  {subject.attempted} answered · {sampleStatus(subject)}
                </p>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-lg font-semibold">{subject.accuracy}%</p>
                <p className="text-xs font-medium text-slate-950/52">{subject.correct} of {subject.attempted} correct</p>
              </div>
            </div>
            <div className="mt-3">
              <ProgressBar value={subject.accuracy} />
            </div>
            {subject.topMissedSubtopics.length ? (
              <p className="mt-3 text-sm text-slate-950/62">Top misses: {subject.topMissedSubtopics.map(cleanTopicTitle).join(", ")}</p>
            ) : null}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
