import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { loadClaudeSkills, rankBestClaudeSkills, type BestClaudeSkillsData } from "../../lib/best-claude-skills";
import { shell, docs, cn } from "../../lib/page-styles";
import {
  SITE_URL,
  formatGithubStars,
  formatInstallCount,
  installCommand,
  packagePath,
  publisherPath,
  scanBadgeLabel,
  type PackageSummary,
} from "../../lib/registry";
import { pageMetadata } from "../../lib/seo";
import styles from "../compatibility/compatibility.module.css";

export const revalidate = 3600;

const PAGE_PATH = "/best-claude-skills";
const TITLE = "Best Claude Skills: Ranked by GitHub Stars and Installs";
const DESCRIPTION =
  "The best Claude skills in the AIPM registry, ranked with real data: AIPM install counts and source-repo GitHub stars. See top skill collections and install commands.";
const SKILLS_PER_REPO = 6;
const MAX_REPOS = 15;

export const metadata = pageMetadata({
  title: TITLE,
  description: DESCRIPTION,
  path: PAGE_PATH,
  keywords: [
    "best Claude skills",
    "top Claude skills",
    "popular Claude skills",
    "Claude Code skills",
    "Anthropic skills",
    "agent skills",
  ],
});

const faqs = [
  {
    question: "What are the best Claude skills?",
    answer:
      "There is no single best skill; it depends on the job. This page ranks skills with two measurable signals: how many times each skill has been installed through AIPM, and how many GitHub stars its source repository has. Popular collections include skills from Anthropic, Vercel, Matt Pocock, Addy Osmani and Remotion.",
  },
  {
    question: "Do these skills work in the Claude app and in Claude Code?",
    answer:
      "Every skill listed here is a SKILL.md skill marked as compatible with Claude. In Claude Code, AIPM installs it into .claude/skills/<name>/ in your project. For the Claude app, zip the skill folder and upload it under Customize > Skills.",
  },
  {
    question: "Why are GitHub stars shown per repository, not per skill?",
    answer:
      "GitHub stars belong to a repository, and one repository often contains many skills. The star count shows how popular the collection is, not how good each individual skill is. Read the skill before you install it.",
  },
  {
    question: "Are these skills safe to install?",
    answer:
      "Skills that AIPM's automated scan flagged are left out of this list. A clean or not-yet-scanned result is not a security review, so check the files and the source repository before you use a skill on sensitive code.",
  },
];

async function loadData(): Promise<BestClaudeSkillsData | null> {
  try {
    const packages = await loadClaudeSkills();
    if (packages.length === 0) return null;
    return rankBestClaudeSkills(packages);
  } catch {
    return null;
  }
}

function SkillLink({ pkg }: { pkg: PackageSummary }) {
  return (
    <Link className={shell.textLink} href={packagePath(pkg.name, pkg.version)}>
      {pkg.name}
    </Link>
  );
}

