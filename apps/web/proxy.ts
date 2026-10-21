import { NextResponse, type NextRequest } from "next/server";
import { rememberPackageLookup } from "./lib/package-lookup-cache";
import { baseSlugForRemovedVariant } from "./lib/prompt-variant-redirect";
import { packageVersionUrl } from "./lib/registry";
import { isRegistryNotFound } from "./lib/registry-unavailable";

const API = (process.env.AIPM_API_BASE_URL ?? "https://api.aipm-registry.com").replace(/\/$/, "");

function unavailable(): NextResponse {
  return new NextResponse("This page is temporarily unavailable. Try again in a minute.", {
    status: 503,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "retry-after": "60",
      "cache-control": "no-store",
    },
  });
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const skill = request.nextUrl.pathname.match(/^\/skills\/([^/]+)\/([^/]+)\/([^/]+)(?:\/files)?$/);
  if (skill?.[1] && skill[2] && skill[3]) {
    const name = `@${decodeURIComponent(skill[1])}/${decodeURIComponent(skill[2])}`;
    const version = decodeURIComponent(skill[3]);
    const url = packageVersionUrl(name, version);
    try {
      const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(3000) });
      const body = await response.text();
      if (response.ok || isRegistryNotFound(response.status)) {
        rememberPackageLookup(url, response.status, body);
        return NextResponse.next();
      }
      return unavailable();
    } catch {
      return unavailable();
    }
  }

  const prompt = request.nextUrl.pathname.match(/^\/prompts\/([^/]+)\/([^/]+)$/);
  if (prompt?.[1] && prompt[2]) {
    const publisher = decodeURIComponent(prompt[1]);
    const slug = decodeURIComponent(prompt[2]);
    const base = baseSlugForRemovedVariant(slug);
    if (!base) return NextResponse.next();
    try {
      const variant = await fetch(`${API}/v1/prompts/${encodeURIComponent(publisher)}/${encodeURIComponent(slug)}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      });
      if (variant.ok || !isRegistryNotFound(variant.status)) return NextResponse.next();
      const canonical = await fetch(
        `${API}/v1/prompts/${encodeURIComponent(publisher)}/${encodeURIComponent(base)}`,
        { cache: "no-store", signal: AbortSignal.timeout(4000) },
      );
      if (!canonical.ok) return NextResponse.next();
      const data = (await canonical.json()) as { path?: string };
      const path =
        data.path && data.path.startsWith("/prompts/")
          ? data.path
          : `/prompts/${encodeURIComponent(publisher)}/${encodeURIComponent(base)}`;
      return NextResponse.redirect(new URL(path, request.url), 301);
    } catch {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/skills/:slug/:name/:version", "/skills/:slug/:name/:version/files", "/prompts/:publisher/:slug"],
};
