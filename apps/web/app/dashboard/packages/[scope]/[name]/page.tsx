import { PackageDashboard } from "../../../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Package Dashboard",
  description: "Generate publish tokens for a reserved AIPM package.",
});

export default async function PackageDashboardPage({
  params,
}: {
  params: Promise<{ scope: string; name: string }>;
}) {
  const { scope, name } = await params;
  return <PackageDashboard scope={decodeURIComponent(scope)} name={decodeURIComponent(name)} />;
}
