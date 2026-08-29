import { DashboardHome } from "../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Publisher Dashboard",
  description: "Manage AIPM orgs, package reservations, and publish tokens.",
  path: "/dashboard",
});

export default function DashboardPage() {
  return <DashboardHome />;
}
