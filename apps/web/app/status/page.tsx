import { shell, docs, cn } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { CodeBlock } from "../../components/code-block";
import { StatusChecks } from "../../components/status-checks";
import { pageMetadata } from "../../lib/seo";

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
            url: "https://aipm-registry.com/status",
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
          <h2>Check from the command line</h2>
          <CodeBlock
            code={`curl https://aipm-registry.com/health
curl https://aipm-registry.com/ready`}
          />
        </section>

        <section>
          <h2>How to read the result</h2>
          <p>
            If health passes but readiness fails, the API is running but a dependency may be down. If
            both fail, check your connection, try another network, or wait for the service to recover.
            The documentation website can still load while the registry API is unavailable.
          </p>
        </section>
      </article>
    </DocLayout>
  );
}
