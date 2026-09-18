import { permanentRedirect } from "next/navigation";

export default function LegacyDashboardPackagesPage() {
  permanentRedirect("/dashboard/skills");
}
