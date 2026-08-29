"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";
import { DOC_PATHS } from "../lib/docs-nav";
import { cn } from "../lib/class-names";
import styles from "./header.module.css";

const links = [
  { href: "/registry", label: "Registry" },
  { href: "/publish", label: "Publish" },
  { href: "/use", label: "Use" },
  { href: "/resources", label: "Docs" },
  { href: "/login", label: "Login", requiresGuest: true },
  { href: "/dashboard", label: "Dashboard", requiresAuth: true },
];

export function Header() {
  const pathname = usePathname();
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/v1/me", { credentials: "include" })
      .then((response) => {
        if (!cancelled) setLoggedIn(response.ok);
      })
      .catch(() => {
        if (!cancelled) setLoggedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
    <header className={styles.topbar}>
      <div className={styles.topbarInner}>
        <Link className={styles.brand} href="/" aria-label="AIPM home">
          <img alt="" className={styles.brandMark} src="/aipm-logo.svg" />
          <span>AIPM</span>
        </Link>
        <nav className={styles.nav} aria-label="Main navigation">
          {links
            .filter((link) => {
              if (link.requiresGuest && loggedIn === true) return false;
              if (link.requiresAuth && loggedIn !== true) return false;
              return true;
            })
            .map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={cn(styles.topbarLink, active && styles.topbarLinkActive)}
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
