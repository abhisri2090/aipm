import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { href: "/registry", label: "Registry" },
  { href: "/publish", label: "Publish" },
  { href: "/use", label: "Use" },
  { href: "/resources", label: "Resources" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Header() {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="AIPM home">
        <img alt="" className="brand-mark" src="/aipm-logo.svg" />
        <span>AIPM</span>
      </Link>
      <nav aria-label="Main navigation">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
      <ThemeToggle />
    </header>
  );
}
