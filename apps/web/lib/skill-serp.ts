const TRIGGER_PREFIX =
  /^(?:when the user wants|use when(?: the user)?)\b[^,:.]*[,:]\s*/i;
const TRIGGER_CLAUSE =
  /\b(?:when the user wants|use when(?: the user)?|trigger(?:s|ed|ing)?(?:\s+when)?)\b[^.]*(?:\.|$)/gi;

function shortName(packageName: string): string {
  const parts = packageName.replace(/^@/, "").split("/");
  return parts[parts.length - 1] ?? packageName;
}

export type SkillSerpInput = {
  name: string;
  version: string;
  description: string;
  targets: string[];
  displayName?: string | null;
  title?: string | null;
};

export type SkillSerpFields = {
  humanName: string;
  packageId: string;
  toolLabel: "Claude Code" | "Cursor" | "AI Agent";
  title: string;
  metaDescription: string;
  outcomeLine: string;
};

/** Turn a package name segment into Title Case words (`frontend-design` → `Frontend Design`). */
export function humanizePackageSlug(slug: string): string {
  return slug
    .split(/[-_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

export function resolveSkillHumanName(input: Pick<SkillSerpInput, "name" | "displayName" | "title">): string {
  const preferred = input.displayName?.trim() || input.title?.trim();
  if (preferred) return preferred;
  return humanizePackageSlug(shortName(input.name));
}

/** Pick a SERP tool label: primary Cursor/Claude, else multi-target "AI Agent". */
export function resolveSkillToolLabel(targets: string[]): SkillSerpFields["toolLabel"] {
  const concrete = targets.includes("*")
    ? []
    : targets.filter((target) => target === "cursor" || target === "claude");
  if (concrete.length === 1) {
    return concrete[0] === "claude" ? "Claude Code" : "Cursor";
  }
  return "AI Agent";
}

/** Strip agent-trigger prose so meta/lede stay outcome-focused. */
export function skillOutcomeLine(description: string): string {
  const original = description.replace(/\s+/g, " ").trim();
  let text = original.replace(TRIGGER_PREFIX, "").trim();
  text = text.replace(TRIGGER_CLAUSE, " ").replace(/\s+/g, " ").trim();
  text = text.replace(/^[\s,.;:—-]+/, "").trim();
  if (!text) text = original;
  const sentence = text.match(/^(.+?[.!?])(?:\s|$)/)?.[1] ?? text;
  const capped = sentence.charAt(0).toUpperCase() + sentence.slice(1);
  return capped.length > 160 ? `${capped.slice(0, 157).trimEnd()}…` : capped;
}

function fitTitle(humanName: string, toolLabel: SkillSerpFields["toolLabel"]): string {
  const suffix = ` — ${toolLabel} Skill | AIPM`;
  const max = 60;
  if (`${humanName}${suffix}`.length <= max) return `${humanName}${suffix}`;
  const budget = Math.max(8, max - suffix.length);
  const trimmed = humanName.slice(0, budget).trimEnd().replace(/[\s—-]+$/, "");
  return `${trimmed}${suffix}`;
}

export function buildSkillSerpFields(input: SkillSerpInput): SkillSerpFields {
  const humanName = resolveSkillHumanName(input);
  const toolLabel = resolveSkillToolLabel(input.targets);
  const outcomeLine = skillOutcomeLine(input.description);
  const installSuffix = "Install with AIPM";
  const metaDescription = /install with aipm/i.test(outcomeLine)
    ? outcomeLine
    : `${outcomeLine.replace(/[.!?]$/, "")}. ${installSuffix}`;

  return {
    humanName,
    packageId: `${input.name}@${input.version}`,
    toolLabel,
    title: fitTitle(humanName, toolLabel),
    metaDescription,
    outcomeLine,
  };
}
