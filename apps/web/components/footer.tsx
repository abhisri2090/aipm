import Link from "next/link";
import styles from "./footer.module.css";

const groups = [
  {
    title: "Product",
    links: [
      { href: "/registry", label: "Registry" },
      { href: "/prompts", label: "Prompt directory" },
      { href: "/use", label: "Use AIPM" },
      { href: "/publish", label: "Publish" },
      { href: "/targets", label: "Targets" },
      { href: "/dashboard", label: "Dashboard" },
      { href: "/roadmap", label: "Roadmap" },
    ],
  },
  {
    title: "Resources",
    links: [
      { href: "/resources", label: "Resource hub" },
      { href: "/examples", label: "Examples" },
      { href: "/templates", label: "Templates" },
      { href: "/glossary", label: "Glossary" },
      { href: "/changelog", label: "Changelog" },
      { href: "/ai-practices", label: "AI best practices" },
      { href: "/discoverability", label: "Discoverability" },
      { href: "/compatibility", label: "AI agent file support" },
      { href: "/thanks", label: "Special thanks" },
    ],
  },
  {
    title: "Trust",
    links: [
      { href: "/security", label: "Security" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/status", label: "Status" },
      { href: "/faq", label: "FAQ" },
    ],
  },
];

export function Footer() {
  return (
    <footer className={styles.siteFooter}>
      <div className={styles.footerInner}>
        <section className={styles.footerBrand} aria-label="AIPM summary">
          <Link className={styles.brand} href="/" aria-label="AIPM home">
            <img alt="" className={styles.brandMark} src="/aipm-logo.svg" />
            <span>AIPM</span>
          </Link>
          <p>Project-ready AI skills, prompts, and tool files that teams can publish, find, and install.</p>
        </section>

        <nav className={styles.footerNav} aria-label="Footer navigation">
          {groups.map((group) => (
            <section className={styles.footerGroup} key={group.title}>
              <h2>{group.title}</h2>
              {group.links.map((link) => (
                <Link href={link.href} key={link.href}>
                  {link.label}
                </Link>
              ))}
            </section>
          ))}
        </nav>
      </div>
    </footer>
  );
}
