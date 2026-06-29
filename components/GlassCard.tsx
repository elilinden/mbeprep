import { clsx } from "clsx";
import type { ReactNode } from "react";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  strong?: boolean;
};

export function GlassCard({ children, className, strong = false }: GlassCardProps) {
  return (
    <section
      className={clsx(
        strong ? "glass-strong" : "glass",
        "rounded-[2rem] p-5 transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 md:p-7",
        className
      )}
    >
      {children}
    </section>
  );
}
