import { SettingsDashboard } from "../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Settings",
  description: "Manage AIPM organization profile, defaults, and danger zone actions.",
  path: "/dashboard/settings",
});

export default function DashboardSettingsPage() {
  return <SettingsDashboard />;
}
