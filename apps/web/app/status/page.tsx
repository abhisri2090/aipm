import { shell, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { CodeBlock } from "../../components/code-block";
import { StatusChecks } from "../../components/status-checks";
import { pageMetadata } from "../../lib/seo";
import { SITE_URL } from "../../lib/registry";

export const metadata = pageMetadata({
  title: "AIPM Registry Status",
  description: "Check whether the AIPM registry and its dependencies are working.",
  path: "/status",
  keywords: ["AIPM status", "AI package registry status", "AIPM health", "AIPM ready"],
});

export default function StatusPage() {
  return (
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "AIPM Registry Status",
            description:
              "Check whether the AIPM registry and its dependencies are working.",
            url: `${SITE_URL}/status`,
            isPartOf: { "@type": "WebSite", name: "AIPM Registry" },
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Status</p>
        <h1>Check if the AIPM registry is working.</h1>
        <p className={shell.lede}>
          Use this page when search, install, or publishing feels stuck. Health means the API is
          running. Readiness means the API can reach its database and package storage.
        </p>
        <div className={shell.actions}>
          <Link className={shell.button} href="/registry">
            Browse registry
          </Link>
          <Link className={cn(shell.button, shell.secondary)} href="/faq">
            Troubleshooting
          </Link>
        </div>
      </section>

      <StatusChecks />

      <article className={cn(docs.doc, docs.wideDoc)}>
        <section>
          <h2>Understanding the status checks</h2>
          <p>
            The AIPM registry runs two separate health endpoints that check different parts of the system.
            The health check confirms the API process is running and can respond to requests.
            The readiness check goes further and verifies that the API can connect to its database and
            package storage backends.
          </p>
          <p>
            When both checks pass, the registry is fully operational. You should be able to search packages,
            install skills, and publish new versions without issues. The checks run automatically and
            update every few seconds on this page.
          </p>
        </section>

        <section>
          <h2>Check from the command line</h2>
          <p>
            Use these curl commands when you want to confirm the API status from a terminal or script.
            These are the same endpoints this page queries, so you can use them in CI pipelines or
            monitoring systems.
          </p>
          <CodeBlock
            code={`curl https://api.aipm-registry.com/health
curl https://api.aipm-registry.com/ready`}
          />
        </section>

        <section>
          <h2>How to read the result</h2>
          <p>
            If health passes but readiness fails, the API is running but a dependency may be down.
            This usually means the database or storage service is temporarily unavailable. In this state,
            you may be able to browse cached content but not publish or install new packages.
          </p>
          <p>
            If both fail, check your internet connection first. Try a different network or wait a few minutes
            for the service to recover. The documentation website is hosted separately and can still load
            while the registry API is unavailable.
          </p>
        </section>

        <section>
          <h2>Reporting issues</h2>
          <p>
            If the registry is down for more than a few minutes, check the{" "}
            <a href="https://github.com/abhisri2090/aipm/issues" rel="noopener noreferrer" target="_blank">
              GitHub issues
            </a>{" "}
            for known outages. You can also report problems there if you encounter persistent failures.
            Include the output of the health and readiness checks when reporting an issue.
          </p>
        </section>
      </article>
    </DocLayout>
  );
}
