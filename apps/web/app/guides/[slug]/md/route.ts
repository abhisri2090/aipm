import { getSeoGuide, SEO_GUIDES } from "../../../../lib/seo-guides";
import { guideToMarkdown } from "../../../../lib/guide-markdown";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return SEO_GUIDES.map((guide) => ({ slug: guide.slug }));
}

type GuideMarkdownRouteProps = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, { params }: GuideMarkdownRouteProps) {
  const { slug } = await params;
  const guide = getSeoGuide(slug);
  if (!guide) {
    return new Response("Not found\n", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });
  }
  return new Response(guideToMarkdown(guide), {
    headers: { "content-type": "text/markdown; charset=utf-8" },
  });
}
