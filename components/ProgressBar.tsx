type ProgressBarProps = {
  value: number;
  label?: string;
};

export function ProgressBar({ value, label }: ProgressBarProps) {
  const safeValue = Math.min(100, Math.max(0, value));

  return (
    <div className="space-y-2">
      {label ? (
        <div className="flex items-center justify-between text-sm text-slate-950/70">
          <span>{label}</span>
          <span>{Math.round(safeValue)}%</span>
        </div>
      ) : null}
      <div className="h-2 overflow-hidden rounded-full bg-white/70">
        <div
          className="h-full rounded-full bg-indigo-600"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}
