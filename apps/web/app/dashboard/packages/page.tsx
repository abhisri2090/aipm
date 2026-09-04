import { PackagesDashboard } from "../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Publisher Skills",
  description: "Manage reserved AIPM skill names and publish tokens.",
  path: "/dashboard/packages",
});

export default function DashboardPackagesPage() {
  return <PackagesDashboard />;
}
