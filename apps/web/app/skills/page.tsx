import { SkillsDirectoryPage } from "../../components/skills-directory-page";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "AI Agent Skills Registry and Marketplace",
  description: "Browse versioned AI agent skills for Claude Code, Cursor, Codex, code review, testing, documentation, and more. Inspect the source before installing.",
  path: "/skills",
  keywords: [
    "agent skills marketplace",
    "agent skills registry",
    "AI skills library",
    "Cursor skills",
    "Claude Code skills",
    "Codex skills",
  ],
});

export default function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return <SkillsDirectoryPage searchParams={searchParams} canonicalPath="/skills" />;
}
