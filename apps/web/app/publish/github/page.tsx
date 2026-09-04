import Link from "next/link";
import { DocLayout } from "../../../components/doc-layout";
import { pageMetadata } from "../../../lib/seo";
import { shell, docs, cn } from "../../../lib/page-styles";

export const metadata = pageMetadata({
  title: "Import a Skill from GitHub",
  description:
    "Import a public GitHub skill you own into AIPM. Review package details, then publish under your org.",
  path: "/publish/github",
  keywords: ["import GitHub skill", "AIPM GitHub import", "publish skill from GitHub"],
});

export default function PublishFromGithubPage() {
  return (
    <DocLayout>
      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Publishing</p>
        <h1>Import a skill from GitHub.</h1>
        <p className={shell.lede}>
          If your skill already lives in a public GitHub repo, you can publish it to AIPM from the
          packages dashboard. You review the package name and details first. The skill files stay
          exactly as they are on GitHub.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/login">
            Sign in
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/dashboard/packages">
            Open packages dashboard
          </Link>
        </div>
      </section>

      <article className={docs.doc}>
        <h2>What you need</h2>
        <ul>
          <li>An AIPM account (GitHub login, or email plus Connect GitHub).</li>
          <li>An organization where you are an owner or admin.</li>
          <li>A public GitHub repo or folder you own, or a GitHub org repo you admin.</li>
          <li>One skill per URL (a folder with <code>SKILL.md</code>, or an entry file you pick).</li>
        </ul>

        <h2>Steps</h2>
        <ol className={docs.flowList}>
          <li>
            Sign in and open the <a href="/dashboard/packages">packages dashboard</a>.
          </li>
          <li>If you signed in with email, choose Connect GitHub so we can verify repo ownership.</li>
          <li>Paste a public GitHub repo or folder URL, then preview.</li>
          <li>
            If there is no root <code>SKILL.md</code>, pick the entry file from the folder file list.
          </li>
          <li>
            Review the package name (under your active org), version, description, and other metadata.
            Skill files are not edited here.
          </li>
          <li>Import. AIPM publishes the package under your org and keeps a link to the GitHub source.</li>
        </ol>

        <h2>Updates</h2>
        <p>
          If that package name already belongs to your org, AIPM publishes a <strong>new version</strong>{" "}
          so the previous one stays available. You can change the version or name before you import.
        </p>

        <h2>What is not supported yet</h2>
        <ul>
          <li>Private GitHub repositories.</li>
          <li>Importing a whole multi-skill collection in one click (paste one skill folder at a time).</li>
          <li>Editing <code>SKILL.md</code> or other GitHub files in the dashboard.</li>
        </ul>

        <h2>Also see</h2>
        <p>
          Prefer the CLI? Follow the <a href="/publish/guide">publishing guide</a> to create and push a
          package from your machine.
        </p>
      </article>
    </DocLayout>
  );
}
