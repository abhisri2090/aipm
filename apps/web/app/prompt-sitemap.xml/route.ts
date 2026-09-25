import { buildPromptSitemapXml } from "../../lib/prompt-sitemap";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  let xml: string;
  try {
    xml = await buildPromptSitemapXml();
  } catch (error) {
    // Fail closed (never publish a partial prompt list), but as a temporary 503 with
    // Retry-After instead of an unhandled 500, e.g. when the registry API rate-limits (429).
    console.error("prompt-sitemap.xml unavailable:", error instanceof Error ? error.message : error);
    return new Response("Prompt sitemap temporarily unavailable", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "retry-after": "120", "cache-control": "no-store" },
    });
  }
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
    },
  });
}
