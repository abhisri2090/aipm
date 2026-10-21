import Link from "next/link";
import { shell, cards, cn } from "../../lib/page-styles";
import { pageMetadata } from "../../lib/seo";
import tableStyles from "../compatibility/compatibility.module.css";

export const SKILLS_SH_ALTERNATIVE_TITLE = "skills.sh Alternative for Teams";
export const SKILLS_SH_ALTERNATIVE_DESCRIPTION =
  "skills.sh is great for finding skills. AIPM pins one version for Claude Code, Codex, and Cursor so a team installs the same skill.";

export const metadata = pageMetadata({
  title: SKILLS_SH_ALTERNATIVE_TITLE,
  description: SKILLS_SH_ALTERNATIVE_DESCRIPTION,
  path: "/skills-sh-alternative",
  keywords: [
    "skills.sh alternative",
    "pin agent skills",
    "Claude Code skills",
    "Codex skills",
    "Cursor skills",
  ],
});

const faqs = [
  {
    question: "Is AIPM a replacement for skills.sh?",
    answer:
      "No. skills.sh is a large directory and a good way to discover skills. Use AIPM when you want one pinned version, a lockfile, and the same install for Claude Code, Codex, and Cursor.",
  },
  {
    question: "How does a team install the same skill?",
    answer:
      "Run aipm add @scope/name@1.0.0. That writes the version into aipm.package.json and a lockfile. Teammates and CI run aipm install and get that same version.",
  },
  {
    question: "What does the scan on a skill page mean?",
    answer:
      "AIPM checks the skill files for common risky patterns and shows the date of that check. A scan is not an approval. Read the skill text and the source before you install it.",
  },
] as const;

const rows = [
  ["Best at", "Finding skills", "Pinning a version for a team"],
  ["How you install", "npx skills add", "aipm add @scope/name@1.0.0"],
  ["Which version", "Whatever the repo serves that day", "The version you name"],
  ["Team and CI", "Each person runs the install", "Commit the package file and lockfile"],
  ["What you can review", "The GitHub repo", "The skill text, source, scan, and stars"],
  ["Tools", "Many agents, including Claude Code", "Claude Code, Codex, and Cursor"],
];

export default function SkillsShAlternativePage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.map((faq) => ({
              "@type": "Question",
              name: faq.question,
              acceptedAnswer: { "@type": "Answer", text: faq.answer },
            })),
          }),
        }}
      />
      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Compare</p>
        <h1>Pin one skill version for the whole team</h1>
        <p className={shell.lede}>
          skills.sh is bigger, and it is a great place to discover skills. AIPM is the place to pin a version so
          Claude Code, Codex, and Cursor stay on the same skill.
        </p>
      </section>

      <section className={shell.panelSection} aria-labelledby="what-each-does">
        <h2 id="what-each-does">What each one is good at</h2>
        <ul>
          <li>Use skills.sh when you want to browse a large directory and try a skill quickly.</li>
          <li>Use AIPM when the version has to stay put for a project, a teammate, or CI.</li>
        </ul>
      </section>

      <section className={shell.panelSection} aria-labelledby="pin-a-version">
        <h2 id="pin-a-version">Pin a version</h2>
        <ul>
          <li>
            The install command names the version: <code>aipm add @scope/name@1.0.0</code>.
          </li>
          <li>AIPM writes that version into aipm.package.json.</li>
          <li>A lockfile records the files and a checksum, so a later install does not silently change.</li>
        </ul>
      </section>

      <section className={shell.panelSection} aria-labelledby="teams-and-ci">
        <h2 id="teams-and-ci">Teams and CI</h2>
        <ul>
          <li>Commit the package file and the lockfile with the rest of the project.</li>
          <li>A teammate, or CI, runs aipm install and gets the pinned version.</li>
          <li>The same package installs for Claude Code, Codex, and Cursor. You choose the folder with --target.</li>
        </ul>
        <p>
          <Link href="/use">See how a project install works.</Link>
        </p>
      </section>

      <section className={shell.panelSection} aria-labelledby="scan-and-trust">
        <h2 id="scan-and-trust">Scan and trust</h2>
        <ul>
          <li>Each skill page shows the skill text, not only a short description.</li>
          <li>When a scan has run, the page shows the result and the date.</li>
          <li>GitHub stars show when we know them. Install counts show only when someone has actually installed.</li>
        </ul>
        <p>
          <Link href="/security">Read what the scan does and does not check.</Link>
        </p>
      </section>

      <section className={shell.panelSection} aria-labelledby="comparison">
        <h2 id="comparison">Side by side</h2>
        <div className={tableStyles.tableWrap}>
          <table className={tableStyles.matrix}>
            <caption className={tableStyles.note}>skills.sh and AIPM do different jobs.</caption>
            <thead>
              <tr>
                <th scope="col"> </th>
                <th scope="col">skills.sh</th>
                <th scope="col">AIPM</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row[0]}>
                  <th className={tableStyles.formatName} scope="row">
                    {row[0]}
                  </th>
                  <td>{row[1]}</td>
                  <td>{row[2]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={shell.panelSection} aria-labelledby="skills-sh-faq">
        <h2 id="skills-sh-faq">Questions</h2>
        <div className={cards.results}>
          {faqs.map((faq) => (
            <article className={cn(shell.panel, cards.stepCard)} key={faq.question}>
              <h3>{faq.question}</h3>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
        <p>
          Longer notes are in the <Link href="/guides/aipm-vs-skills-sh">AIPM vs skills.sh guide</Link>. Browse{" "}
          <Link href="/skills">skills</Link> or compare <Link href="/for">Claude Code, Cursor, and Codex</Link>.
        </p>
      </section>
    </main>
  );
}
