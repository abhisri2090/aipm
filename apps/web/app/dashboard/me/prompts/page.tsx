import { MyPromptsDashboard } from "../../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Your Prompts",
  description: "Prompts you published on AIPM.",
  path: "/dashboard/me/prompts",
});

export default function MyPromptsPage() {
  return <MyPromptsDashboard />;
}
