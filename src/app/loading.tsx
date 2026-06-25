export default function Loading() {
  return (
    <div aria-live="polite" className="space-y-6">
      <div className="h-24 animate-pulse rounded-lg bg-stone-200" />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="h-40 animate-pulse rounded-lg bg-stone-200" />
        <div className="h-40 animate-pulse rounded-lg bg-stone-200" />
        <div className="h-40 animate-pulse rounded-lg bg-stone-200" />
      </div>
      <span className="sr-only">Loading page content</span>
    </div>
  );
}
