import { SITE_URL } from "./registry";
import { isNearDuplicatePrompt } from "./prompt-noindex";
import { listAllPrompts } from "./prompts";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Build the prompt urlset. Fails closed if the registry listing is incomplete. */
export async function buildPromptSitemapXml(): Promise<string> {
  const prompts = await listAllPrompts();
  const urls = prompts
    .filter((prompt) => !isNearDuplicatePrompt(prompt.path))
    .map((prompt) => {
      const loc = `${SITE_URL}${prompt.path}`;
      const lastmod = new Date(prompt.updatedAt).toISOString();
      return `<url><loc>${escapeXml(loc)}</loc><lastmod>${lastmod}</lastmod></url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}
