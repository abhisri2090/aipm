import { permanentRedirect } from "next/navigation";

export default async function NewPackagePage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  permanentRedirect(`/dashboard/skills?org=${encodeURIComponent(decodeURIComponent(org))}`);
}
