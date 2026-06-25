export default function AdminLoading() {
  return (
    <div
      aria-live="polite"
      className="rounded-lg border border-stone-200 bg-white p-6"
      role="status"
    >
      <p className="text-sm font-medium text-stone-700">
        Loading content operations...
      </p>
    </div>
  );
}
