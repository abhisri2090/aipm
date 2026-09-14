import { NextResponse } from "next/server";
import { SITE_URL } from "../../lib/registry";

/** Keep the old package sitemap URL discoverable after the rename. */
export function GET(): NextResponse {
  return NextResponse.redirect(`${SITE_URL}/ai-skills-sitemap.xml`, 301);
}
