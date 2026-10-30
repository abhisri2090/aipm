import { FEATURED_SKILLS } from "../../lib/featured-skills";
import { GSC_SITEMAP_ALLOWLIST } from "../../lib/gsc-sitemap-allowlist";
import { SITE_URL } from "../../lib/registry";
import { skillSitemapLocs } from "../../lib/skill-sitemap-gate";
import { listSitemapSkills } from "../../lib/sitemap-skills";
import { urlSetXml, xmlResponse } from "../../lib/sitemap-xml";

export const dynamic = "force-dynamic";

const CURATED_SKILL_NAMES = new Set<string>(FEATURED_SKILLS.map((skill) => skill.name));

export async function GET(): Promise<Response> {
  try {
    const skills = skillSitemapLocs(await listSitemapSkills(), CURATED_SKILL_NAMES, GSC_SITEMAP_ALLOWLIST);
    return xmlResponse(
      urlSetXml(
        skills.map((skill) => ({
          loc: `${SITE_URL}${skill.path}`,
          lastmod: skill.lastmod,
        })),
      ),
    );
  } catch (error) {
    console.error("ai-skills-sitemap.xml unavailable:", error instanceof Error ? error.message : error);
    return new Response("Skill sitemap temporarily unavailable", {
      status: 503,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "retry-after": "120",
        "cache-control": "no-store",
      },
    });
  }
}
