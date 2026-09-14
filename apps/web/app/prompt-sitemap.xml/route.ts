import { buildPromptSitemapXml } from "../../lib/prompt-sitemap";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const xml = await buildPromptSitemapXml();
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
    },
  });
}
