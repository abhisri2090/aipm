import { NewOrgForm } from "../../../../components/dashboard-ui";
import { pageMetadata } from "../../../../lib/seo";

export const metadata = pageMetadata({
  title: "Create Org",
  description: "Create an AIPM publisher organization namespace.",
  path: "/dashboard/orgs/new",
});

export default function NewOrgPage() {
  return <NewOrgForm />;
}
