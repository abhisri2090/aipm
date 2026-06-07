export type DocNavItem = {
  href: string;
  label: string;
};

export type DocNavSection = {
  title: string;
  items: DocNavItem[];
};

export const DOC_NAV_SECTIONS: DocNavSection[] = [
  {
    title: "Getting started",
    items: [
      { href: "/resources", label: "Documentation home" },
      { href: "/use", label: "Use AIPM" },
      { href: "/publish/guide", label: "Publishing guide" },
    ],
  },
  {
    title: "Guides",
    items: [
      { href: "/targets", label: "Supported targets" },
      { href: "/popular-skills", label: "Popular skill ideas" },
      { href: "/templates", label: "Skill templates" },
      { href: "/examples", label: "Workflow examples" },
      { href: "/glossary", label: "Glossary" },
    ],
  },
  {
    title: "Quality & discovery",
    items: [
      { href: "/ai-practices", label: "AI best practices" },
      { href: "/discoverability", label: "Discoverability" },
      { href: "/security", label: "Security & safety" },
    ],
  },
  {
    title: "Reference",
    items: [
      { href: "/faq", label: "FAQ & troubleshooting" },
      { href: "/status", label: "Service status" },
      { href: "/changelog", label: "Changelog" },
      { href: "/roadmap", label: "Roadmap" },
    ],
  },
  {
    title: "Legal",
    items: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms of use" },
    ],
  },
  {
    title: "Project",
    items: [
      { href: "/about", label: "About AIPM" },
      { href: "/thanks", label: "Acknowledgements" },
    ],
  },
];

export const DOC_PATHS = DOC_NAV_SECTIONS.flatMap((section) => section.items.map((item) => item.href));

export function isDocPath(pathname: string): boolean {
  return DOC_PATHS.includes(pathname);
}
