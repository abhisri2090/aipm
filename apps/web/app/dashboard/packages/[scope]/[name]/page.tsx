import { permanentRedirect } from "next/navigation";

export default async function LegacyPackageDashboardPage({
  params,
}: {
  params: Promise<{ scope: string; name: string }>;
}) {
  const { scope, name } = await params;
  permanentRedirect(`/dashboard/skills/${encodeURIComponent(scope)}/${encodeURIComponent(name)}`);
}
