import { SkillsDirectoryPage } from "../../components/skills-directory-page";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "AI Skills Directory",
  description: "Browse reusable AI skills for Cursor, Claude, Codex, Azure, code review, testing, documentation, and more.",
  path: "/skills",
  keywords: ["AI skills", "agent skills", "Cursor skills", "Claude skills", "Codex skills"],
});

export default function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return <SkillsDirectoryPage searchParams={searchParams} canonicalPath="/skills" />;
}
