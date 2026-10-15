import { MySkillsDashboard } from "../../../../components/dashboard-ui";
import { noIndexPageMetadata } from "../../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "Your Skills",
  description: "Skills you reserved or published on AIPM.",
  path: "/dashboard/me/skills",
});

export default function MySkillsPage() {
  return <MySkillsDashboard />;
}
