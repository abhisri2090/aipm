import Link from "next/link";
import { shell, cards, dash, cn } from "../lib/page-styles";
import { CodeBlock } from "./code-block";
import { PackageReadmePreview } from "./package-readme-preview";
import { PackageShareButtons } from "./package-share-buttons";
import {
  commandTargets,
  displayTargets,
  formatBytes,
  formatInstallCount,
  GITHUB_LOGIN_URL,
  installCommand,
  installCommandForTarget,
  isUnverifiedImportedPackage,
  packagePath,
  packageFilesPath,
  packageShortName,
  resolveSkillAbout,
  resolveSkillInvokeCommand,
  shortIntegrity,
  type PackageDetail,
  type PackageSummary,
} from "../lib/registry";

function toSummary(pkg: PackageDetail): PackageSummary {
  return {
    name: pkg.name,
    version: pkg.version,
    description: pkg.manifest.description,
    type: pkg.manifest.type,
    targets: pkg.manifest.targets,
    license: pkg.manifest.license ?? null,
    usage: pkg.manifest.usage ?? null,
    tags: pkg.manifest.tags ?? [],
    categories: pkg.manifest.categories ?? [],
    sourceUrl: pkg.manifest.sourceUrl ?? null,
    integrity: pkg.integrity,
    sizeBytes: pkg.sizeBytes,
    createdAt: pkg.createdAt,
    installCount: pkg.installCount,
    publisher: pkg.publisher,
    import: pkg.import,
  };
}

type PackageDetailViewProps = {
  pkg: PackageDetail;
  canonicalUrl: string;
  showHeader?: boolean;
};

