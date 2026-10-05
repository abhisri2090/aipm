import { SkillsDirectoryPage } from "../../components/skills-directory-page";
import { directoryPageNumber, directoryPagePath } from "../../lib/directory-pagination";
import { pageMetadata, paginatedPageMetadata } from "../../lib/seo";

const skillsMetadata = {
  title: "Claude Skills & Agent Skills Marketplace",
  description:
    "Browse Claude skills and agent skills for Claude Code, Cursor and Codex. See what each skill does, check its files, then install it with one command.",
  keywords: [
    "Claude skills",
    "agent skills",
    "Claude skills marketplace",
    "agent skills marketplace",
    "Claude Code skills",
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
