import { redirect } from "next/navigation";
import { packagePath } from "../../lib/registry";

export default async function LegacySkillPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; version?: string }>;
}) {
  const params = await searchParams;
  if (params.name && params.version) {
    redirect(packagePath(params.name, params.version));
  }

  return (
    <main>
      <section className="page-header">
        <p className="eyebrow">Skill details</p>
        <h1>Choose a skill from the registry.</h1>
        <p className="lede">Open a package from the registry results to see its install command and metadata.</p>
      </section>
    </main>
  );
}
