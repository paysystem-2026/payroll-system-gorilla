import { Settings } from "lucide-react";
import { PlaceholderPage } from "@/components/common/PlaceholderPage";

export function SettingsPage() {
  return (
    <PlaceholderPage
      title="Settings"
      description="General, security, backup, updates, data transfer, and about"
      icon={Settings}
    />
  );
}
