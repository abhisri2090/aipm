"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOC_NAV_SECTIONS } from "../lib/docs-nav";

export function DocSidebar() {
  const pathname = usePathname();

  return (
    <aside className="doc-sidebar">
      <nav className="doc-nav" aria-label="Documentation">
        <p className="doc-nav-heading">Documentation</p>
        {DOC_NAV_SECTIONS.map((section) => (
          <div className="doc-nav-group" key={section.title}>
            <p className="doc-nav-section">{section.title}</p>
            <ul className="doc-nav-list">
              {section.items.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      className={active ? "doc-nav-link is-active" : "doc-nav-link"}
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                    >
                      {item.label}
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
