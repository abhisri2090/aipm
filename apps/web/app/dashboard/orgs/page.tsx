import { OrgsDashboard } from "../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Organizations",
  description: "Manage AIPM publisher organizations and workspace selection.",
  path: "/dashboard/orgs",
});

export default function DashboardOrgsPage() {
  return <OrgsDashboard />;
}
