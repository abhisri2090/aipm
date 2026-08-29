import { AdminPanel } from "../../components/admin-ui";
import { noIndexPageMetadata } from "../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "AIPM Admin",
  description: "Private AIPM registry usage dashboard.",
  path: "/admin",
});

export default function AdminPage() {
  return <AdminPanel />;
}
