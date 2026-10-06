import { SkillsDirectoryPage } from "../../components/skills-directory-page";
import { directoryPageNumber, directoryPagePath } from "../../lib/directory-pagination";
import { pageMetadata, paginatedPageMetadata } from "../../lib/seo";

const skillsMetadata = {
  title: "Agent Skills for Claude, Codex & Cursor",
  description:
    "Browse agent skills for Claude Code, Codex, and Cursor. See what each skill does, check its files, then install it with one command.",
  keywords: [
    "Claude skills",
    "agent skills",
    "Claude skills marketplace",
    "agent skills marketplace",
    "Claude Code skills",
    "Codex skills",
    "Cursor skills",
    "install Claude skills",
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
