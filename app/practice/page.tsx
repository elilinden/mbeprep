import { Suspense } from "react";
import { PracticeClient } from "@/components/PracticeClient";
import { GlassCard } from "@/components/GlassCard";

export default function PracticePage() {
  return (
    <Suspense fallback={<GlassCard>Loading practice...</GlassCard>}>
      <PracticeClient />
    </Suspense>
  );
}
