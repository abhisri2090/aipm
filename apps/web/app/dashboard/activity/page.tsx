import { ActivityDashboard } from "../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Activity",
  description: "Review AIPM organization audit activity.",
  path: "/dashboard/activity",
});

export default function DashboardActivityPage() {
  return <ActivityDashboard />;
}