export function PackageDetailView({ pkg, canonicalUrl, showHeader = true }: PackageDetailViewProps) {
  const summary = toSummary(pkg);
  const command = installCommand(summary);
  const about = resolveSkillAbout({
    usage: pkg.manifest.usage,
    agentDescription: pkg.manifest.agentDescription,
  });
  const invokeCommand = resolveSkillInvokeCommand(summary.name);
  const allTargetCommands = commandTargets(summary.targets).map((target) => ({
    target,
    command: installCommandForTarget(summary, target),
  }));
  const targetLabel = displayTargets(summary.targets).join(", ");
  const sourceUrl = pkg.manifest.sourceUrl ?? summary.import?.sourceUrl;
  const badgeMarkdown = `[![Install with AIPM](${new URL(canonicalUrl).origin}/install-with-aipm.svg)](${canonicalUrl})`;

  return (
    <>
      {showHeader ? (
        <section className={shell.pageHeader}>
          <p className={shell.eyebrow}>AIPM package</p>
          <h1>{packageShortName(summary.name)}</h1>
          <p className={shell.lede}>{summary.description}</p>
          <PackageShareButtons title={`${summary.name}@${summary.version}`} url={canonicalUrl} />
          {isUnverifiedImportedPackage(summary) ? (
            <div className={shell.actions}>
              {summary.import?.sourceUrl ? (
                <a className={shell.textLink} href={summary.import.sourceUrl} rel="noreferrer" target="_blank">
                  View source
                </a>
              ) : null}
              <a className={shell.button} href={GITHUB_LOGIN_URL}>
                Claim this skill
              </a>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className={cn(shell.detailGrid, !showHeader && shell.detailGridFlush)}>
        <div className={shell.detailMain}>
          <article className={cn(shell.panel, cards.stepCard, shell.installPanel)}>
            <h2>Install Skill</h2>
            <CodeBlock code={command} />
          </article>

          <article className={cn(shell.panel, cards.stepCard, shell.howToUsePanel)}>
            <h2>How to use</h2>
            <p className={shell.muted}>Install the skill above, then run this in your AI tool:</p>
            <CodeBlock code={invokeCommand} />
          </article>

          {about ? (
            <article className={cn(shell.panel, cards.stepCard)}>
              <h2>About</h2>
              <p className={shell.usageText}>{about}</p>
            </article>
          ) : null}

          <PackageReadmePreview packageName={summary.name} version={summary.version} />
        </div>

        <aside className={cn(shell.panel, cards.stepCard)}>
          <h2>Package details</h2>
          <dl className={shell.packageDetailList}>
            <div className={shell.packageDetailItem}>
              <dt>Publisher</dt>
              <dd>
                {summary.publisher
                  ? `${summary.publisher.user.name ?? `@${summary.publisher.user.githubLogin}`} in @${summary.publisher.org.slug}`
                  : "Unavailable"}
              </dd>
            </div>
            <div className={shell.packageDetailItem}>
              <dt>Package</dt>
              <dd>{summary.name}</dd>
            </div>
            <div className={shell.packageDetailItem}>
              <dt>Version</dt>
              <dd>{summary.version}</dd>
            </div>
            <div className={shell.packageDetailItem}>
              <dt>Targets</dt>
              <dd>{targetLabel}</dd>
            </div>
            {summary.import?.imported ? (
              <div className={shell.packageDetailItem}>
                <dt>Import status</dt>
                <dd>{summary.publisher?.user.verified === false ? "Imported · Unverified" : "Imported"}</dd>
              </div>
            ) : null}
            <div className={shell.packageDetailItem}>
              <dt>License</dt>
              <dd>{summary.license ?? "Not specified"}</dd>
            </div>
            {summary.installCount && summary.installCount > 0 ? (
              <div className={shell.packageDetailItem}>
                <dt>Installs</dt>
                <dd>{formatInstallCount(summary.installCount)}</dd>
              </div>
            ) : null}
            {summary.categories && summary.categories.length > 0 ? (
              <div className={shell.packageDetailItem}>
                <dt>Categories</dt>
                <dd>{summary.categories.join(", ")}</dd>
              </div>
            ) : null}
            {summary.tags && summary.tags.length > 0 ? (
              <div className={shell.packageDetailItem}>
                <dt>Tags</dt>
                <dd>{summary.tags.join(", ")}</dd>
              </div>
            ) : null}
            {sourceUrl ? (
              <div className={shell.packageDetailItem}>
                <dt>Source</dt>
                <dd>
                  <a href={sourceUrl} rel="noreferrer" target="_blank">
                    {sourceUrl}
                  </a>
                </dd>
              </div>
            ) : null}
            <div className={shell.packageDetailItem}>
              <dt>Size</dt>
              <dd>{formatBytes(summary.sizeBytes)}</dd>
            </div>
            <div className={shell.packageDetailItem}>
              <dt>Integrity</dt>
              <dd title={summary.integrity}>{shortIntegrity(summary.integrity)}</dd>
            </div>
            <div className={shell.packageDetailItem}>
              <dt>Published</dt>
              <dd>{new Date(summary.createdAt).toLocaleString()}</dd>
            </div>
            <div className={shell.packageDetailItem}>
              <dt>Entry</dt>
              <dd>{pkg.manifest.entry ?? "Not specified"}</dd>
            </div>
          </dl>
        </aside>
      </section>

      <section className={cn(shell.panelSection, !showHeader && shell.panelSectionFlush)} aria-labelledby="package-content-title">
        <article className={cn(shell.panel, cards.stepCard)}>
          <p className={shell.eyebrow}>Source</p>
          <h2 id="package-content-title">Package content</h2>
          <p className={shell.muted}>Browse manifest, skill files, and license bundled in this package.</p>
          <div className={shell.actions}>
            <Link className={shell.button} href={packageFilesPath(summary.name, summary.version)}>
              View package content
            </Link>
          </div>
        </article>
      </section>

      {showHeader ? (
        <section className={shell.panelSection} aria-labelledby="package-badge-title">
          <article className={cn(shell.panel, cards.stepCard)}>
            <p className={shell.eyebrow}>Share this package</p>
            <h2 id="package-badge-title">Add an Install with AIPM badge</h2>
            <p className={shell.muted}>
              Add this badge to a GitHub README so readers can open the package page and install the same version.
            </p>
            <a href={canonicalUrl} aria-label={`Open ${summary.name}@${summary.version} on AIPM`}>
              <img alt="Install with AIPM" height="28" src="/install-with-aipm.svg" width="154" />
            </a>
            <CodeBlock code={badgeMarkdown} />
          </article>
        </section>
      ) : null}

      <section className={cn(shell.panelSection, !showHeader && shell.panelSectionFlush)} aria-labelledby="publisher-title">
        <article className={cn(shell.panel, shell.publisherPanel)}>
          {summary.publisher?.user.avatarUrl ? (
            <img alt="" className={cn(dash.avatar, dash.avatarLarge)} src={summary.publisher.user.avatarUrl} />
          ) : (
            <span className={cn(dash.avatar, dash.avatarLarge)}>
              {(summary.publisher?.user.name ?? summary.publisher?.user.githubLogin ?? "A").charAt(0).toUpperCase()}
            </span>
          )}
          <div>
            <p className={shell.eyebrow}>Publisher</p>
            <h2 id="publisher-title">
              {summary.publisher ? summary.publisher.org.name : "Publisher identity unavailable"}
            </h2>
            {summary.publisher ? (
              <p className={shell.muted}>
                Reserved under @{summary.publisher.org.slug} by{" "}
                {summary.publisher.user.name ?? `@${summary.publisher.user.githubLogin}`}. This package name belongs
                to an AIPM publisher account.
              </p>
            ) : (
              <p className={shell.muted}>
                This package does not have a linked publisher account. Review it carefully before installing.
              </p>
            )}
          </div>
        </article>
      </section>

      {pkg.manifest.examples && pkg.manifest.examples.length > 0 ? (
        <section className={cn(shell.panelSection, !showHeader && shell.panelSectionFlush)} aria-labelledby="examples-title">
          <div className={shell.sectionHeading}>
            <div>
              <p className={shell.eyebrow}>Prompts</p>
              <h2 id="examples-title">Example ways to use this skill</h2>
            </div>
          </div>
          <div className={cards.exampleGrid}>
            {pkg.manifest.examples.map((example) => (
              <article className={cn(shell.panel, cards.stepCard)} key={`${example.title}-${example.prompt}`}>
                <h3>{example.title}</h3>
                {example.description ? <p>{example.description}</p> : null}
                <CodeBlock code={example.prompt} />
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {pkg.manifest.releaseNotes ? (
        <section className={cn(shell.panelSection, !showHeader && shell.panelSectionFlush)} aria-labelledby="release-notes-title">
          <article className={cn(shell.panel, cards.stepCard)}>
            <p className={shell.eyebrow}>Version notes</p>
            <h2 id="release-notes-title">What changed in {summary.version}</h2>
            <p className={shell.usageText}>{pkg.manifest.releaseNotes}</p>
          </article>
        </section>
      ) : null}

      <section className={cn(shell.panelSection, !showHeader && shell.panelSectionFlush)} aria-labelledby="ai-context-title">
        <article className={cn(shell.panel, cards.stepCard)}>
          <p className={shell.eyebrow}>AI assistant context</p>
          <h2 id="ai-context-title">What this skill is for</h2>
          <p className={shell.usageText}>
            {summary.name}@{summary.version} is an AIPM {summary.type} package for {targetLabel}. Use it when a
            project needs the reusable AI behavior described as: {summary.description}
          </p>
          <dl className={shell.packageDetailList}>
            <div className={shell.packageDetailItem}>
              <dt>Install</dt>
              <dd>{command}</dd>
            </div>
            <div className={shell.packageDetailItem}>
              <dt>Use after install</dt>
              <dd>{invokeCommand}</dd>
            </div>
            {summary.tags && summary.tags.length > 0 ? (
              <div className={shell.packageDetailItem}>
                <dt>Search tags</dt>
                <dd>{summary.tags.join(", ")}</dd>
              </div>
            ) : null}
            {pkg.manifest.examples?.[0] ? (
              <div className={shell.packageDetailItem}>
                <dt>Example prompt</dt>
                <dd>{pkg.manifest.examples[0].prompt}</dd>
              </div>
            ) : null}
            <div className={shell.packageDetailItem}>
              <dt>Canonical page</dt>
              <dd>
                <Link href={packagePath(summary.name, summary.version)}>{canonicalUrl}</Link>
              </dd>
            </div>
          </dl>
        </article>
      </section>

      <section className={cn(shell.panelSection, !showHeader && shell.panelSectionFlush)} aria-labelledby="target-install-title">
        <div className={shell.sectionHeading}>
          <div>
            <p className={shell.eyebrow}>Tool targets</p>
            <h2 id="target-install-title">Install command by target</h2>
          </div>
        </div>
        <div className={cards.exampleGrid}>
          {allTargetCommands.map((targetCommand) => (
            <article className={cn(shell.panel, cards.stepCard)} key={targetCommand.target}>
              <h3>{targetCommand.target}</h3>
              <p>Run this variant when you want to install the package into {targetCommand.target}.</p>
              <CodeBlock code={targetCommand.command} />
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
