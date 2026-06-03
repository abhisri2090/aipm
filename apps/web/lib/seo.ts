import type { Metadata } from "next";
import { SITE_URL } from "./registry";

const DEFAULT_OG_IMAGE = `${SITE_URL}/og.svg`;

type SeoInput = {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
};

export function pageMetadata({ title, description, path = "/", keywords }: SeoInput): Metadata {
  const canonical = `${SITE_URL}${path}`;
  return {
    title,
    description,
    keywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "AIPM",
      type: "website",
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "AIPM Registry - project-ready AI skills and tool files",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
  };
}
