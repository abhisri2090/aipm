import { FEATURED_SKILLS } from "../../lib/featured-skills";
import { packagePath, SITE_URL } from "../../lib/registry";
import { selectSkillsForSitemap, skillSitemapLastmod } from "../../lib/skill-sitemap-gate";
import { listSitemapSkills } from "../../lib/sitemap-skills";
import { urlSetXml, xmlResponse } from "../../lib/sitemap-xml";

export const dynamic = "force-dynamic";

const CURATED_SKILL_NAMES = new Set<string>(FEATURED_SKILLS.map((skill) => skill.name));

export async function GET(): Promise<Response> {
  try {
    const skills = selectSkillsForSitemap(await listSitemapSkills(), CURATED_SKILL_NAMES);
    return xmlResponse(
      urlSetXml(
        skills.map((skill) => ({
          loc: `${SITE_URL}${packagePath(skill.name, skill.version)}`,
          lastmod: skillSitemapLastmod(skill),
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
