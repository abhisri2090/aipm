import { OrgDashboard } from "../../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Org Dashboard",
  description: "Manage reserved AIPM packages for an organization.",
});

export default async function OrgPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  return <OrgDashboard orgSlug={decodeURIComponent(org)} />;
}
