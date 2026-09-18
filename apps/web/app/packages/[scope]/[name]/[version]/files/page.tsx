import { permanentRedirect } from "next/navigation";

export default async function LegacyPackageFilesPage({
  params,
}: {
  params: Promise<{ scope: string; name: string; version: string }>;
}) {
  const { scope, name, version } = await params;
  permanentRedirect(
    `/skills/${encodeURIComponent(scope)}/${encodeURIComponent(name)}/${encodeURIComponent(version)}/files`,
  );
}
