import { SkillsDirectoryPage } from "../../components/skills-directory-page";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "AI Skills Registry",
  description: "Search public AIPM skills by name, tool, or description.",
  path: "/registry",
});

export default function RegistryPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  return <SkillsDirectoryPage searchParams={searchParams} canonicalPath="/registry" />;
}
