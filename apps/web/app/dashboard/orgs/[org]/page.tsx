import { redirect } from "next/navigation";

export default async function OrgPage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  redirect(`/dashboard/orgs?org=${encodeURIComponent(decodeURIComponent(org))}`);
}
