/** First one or two sentences of a skill description, for the visible summary. */
export function skillPlainSummary(description: string): string {
  const text = description.replace(/\s+/g, " ").trim();
  if (!text) return "";
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s|$)/g);
  const summary = sentences?.slice(0, 2).map((sentence) => sentence.trim()).join(" ") || text;
  if (summary.length <= 320) return summary;
  return `${summary.slice(0, 317).trimEnd()}…`;
}

function utcDate(iso: string): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));
}

/** "3 months ago (Sep 4, 2026)". Null when the timestamp is not a real date. */
export function formatSkillAge(iso: string, now = new Date()): string | null {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const date = utcDate(iso);
  const delta = now.getTime() - then.getTime();
  if (delta < 0) return date;
  const days = Math.floor(delta / 86_400_000);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  if (years >= 1) return `${years === 1 ? "1 year ago" : `${years} years ago`} (${date})`;
  if (months >= 1) return `${months === 1 ? "1 month ago" : `${months} months ago`} (${date})`;
  if (days >= 1) return `${days === 1 ? "1 day ago" : `${days} days ago`} (${date})`;
  return `today (${date})`;
}

export function formatUtcDate(iso: string): string | null {
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  return utcDate(iso);
}
