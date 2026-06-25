import { Settings } from "lucide-react";

import { PlaceholderPage } from "@/components/shell/placeholder-page";

export default function SettingsPage() {
  return (
    <PlaceholderPage
      description="Manage profile, study, accessibility, and audio preferences from one place."
      icon={Settings}
      status="Use onboarding to edit exam, availability, and accessibility settings."
      title="Settings"
    />
  );
}
