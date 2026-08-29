import { redirect } from "next/navigation";

export default function NewOrgPage() {
  redirect("/dashboard/orgs");
}
