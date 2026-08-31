"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { DOC_NAV_SECTIONS } from "../lib/docs-nav";
import { cn } from "../lib/class-names";
import styles from "./doc-sidebar.module.css";

function titlesForPath(pathname: string): string[] {
  return DOC_NAV_SECTIONS.filter((section) =>
    section.items.some((item) => item.href === pathname),
  ).map((section) => section.title);
}

export function DocSidebar() {
  const pathname = usePathname();
  const [openTitles, setOpenTitles] = useState(() => new Set(titlesForPath(pathname)));

  useEffect(() => {
    const activeTitles = titlesForPath(pathname);
    if (activeTitles.length === 0) return;
    setOpenTitles((current) => {
      const missing = activeTitles.filter((title) => !current.has(title));
      if (missing.length === 0) return current;
      const next = new Set(current);
      for (const title of missing) next.add(title);
      return next;
    });
  }, [pathname]);

  function toggleSection(title: string) {
    setOpenTitles((current) => {
      const next = new Set(current);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  }

  return (
    <aside className={styles.docSidebar}>
      <nav aria-label="Documentation">
        <p className={styles.docNavHeading}>Documentation</p>
        {DOC_NAV_SECTIONS.map((section) => {
          const open = openTitles.has(section.title);
          const panelId = `doc-nav-${section.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
          return (
            <div className={styles.docNavGroup} key={section.title}>
              <button
                className={styles.docNavSection}
                type="button"
                aria-expanded={open}
                aria-controls={panelId}
                onClick={() => toggleSection(section.title)}
              >
                {section.title}
              </button>
              {open ? (
                <ul className={styles.docNavList} id={panelId}>
                  {section.items.map((link) => {
                    const active = pathname === link.href;
                    return (
                      <li key={link.href}>
                        <Link
                          className={cn(styles.docNavLink, active && styles.docNavLinkActive)}
                          href={link.href}
                          aria-current={active ? "page" : undefined}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
