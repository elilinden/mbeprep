import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <section
      aria-labelledby="not-found-title"
      className="rounded-lg border border-stone-200 bg-white p-8"
    >
      <h1
        className="text-2xl font-semibold text-stone-950"
        id="not-found-title"
      >
        Page not found
      </h1>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        This route is not available in MBE Prep.
      </p>
      <Link className={cn(buttonVariants(), "mt-5")} href="/">
        Go home
      </Link>
    </section>
  );
}
