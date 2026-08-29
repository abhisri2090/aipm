import { redirect } from "next/navigation";

export default async function NewPackagePage({ params }: { params: Promise<{ org: string }> }) {
  const { org } = await params;
  redirect(`/dashboard/packages?org=${encodeURIComponent(decodeURIComponent(org))}`);
}
