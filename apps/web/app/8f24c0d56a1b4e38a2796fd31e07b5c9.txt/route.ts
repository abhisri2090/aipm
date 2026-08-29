export const dynamic = "force-static";

export function GET() {
  return new Response("8f24c0d56a1b4e38a2796fd31e07b5c9", {
    headers: {
      "cache-control": "public, max-age=86400",
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
