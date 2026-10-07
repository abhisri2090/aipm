import { SITE_URL } from "../../lib/registry";
import { buildLlmsFull } from "../../lib/llms-full";

export const dynamic = "force-static";

export function GET() {
  return new Response(buildLlmsFull(SITE_URL), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
