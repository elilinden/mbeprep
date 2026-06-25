"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      aria-labelledby="error-title"
      className="rounded-lg border border-rose-200 bg-white p-8"
    >
      <AlertTriangle aria-hidden="true" className="size-10 text-rose-700" />
      <h1
        className="mt-4 text-2xl font-semibold text-stone-950"
        id="error-title"
      >
        Something went wrong
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-600">
        The application shell caught an error before the feature could render.
      </p>
      {error.digest ? (
        <p className="mt-3 text-xs text-stone-500">Digest: {error.digest}</p>
      ) : null}
      <Button className="mt-5" onClick={reset}>
        Try again
      </Button>
    </section>
  );
}
