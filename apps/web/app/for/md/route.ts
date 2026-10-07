import { forIndexMarkdown } from "../../../lib/for-tool-landings";

export const dynamic = "force-static";

export function GET() {
  return new Response(forIndexMarkdown(), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
