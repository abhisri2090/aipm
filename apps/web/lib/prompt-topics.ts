export type PromptTopicHub = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  intro: string;
  keywords: readonly string[];
  /** Publisher scope for listed prompts (currently first-party AIPM). */
  publisher: string;
  /** Curated `/prompts/{publisher}/{slug}` targets for this topic. */
  promptSlugs: readonly string[];
  /** ISO date (YYYY-MM-DD) used for sitemap lastmod. */
  updatedAt: string;
};

export const PROMPT_TOPIC_HUBS: readonly PromptTopicHub[] = [
  {
    slug: "linkedin-headshots",
    title: "LinkedIn Headshot AI Prompts",
    h1: "LinkedIn headshot prompts that keep your real face",
    description:
      "Browse AI LinkedIn headshot prompts for corporate, founder, outdoor, and studio looks. Copy a tested prompt and keep your identity intact.",
    intro:
      "These prompts turn a clear selfie into a professional LinkedIn headshot without inventing a new face. Pick a style—classic corporate, modern tech, founder warmth, outdoor natural, or dark studio—then open the full prompt page for variables, models, and sample outputs.",
    keywords: [
      "LinkedIn headshot prompt",
      "AI LinkedIn headshot",
      "professional headshot AI prompt",
      "selfie to LinkedIn photo",
      "ChatGPT headshot prompt",
    ],
    publisher: "aipm",
    promptSlugs: [
      "linkedin-headshot-from-selfie",
      "chatgpt-linkedin-headshot-from-selfie",
      "gemini-linkedin-headshot-nano-banana",
      "linkedin-headshot-classic-corporate",
      "linkedin-headshot-modern-tech",
      "linkedin-headshot-founder-warm",
      "linkedin-headshot-outdoor-natural",
      "linkedin-headshot-dark-studio-executive",
      "chatgpt-tech-founder-headshot",
      "chatgpt-executive-headshot",
      "chatgpt-healthcare-headshot",
    ],
    updatedAt: "2026-09-21",
  },
  {
    slug: "product-photography",
    title: "Product Photography AI Prompts",
    h1: "Product photography prompts for catalog and lifestyle shots",
    description:
      "Browse AI product photography prompts for Midjourney, Flux, and Stable Diffusion—white background, Amazon main images, Shopify lifestyle, and more.",
    intro:
      "Start from a tool-specific product photography prompt, then branch into Amazon main images, Shopify lifestyle scenes, jewelry and skincare heroes, or Etsy natural-light listings. Each linked page keeps its own title, variables, and sample guidance so you are not stuck on a filtered search URL.",
    keywords: [
      "product photography prompt",
      "Midjourney product photography",
      "Flux product photo prompt",
      "Amazon product image prompt",
      "Shopify product photo AI",
    ],
    publisher: "aipm",
    promptSlugs: [
      "mj-product-photography",
      "flux-product-photography",
      "sd-product-photography",
      "mj-product-on-white",
      "mj-amazon-product-main-image",
      "flux-amazon-product-main-image",
      "mj-shopify-lifestyle-product-photo",
      "mj-jewelry-product-photo",
      "mj-skincare-product-hero",
      "photo-etsy-listing-natural-light",
      "photo-etsy-listing-overcast-soft",
    ],
    updatedAt: "2026-09-21",
  },
] as const;

export function getPromptTopicHub(slug: string): PromptTopicHub | undefined {
  return PROMPT_TOPIC_HUBS.find((hub) => hub.slug === slug);
}
