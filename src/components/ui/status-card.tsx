import type { ReactNode } from "react";

type StatusCardProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
};

export function StatusCard({
  eyebrow,
  title,
  description,
  children,
}: StatusCardProps) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-base font-semibold text-stone-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
      {children ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
