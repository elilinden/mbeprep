import type { LucideIcon } from "lucide-react";

import { EmptyState } from "@/components/ui/empty-state";
import { StatusCard } from "@/components/ui/status-card";
import { PageHeader } from "./page-header";

type PlaceholderPageProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  status: string;
};

export function PlaceholderPage({
  icon,
  title,
  description,
  status,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <PageHeader
        description={description}
        eyebrow="Workspace"
        title={title}
      />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <EmptyState
          description="You will see personalized items here after the related study activity creates them."
          icon={icon}
          title="Nothing to show yet"
        />
        <StatusCard
          description={status}
          eyebrow="Status"
          title="Available"
        />
      </div>
    </div>
  );
}
