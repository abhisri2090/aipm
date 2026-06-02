import type { Metadata } from "next";
import { SITE_URL } from "./registry";

type SeoInput = {
  title: string;
  description: string;
  path?: string;
};

export function pageMetadata({ title, description, path = "/" }: SeoInput): Metadata {
  const canonical = `${SITE_URL}${path}`;
  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "AIPM",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}
