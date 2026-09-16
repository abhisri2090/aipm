import { SkillsDirectoryPage } from "../../components/skills-directory-page";
import { directoryPageNumber, directoryPagePath } from "../../lib/directory-pagination";
import { pageMetadata } from "../../lib/seo";

const registryMetadata = {
  title: "Search the AIPM Skills Registry",
  description: "Search public AIPM skills by package name, supported AI tool, or description.",
  path: "/skills",
};

type SearchParams = { page?: string; q?: string; category?: string; target?: string; sort?: string };

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const currentPage = directoryPageNumber(params.page);
  const filtered = Boolean(params.q || params.category || params.target || params.sort);
  return {
    ...pageMetadata({ ...registryMetadata, path: filtered ? "/skills" : directoryPagePath("/skills", currentPage) }),
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default function RegistryPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return <SkillsDirectoryPage searchParams={searchParams} canonicalPath="/skills" />;
}
