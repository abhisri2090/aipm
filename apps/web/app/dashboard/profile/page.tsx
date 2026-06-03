import { ProfileSettings } from "../../../components/dashboard-ui";
import { pageMetadata } from "../../../lib/seo";

export const metadata = pageMetadata({
  title: "Profile Settings",
  description: "Update your AIPM publisher profile.",
  path: "/dashboard/profile",
});

export default function DashboardProfilePage() {
  return <ProfileSettings />;
}

