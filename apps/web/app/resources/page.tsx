import Link from "next/link";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "AI Skill Resources",
  description:
    "Guides, best practices, acknowledgements, and publishing resources for building project-ready AI skills with AIPM.",
  path: "/resources",
  keywords: ["AI skill resources", "AI package manager", "AI publishing guide", "AI best practices"],
});

export default function ResourcesPage() {
  const resources = [
    {
      href: "/ai-practices",
      title: "AI Best Practices",
      body: "A practical guide for building reusable AI skills, prompts, tool files, and agent workflows.",
    },
    {
      href: "/thanks",
      title: "Special Thanks",
      body: "People, research, conferences, and public work that shaped the modern AI ecosystem.",
    },
    {
      href: "/discoverability",
      title: "Discoverability Guide",
      body: "Write package names, descriptions, examples, and pages that help real users find useful AI skills.",
    },
    {
      href: "/publish",
      title: "Publishing Guide",
      body: "Create a skill package, reserve a name, generate a token, and publish from the CLI.",
    },
    {
      href: "/faq",
      title: "Troubleshooting",
      body: "Answers for install, registry, package, token, and publishing issues.",
    },
  ];

  return (
    <main>
      <section className="page-header">
        <p className="eyebrow">Resources</p>
        <h1>Build better AI skills, then make them reusable.</h1>
        <p className="lede">
          AIPM is more than a registry. These resources collect practical AI working patterns,
          publishing guidance, and acknowledgements for the research and product work that made
          modern AI tooling possible.
        </p>
      </section>

      <section className="guide-grid">
        {resources.map((resource) => (
          <Link className="guide-card" href={resource.href} key={resource.href}>
            <h2>{resource.title}</h2>
            <p>{resource.body}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
