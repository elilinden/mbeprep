import { GlassCard } from "@/components/GlassCard";
import { ProgressBar } from "@/components/ProgressBar";
import type { SubjectStats } from "@/lib/types";

export function SubjectMastery({ subjects }: { subjects: SubjectStats[] }) {
  if (!subjects.length) {
    return (
      <GlassCard>
        <h2 className="text-xl font-semibold">Subject mastery</h2>
        <p className="mt-3 text-slate-950/62">Answer a few questions and your subject map will appear here.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">Subject mastery</h2>
        <p className="mt-1 text-sm text-slate-950/58">Accuracy by subject, plus where your weak subtopics need attention.</p>
      </div>
      <div className="space-y-4">
        {subjects.map((subject) => (
          <div key={subject.subject} className="rounded-3xl bg-white/58 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">{subject.subject}</p>
                <p className="text-sm text-slate-950/58">
                  {subject.attempted} attempted · {subject.weaknessScore >= 50 ? "urgent attention" : subject.weaknessScore >= 25 ? "high attention" : "steady progress"}
                </p>
              </div>
              <p className="text-lg font-semibold">{subject.accuracy}%</p>
            </div>
            <div className="mt-3">
              <ProgressBar value={subject.accuracy} />
            </div>
            {subject.topMissedSubtopics.length ? (
              <p className="mt-3 text-sm text-slate-950/62">Top misses: {subject.topMissedSubtopics.join(", ")}</p>
            ) : null}
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
