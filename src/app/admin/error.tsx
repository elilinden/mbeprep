"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      aria-labelledby="admin-error-heading"
      className="rounded-lg border border-red-200 bg-white p-6"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle aria-hidden="true" className="size-5 text-red-700" />
        <h1
          className="text-xl font-semibold text-stone-950"
          id="admin-error-heading"
        >
          Content operations could not load
        </h1>
      </div>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        Try again. If the problem continues, check the server logs with the
        request digest.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-stone-500">Digest: {error.digest}</p>
      ) : null}
      <Button className="mt-4" onClick={reset}>
        Retry
      </Button>
    </section>
  );
}
