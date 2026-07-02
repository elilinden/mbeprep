import Link from "next/link";
import { GlassCard } from "@/components/GlassCard";
import { cleanTopicTitle } from "@/lib/display";
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

type WeakAreasListProps = {
  areas: WeakArea[];
  title?: string;
  subtitle?: string;
  actionLabel?: string;
  emptyMessage?: string;
};

export function WeakAreasList({
  areas,
  title = "Your highest priority areas",
  subtitle = "Topics ranked by mistakes, uncertainty, and time spent.",
  actionLabel = "Practice This Topic",
  emptyMessage = "No weak areas yet. Start with a mixed set and MBE Prep will begin ranking your priorities."
}: WeakAreasListProps) {
  return (
    <GlassCard className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-950/58">{subtitle}</p>
      </div>
      {areas.length ? (
        <div className="space-y-3">
          {areas.map((area) => {
            const areaAttempts = area.missed + area.correctRecovery;
            const priority = areaAttempts < 5 ? "Early signal" : priorityLabel(area.score);

            return (
              <div key={area.id} className="rounded-3xl bg-white/62 p-5">
                <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_11rem] md:items-center">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold" title={area.subtopic}>{cleanTopicTitle(area.subtopic)}</h3>
                    <p className="mt-1 text-sm font-medium text-slate-950/62">{area.subject} · {area.category}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-950/62">
                      {area.missed ? <span className="rounded-full bg-red-50 px-3 py-1.5 text-red-700">{area.missed} question{area.missed === 1 ? "" : "s"} missed</span> : null}
                      {area.guessed ? <span className="rounded-full bg-amber-50 px-3 py-1.5 text-amber-800">{area.guessed} guessed</span> : null}
                      {area.confusing ? <span className="rounded-full bg-purple-50 px-3 py-1.5 text-purple-800">{area.confusing} confusing</span> : null}
                      {area.slow ? <span className="rounded-full bg-sky-50 px-3 py-1.5 text-sky-800">{area.slow} slow</span> : null}
                      {area.correctRecovery ? <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-800">{area.correctRecovery} later correct</span> : null}
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-1">
                    <div className={`inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-2xl px-4 py-3 text-center text-sm font-semibold ${areaAttempts < 5 ? "bg-slate-100 text-slate-700" : priorityStyle(area.score)}`}>
                      {priority}
                    </div>
                    <Link
                      href={`/practice?mode=weak&subtopic=${encodeURIComponent(area.subtopic)}`}
                      className="inline-flex min-h-12 items-center justify-center whitespace-nowrap rounded-2xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-indigo-700"
                    >
                      {actionLabel}
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-3xl bg-white/62 p-6 text-slate-950/66">
          {emptyMessage}
        </div>
      )}
    </GlassCard>
  );
}
