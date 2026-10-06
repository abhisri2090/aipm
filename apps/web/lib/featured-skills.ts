import { packagePath } from "./registry";

/**
 * A small, hand-picked set of skill pages that guides and hubs link to.
 *
 * Picked on 2026-10-05 from registry data (GET /v1/skills): every skill here is live, indexable
 * (description plus a GitHub source), not flagged by the scan, and either among the most-installed
 * skills on AIPM or already getting Google impressions on its own page (Search Console, 28 days to
 * 2026-10-02). Summaries are plain-language rewrites of each skill's own description.
 *
 * Links are pinned to the version that was live when this list was made. If a skill publishes a new
 * version, the old page still works; update the version here when you refresh the list.
 */
export type FeaturedSkill = {
  /** Registry package name, e.g. "@anthropics/skill-creator". */
  name: string;
  version: string;
  /** Short, human name shown as the card heading. */
  title: string;
  /** One plain sentence: what the skill helps with. */
  summary: string;
};

export const FEATURED_SKILLS = [
  {
    name: "@anthropics/skill-creator",
    version: "1.0.0",
    title: "Skill creator",
    summary:
      "Helps you write a new skill, or improve one you have, and then test how well it works.",
  },
  {
    name: "@anthropics/frontend-design",
    version: "1.0.0",
    title: "Frontend design",
    summary:
      "Helps the AI design web pages and app screens that look thought-through, not like a template.",
  },
  {
    name: "@anthropics/algorithmic-art",
    version: "1.0.0",
    title: "Algorithmic art",
    summary: "Makes art with code, with settings you can tweak to try new versions.",
  },
  {
    name: "@mattpocock/grill-me",
    version: "1.0.1",
    title: "Grill me",
    summary:
      "Asks you tough questions about a plan or design until the weak spots are clear.",
  },
  {
    name: "@mattpocock/teach",
    version: "1.0.1",
    title: "Teach",
    summary:
      "Teaches you a new idea or skill step by step, using the project you have open.",
  },
  {
    name: "@addyosmani/code-review-and-quality",
    version: "1.0.0",
    title: "Code review and quality",
    summary: "Reviews a code change from several angles before you merge it.",
  },
  {
    name: "@mxyhi/diagnosing-bugs",
    version: "1.0.0",
    title: "Diagnosing bugs",
    summary:
      "Walks the AI through a careful loop to find the real cause of a hard bug or a slowdown.",
  },
  {
    name: "@addyosmani/documentation-and-adrs",
    version: "1.0.0",
    title: "Documentation and decision records",
    summary:
      "Writes down why a design choice was made, so your team can find the reason later.",
  },
  {
    name: "@coreyhaines31/seo-audit",
    version: "1.0.0",
    title: "SEO audit",
    summary:
      "Checks a website for problems that hurt its Google ranking and explains what to fix.",
  },
] as const satisfies readonly FeaturedSkill[];

export type FeaturedSkillName = (typeof FEATURED_SKILLS)[number]["name"];

/** The picks shown on /skills, above the full listing. */
export const SKILLS_HUB_FEATURED: readonly FeaturedSkillName[] = [
  "@anthropics/skill-creator",
  "@anthropics/frontend-design",
  "@mattpocock/grill-me",
  "@addyosmani/code-review-and-quality",
  "@mxyhi/diagnosing-bugs",
  "@coreyhaines31/seo-audit",
];

export function featuredSkillPath(
  skill: Pick<FeaturedSkill, "name" | "version">,
): string {
  return packagePath(skill.name, skill.version);
}

/** Look up featured skills by name, in the order given. Unknown names are skipped. */
export function getFeaturedSkills(names: readonly string[]): FeaturedSkill[] {
  return names
    .map((name) => FEATURED_SKILLS.find((skill) => skill.name === name))
    .filter((skill): skill is (typeof FEATURED_SKILLS)[number] => Boolean(skill));
}
