"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOC_NAV_SECTIONS } from "../lib/docs-nav";
import { cn } from "../lib/class-names";
import styles from "./doc-sidebar.module.css";

export function DocSidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.docSidebar}>
      <nav aria-label="Documentation">
        <p className={styles.docNavHeading}>Documentation</p>
        {DOC_NAV_SECTIONS.map((section) => (
          <div className={styles.docNavGroup} key={section.title}>
            <p className={styles.docNavSection}>{section.title}</p>
            <ul className={styles.docNavList}>
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
          </div>
        ))}
      </nav>
    </aside>
  );
}
