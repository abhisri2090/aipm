import { PackagesDashboard } from "../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Publisher Packages",
  description: "Manage reserved AIPM package names and publish tokens.",
  path: "/dashboard/packages",
});

export default function DashboardPackagesPage() {
  return <PackagesDashboard />;
}
