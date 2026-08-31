import { PromptsDashboard } from "../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Publisher Prompts",
  description: "Manage prompts published under your AIPM identity.",
  path: "/dashboard/prompts",
});

export default function DashboardPromptsPage() {
  return <PromptsDashboard />;
}
