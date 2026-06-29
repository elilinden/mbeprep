import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";
import type { WeakArea } from "@/lib/types";

function priorityLabel(score: number) {
  if (score >= 50) {
    return "Urgent priority";
  }

  if (score >= 25) {
    return "High priority";
  }

  return "Low priority";
}

function priorityStyle(score: number) {
  if (score >= 50) {
    return "bg-red-100 text-red-800";
  }

  if (score >= 25) {
    return "bg-amber-100 text-amber-900";
  }

  return "bg-slate-100 text-slate-700";
}

export function WeakAreasList({ areas, title = "Your highest priority areas" }: { areas: WeakArea[]; title?: string }) {
  return (
    <GlassCard className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-950/58">
          Ranked by missed questions, guessed answers, confusing questions, repeated trouble, and time pressure.
        </p>
      </div>
      {areas.length ? (
        <div className="space-y-3">
          {areas.map((area) => (
            <div key={area.id} className="rounded-3xl bg-white/62 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-indigo-700">{area.subject}</p>
                  <h3 className="mt-1 text-lg font-semibold">{area.subtopic}</h3>
                  <p className="mt-1 text-sm text-slate-950/62">{area.category}</p>
                  <p className="mt-3 text-sm text-slate-950/72">{area.reason}</p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-950/62">
                    {area.missed ? <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700">{area.missed} missed</span> : null}
                    {area.guessed ? <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">{area.guessed} guessed</span> : null}
                    {area.confusing ? <span className="rounded-full bg-purple-50 px-3 py-1.5 text-purple-800">{area.confusing} confusing</span> : null}
                    {area.slow ? <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sky-800">{area.slow} slow</span> : null}
                    {area.correctRecovery ? <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">{area.correctRecovery} later correct</span> : null}
                  </div>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${priorityStyle(area.score)}`}>
                    {priorityLabel(area.score)}
                  </div>
                  <Link
                    href={`/practice?mode=weak&subtopic=${encodeURIComponent(area.subtopic)}`}
                    className="rounded-2xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                  >
                    Practice this area
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-3xl bg-white/62 p-6 text-slate-950/66">
          No weak areas yet. Start with a mixed set and MBE Prep will begin ranking your priorities.
        </div>
      )}
    </GlassCard>
  );
}
