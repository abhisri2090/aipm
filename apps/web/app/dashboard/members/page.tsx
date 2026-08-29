import { MembersDashboard } from "../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Members",
  description: "Manage AIPM organization members, roles, and invites.",
  path: "/dashboard/members",
});

export default function DashboardMembersPage() {
  return <MembersDashboard />;
}
