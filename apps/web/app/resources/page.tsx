import { shell, cards } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
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
      href: "/security",
      title: "Security and Privacy",
      body: "Publish public AI skills without leaking credentials, customer data, or private project context.",
    },
    {
      href: "/privacy",
      title: "Privacy Notice",
      body: "Understand account data, publisher profiles, public packages, tokens, and local preferences.",
    },
    {
      href: "/terms",
      title: "Terms and Acceptable Use",
      body: "Set expectations for public packages, namespace ownership, publishing behavior, and moderation.",
    },
    {
      href: "/roadmap",
      title: "Product Roadmap",
      body: "See what is available now, what is being hardened next, and what should wait.",
    },
    {
      href: "/changelog",
      title: "Changelog",
      body: "Track product-level updates across the CLI, registry API, website, dashboard, and trust pages.",
    },
    {
      href: "/templates",
      title: "Skill Templates",
      body: "Choose a starter shape for code review, issue summary, release notes, or custom skills.",
    },
    {
      href: "/examples",
      title: "Skill Examples",
      body: "Copy complete publish and install flows for review, triage, release notes, and imports.",
    },
    {
      href: "/glossary",
      title: "Glossary",
      body: "Learn the product terms behind skills, manifests, targets, adapters, orgs, and tokens.",
    },
    {
      href: "/targets",
      title: "Supported Targets",
      body: "Understand Cursor and Claude adapters, install paths, detection, and manifest target values.",
    },
    {
      href: "/publish/guide",
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
    <DocLayout>
      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Resources</p>
        <h1>Build better AI skills, then make them reusable.</h1>
        <p className={shell.lede}>
          Use the documentation tree on the left to move between guides. This page is the home for
          all AIPM docs, including publishing guidance, targets, security, and troubleshooting.
        </p>
      </section>

      <section className={cards.guideGrid}>
        {resources.map((resource) => (
          <Link className={cards.guideCard} href={resource.href} key={resource.href}>
            <h2>{resource.title}</h2>
            <p>{resource.body}</p>
          </Link>
        ))}
      </section>
    </DocLayout>
  );
}
