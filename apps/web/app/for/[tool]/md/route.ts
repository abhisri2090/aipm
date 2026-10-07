import { FOR_TOOLS, forToolMarkdown, getForToolLanding, isForToolSlug } from "../../../../lib/for-tool-landings";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return FOR_TOOLS.map((tool) => ({ tool: tool.slug }));
}

type ForToolMarkdownRouteProps = {
  params: Promise<{ tool: string }>;
};

export async function GET(_request: Request, { params }: ForToolMarkdownRouteProps) {
  const { tool: slug } = await params;
  if (!isForToolSlug(slug)) {
    return new Response("Not found\n", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  const tool = getForToolLanding(slug);
  if (!tool) {
    return new Response("Not found\n", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  return new Response(forToolMarkdown(tool), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
