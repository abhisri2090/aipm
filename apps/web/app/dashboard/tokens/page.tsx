import { TokensDashboard } from "../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Publish Tokens",
  description: "Generate short-lived AIPM package publish tokens.",
  path: "/dashboard/tokens",
});

export default function DashboardTokensPage() {
  return <TokensDashboard />;
}
