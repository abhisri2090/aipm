import { ProfileSettings } from "../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Profile Settings",
  description: "Update your AIPM publisher profile.",
  path: "/dashboard/profile",
});

export default function DashboardProfilePage() {
  return <ProfileSettings />;
}
