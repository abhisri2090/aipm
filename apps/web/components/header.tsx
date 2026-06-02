import Link from "next/link";

const links = [
  { href: "/registry", label: "Registry" },
  { href: "/publish", label: "Publish" },
  { href: "/use", label: "Use" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
];

export function Header() {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="AIPM home">
        <span className="brand-mark">A</span>
        <span>AIPM</span>
      </Link>
      <nav aria-label="Main navigation">
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
