import { shell, cards } from "../../lib/page-styles";
import Link from "next/link";
import { DocLayout } from "../../components/doc-layout";
import { pageMetadata } from "../../lib/seo";

export const metadata = pageMetadata({
  title: "AI Skill Resources",
  description:
    "Guides for using, publishing, and understanding AIPM skills.",
  path: "/resources",
  keywords: ["AI skill resources", "AI package manager", "AI publishing guide", "AI best practices"],
});

export default function ResourcesPage() {
  const resources = [
    {
      href: "/ai-practices",
      title: "AI Best Practices",
      body: "How to write AI skills that are clear, safe, and easy to reuse.",
    },
    {
      href: "/thanks",
      title: "Special Thanks",
      body: "People, research, and public work that helped make modern AI tools possible.",
    },
    {
      href: "/discoverability",
      title: "Discoverability Guide",
      body: "Write names, descriptions, and examples that help users find the right skill.",
    },
    {
      href: "/popular-skills",
      title: "Popular Skill Ideas",
      body: "Use a curated starter catalog for code review, testing, docs, security, MCP setup, and more.",
    },
    {
      href: "/skills/cursor",
      title: "Cursor Skills",
      body: "Find public skills that install reusable AI workflows into Cursor projects.",
    },
    {
      href: "/skills/claude",
      title: "Claude Skills",
      body: "Find public skills for Claude and Claude Code project workflows.",
    },
    {
      href: "/skills/code-review",
      title: "Code Review Skills",
      body: "Browse skills for pull request reviews, regressions, missing tests, and security checks.",
    },
    {
      href: "/skills/issue-summarizer",
      title: "Issue Summarizer Skills",
      body: "Browse skills for bugs, incidents, Sentry issues, support tickets, and handoff notes.",
    },
    {
      href: "/skills/testing",
      title: "Testing Skills",
      body: "Browse skills for test writing, verification plans, and regression coverage.",
    },
    {
      href: "/skills/documentation",
      title: "Documentation Skills",
      body: "Browse skills for READMEs, changelogs, runbooks, examples, and onboarding docs.",
    },
    {
      href: "/security",
      title: "Security and Privacy",
      body: "Publish public skills without leaking secrets, customer data, or private notes.",
    },
    {
      href: "/privacy",
      title: "Privacy Notice",
      body: "Learn what data AIPM uses for accounts, packages, tokens, and local settings.",
    },
    {
      href: "/terms",
      title: "Terms and Acceptable Use",
      body: "Understand what is allowed when publishing public packages.",
    },
    {
      href: "/roadmap",
      title: "Product Roadmap",
      body: "See what works now and what is planned next.",
    },
    {
      href: "/changelog",
      title: "Changelog",
      body: "See recent changes to the CLI, registry API, website, and dashboard.",
    },
    {
      href: "/templates",
      title: "Skill Templates",
      body: "Start from a blank, code review, issue summary, or release notes template.",
    },
    {
      href: "/examples",
      title: "Skill Examples",
      body: "Copy full examples for publishing and installing common skills.",
    },
    {
      href: "/glossary",
      title: "Glossary",
      body: "Learn simple meanings for skills, manifests, targets, orgs, and tokens.",
    },
    {
      href: "/targets",
      title: "Supported Targets",
      body: "See where AIPM installs files for Cursor and Claude.",
    },
    {
      href: "/publish/guide",
      title: "Publishing Guide",
      body: "Create a package, reserve a name, get a token, and publish with the CLI.",
    },
    {
      href: "/commands",
      title: "CLI Commands",
      body: "See every install, use, publish, token, and diagnostic command with options.",
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
        <h1>Find the guide you need.</h1>
        <p className={shell.lede}>
          This is the home for AIPM docs. Use it to learn how to install skills, publish packages,
          choose targets, avoid leaks, and fix common problems.
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
