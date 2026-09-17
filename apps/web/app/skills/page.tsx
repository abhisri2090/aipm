import { SkillsDirectoryPage } from "../../components/skills-directory-page";
import { directoryPageNumber, directoryPagePath } from "../../lib/directory-pagination";
import { pageMetadata } from "../../lib/seo";

const skillsMetadata = {
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
};

type SearchParams = { page?: string; q?: string; category?: string; target?: string; sort?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const currentPage = directoryPageNumber(params.page);
  const filtered = Boolean(params.q || params.category || params.target || params.sort);
  return {
    ...pageMetadata({ ...skillsMetadata, path: filtered ? "/skills" : directoryPagePath("/skills", currentPage) }),
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <SkillsDirectoryPage searchParams={searchParams} canonicalPath="/skills" />;
}
