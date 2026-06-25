import { env } from "@/env/server";

export default function DevelopmentHealthPage() {
  if (env.NODE_ENV === "production") {
    return null;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-stone-950">
        Development health
      </h1>
      <dl className="mt-6 grid gap-3 rounded-lg border border-stone-200 bg-white p-5 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="font-medium text-stone-700">App</dt>
          <dd className="text-stone-950">{env.NEXT_PUBLIC_APP_NAME}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium text-stone-700">Environment</dt>
          <dd className="text-stone-950">{env.NODE_ENV}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium text-stone-700">Podcast storage</dt>
          <dd className="text-stone-950">{env.PODCAST_STORAGE_DRIVER}</dd>
        </div>
      </dl>
    </main>
  );
}