export default async function BestClaudeSkillsPage() {
  const data = await loadData();
  const repos = data?.repos.slice(0, MAX_REPOS) ?? [];
  const listed: PackageSummary[] = [];
  const seen = new Set<string>();
  for (const pkg of [...(data?.mostInstalled ?? []), ...repos.flatMap((repo) => repo.skills.slice(0, SKILLS_PER_REPO))]) {
    if (seen.has(pkg.name)) continue;
    seen.add(pkg.name);
    listed.push(pkg);
  }
  const refreshed = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: TITLE,
      description: DESCRIPTION,
      url: `${SITE_URL}${PAGE_PATH}`,
      mainEntity: {
        "@type": "ItemList",
        name: "Best Claude skills",
        itemListOrder: "https://schema.org/ItemListOrderDescending",
        numberOfItems: listed.length,
        itemListElement: listed.map((pkg, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: pkg.name,
          url: `${SITE_URL}${packagePath(pkg.name, pkg.version)}`,
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Skills", item: `${SITE_URL}/skills` },
        { "@type": "ListItem", position: 3, name: "Best Claude skills", item: `${SITE_URL}${PAGE_PATH}` },
      ],
    },
  ];

  return (
    <DocLayout wide>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className={cn(shell.pageHeader, shell.compactPageHeader, shell.pageHeaderNoBorder)}>
        <p className={shell.eyebrow}>Claude skills</p>
        <h1>Best Claude skills, ranked with real registry data</h1>
        <p className={shell.lede}>
          The best Claude skills are the ones people actually install and the collections developers trust.
          This page ranks Claude-compatible skills in the AIPM registry by two measurable signals: AIPM
          install counts and the GitHub stars of each skill&apos;s source repository. No scores are made up.
        </p>
      </section>

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>How this list is ranked</h2>
          <ul>
            <li>
              <strong>Most installed on AIPM</strong> uses the install count the AIPM registry records for each
              skill. Only skills with at least one install appear.
            </li>
            <li>
              <strong>Top skill collections</strong> groups skills by their GitHub source repository and orders
              the repositories by GitHub stars, as last recorded by the registry. Stars measure the whole
              repository, not a single skill.
            </li>
            <li>
              Skills flagged by AIPM&apos;s automated security scan are excluded
              {data ? ` (${data.flaggedExcluded} left out at the last refresh).` : "."} Skills without a
              usable description are left out of the collections list.
            </li>
            <li>
              Data refreshes automatically from the registry.{data ? ` Last refreshed: ${refreshed} (UTC).` : ""}
            </li>
          </ul>
          <p>
            New to skills? Start with{" "}
            <Link className={shell.textLink} href="/guides/what-are-claude-skills">
              what Claude skills are
            </Link>{" "}
            and{" "}
            <Link className={shell.textLink} href="/guides/how-to-install-claude-code-skills">
              how to install Claude skills
            </Link>
            .
          </p>
        </section>

        {!data ? (
          <section>
            <h2>Live rankings are temporarily unavailable</h2>
            <p>
              The registry could not be reached while this page was built. Browse{" "}
              <Link className={shell.textLink} href="/skills/claude">
                Claude skills
              </Link>{" "}
              or the{" "}
              <Link className={shell.textLink} href="/skills">
                full skills registry
              </Link>{" "}
              instead.
            </p>
          </section>
        ) : (
          <>
            <section>
              <h2>Most installed Claude skills on AIPM</h2>
              {data.mostInstalled.length === 0 ? (
                <p>No Claude skill has recorded installs yet.</p>
              ) : (
                <div className={styles.tableWrap}>
                  <table className={styles.matrix}>
                    <thead>
                      <tr>
                        <th scope="col">#</th>
                        <th scope="col">Skill</th>
                        <th scope="col">AIPM installs</th>
                        <th scope="col">Install command</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.mostInstalled.map((pkg, index) => (
                        <tr key={pkg.name}>
                          <td>{index + 1}</td>
                          <th className={styles.formatName} scope="row">
                            <SkillLink pkg={pkg} />
                          </th>
                          <td>{formatInstallCount(pkg.installCount ?? 0)}</td>
                          <td>
                            <code>{installCommand(pkg)}</code>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <p className={styles.note}>
                AIPM is a young registry, so these counts are small. They are real installs, not estimates.
              </p>
            </section>

            <section>
              <h2>Top Claude skill collections by GitHub stars</h2>
              <p>
                {data.eligibleCount} Claude-compatible skills from {data.repos.length} GitHub repositories are
                in the registry. The {repos.length} most-starred collections are below.
              </p>
            </section>

            {repos.map((group, index) => (
              <section key={group.repo.slug}>
                <h3>
                  {index + 1}. {group.repo.slug}{" "}
                  <small>
                    ({formatGithubStars(group.stars)} on GitHub, {group.skills.length}{" "}
                    {group.skills.length === 1 ? "skill" : "skills"})
                  </small>
                </h3>
                <ul>
                  {group.skills.slice(0, SKILLS_PER_REPO).map((pkg) => (
                    <li key={pkg.name}>
                      <SkillLink pkg={pkg} />: {pkg.description}{" "}
                      <small>
                        ({scanBadgeLabel(pkg.scan?.status)}
                        {pkg.installCount ? `, ${formatInstallCount(pkg.installCount)}` : ""})
                      </small>
                      <br />
                      <code>{installCommand(pkg)}</code>
                    </li>
                  ))}
                </ul>
                <p>
                  <a className={shell.textLink} href={group.repo.url} rel="noopener">
                    Source repository
                  </a>
                  {group.publisherSlug && group.skills.length > SKILLS_PER_REPO ? (
                    <>
                      {" · "}
                      <Link className={shell.textLink} href={publisherPath(group.publisherSlug)}>
                        More skills from {group.publisherName}
                      </Link>
                    </>
                  ) : null}
                </p>
              </section>
            ))}
          </>
        )}

        <section>
          <h2>Browse Claude skills by use case</h2>
          <ul>
            <li>
              <Link className={shell.textLink} href="/skills/code-review">
                Code review skills
              </Link>
            </li>
            <li>
              <Link className={shell.textLink} href="/skills/testing">
                Testing skills
              </Link>
            </li>
            <li>
              <Link className={shell.textLink} href="/skills/documentation">
                Documentation skills
              </Link>
            </li>
            <li>
              <Link className={shell.textLink} href="/skills/claude">
                All Claude skills
              </Link>
            </li>
          </ul>
        </section>

        <section>
          <h2>FAQ</h2>
          {faqs.map((faq) => (
            <div key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </div>
          ))}
        </section>
      </article>
    </DocLayout>
  );
}
