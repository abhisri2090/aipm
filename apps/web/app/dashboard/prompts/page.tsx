import { PromptsDashboard } from "../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Organization Prompts",
  description: "Published prompts in the selected AIPM organization.",
  path: "/dashboard/prompts",
});

export default function DashboardPromptsPage() {
  return <PromptsDashboard />;
}
