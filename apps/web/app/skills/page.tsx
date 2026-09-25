import { SkillsDirectoryPage } from "../../components/skills-directory-page";
import { directoryPageNumber, directoryPagePath } from "../../lib/directory-pagination";
import { pageMetadata, paginatedPageMetadata } from "../../lib/seo";

const skillsMetadata = {
  title: "Agent Skills Marketplace for Claude, Cursor & Codex",
  description:
    "Browse versioned agent skills for Claude, Claude Code, Cursor, and Codex: code review, testing, docs, marketing, and more. Inspect the source, then install.",
  keywords: [
    "agent skills marketplace",
    "Claude skills marketplace",
    "agent skills registry",
    "AI skills library",
    "Cursor skills",
    "Claude Code skills",
  ],
};

type SearchParams = { page?: string; q?: string; category?: string; target?: string; sort?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const currentPage = directoryPageNumber(params.page);
  const filtered = Boolean(params.q || params.category || params.target || params.sort);
  if (filtered) {
    return {
      ...pageMetadata({ ...skillsMetadata, path: "/skills" }),
      robots: { index: false, follow: true },
    };
  }
  return paginatedPageMetadata({
    ...skillsMetadata,
    path: directoryPagePath("/skills", currentPage),
    page: currentPage,
  });
}

export default function SkillsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <SkillsDirectoryPage searchParams={searchParams} canonicalPath="/skills" />;
}
