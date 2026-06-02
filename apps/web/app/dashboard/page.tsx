import { DashboardHome } from "../../components/dashboard-ui";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Publisher Dashboard",
  description: "Manage AIPM orgs, package reservations, and publish tokens.",
  path: "/dashboard",
});

export default function DashboardPage() {
  return <DashboardHome />;
}
