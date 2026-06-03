import { NewOrgForm } from "../../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Create Org",
  description: "Create an AIPM publisher organization namespace.",
  path: "/dashboard/orgs/new",
});

export default function NewOrgPage() {
  return <NewOrgForm />;
}
