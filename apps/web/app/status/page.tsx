import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { CodeBlock } from "../../components/code-block";
import { StatusChecks } from "../../components/status-checks";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "AIPM Registry Status",
  description: "Live status checks for AIPM registry liveness, readiness, search, install, and publishing dependencies.",
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
              "Live status checks for AIPM registry liveness, readiness, search, install, and publishing dependencies.",
            url: "https://aipm-registry.com/status",
            isPartOf: { "@type": "WebSite", name: "AIPM Registry" },
          }),
        }}
      />

      <section className="page-header">
        <p className="eyebrow">Status</p>
        <h1>Check whether the AIPM registry is alive and ready.</h1>
        <p className="lede">
          Use this page when search, install, or publishing feels stuck. Liveness means the API
          process is running. Readiness means the registry can reach its metadata and package
          storage dependencies.
        </p>
        <div className="actions">
          <Link className="button" href="/registry">
            Browse registry
          </Link>
          <Link className="button secondary" href="/faq">
            Troubleshooting
          </Link>
        </div>
      </section>

      <StatusChecks />

      <article className="doc wide-doc">
        <section>
          <h2>Command-line checks</h2>
          <CodeBlock
            code={`curl https://aipm-registry.com/health
curl https://aipm-registry.com/ready`}
          />
        </section>

        <section>
          <h2>How to read the result</h2>
          <p>
            If health is OK but readiness fails, the app process is up but a dependency may be
            unavailable. If both fail, check your connection first, then retry from another network
            or wait for the service to recover.
          </p>
        </section>
      </article>
    </DocLayout>
  );
}
