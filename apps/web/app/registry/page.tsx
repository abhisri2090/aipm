import { SkillsDirectoryPage } from "../../components/skills-directory-page";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "Search the AIPM Skills Registry",
  description: "Search public AIPM skills by package name, supported AI tool, or description.",
  path: "/skills",
});

export default function RegistryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  return <SkillsDirectoryPage searchParams={searchParams} canonicalPath="/skills" />;
}
