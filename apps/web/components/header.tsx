"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { DOC_PATHS } from "../lib/docs-nav";

const links = [
  { href: "/registry", label: "Registry" },
  { href: "/publish", label: "Publish" },
  { href: "/use", label: "Use" },
  { href: "/resources", label: "Docs" },
  { href: "/login", label: "Login" },
];

export function Header() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === "/resources") {
      return DOC_PATHS.includes(pathname);
    }

    if (href === "/registry") {
      return pathname === href || pathname.startsWith("/packages/") || pathname === "/skill";
    }

    if (href === "/publish") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="topbar">
      <div className="topbar-inner">
        <Link className="brand" href="/" aria-label="AIPM home">
          <img alt="" className="brand-mark" src="/aipm-logo.svg" />
          <span>AIPM</span>
        </Link>
        <nav aria-label="Main navigation">
          {links.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={active ? "topbar-link is-active" : "topbar-link"}
                key={link.href}
                href={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
