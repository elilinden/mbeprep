import type { LucideIcon } from "lucide-react";
import { useId } from "react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  const headingId = useId();

  return (
    <section
      aria-labelledby={headingId}
      className={cn(
        "rounded-lg border border-dashed border-stone-300 bg-white p-8 text-center",
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className="mx-auto size-10 text-emerald-700"
        strokeWidth={1.8}
      />
      <h2 className="mt-4 text-lg font-semibold text-stone-950" id={headingId}>
        {title}
      </h2>
      <p className="mx-auto mt-2 max-w-prose text-sm leading-6 text-stone-600">
        {description}
      </p>
    </section>
  );
}
