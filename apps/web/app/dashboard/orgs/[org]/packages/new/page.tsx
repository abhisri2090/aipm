import { NewPackageForm } from "../../../../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Reserve Package",
  description: "Reserve an AIPM package name for publishing.",
});

export default async function NewPackagePage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  return <NewPackageForm orgSlug={decodeURIComponent(org)} />;
}
