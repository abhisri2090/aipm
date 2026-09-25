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
    slug: "gemini-prompts",
    title: "Gemini Prompts: Tested Prompts for Google Gemini",
    h1: "Gemini prompts for research, work, and photos",
    description:
      "Copy-ready Gemini prompts tested with Google Gemini: stock research with sources, resume tailoring, planning, surveys, plus Nano Banana photo prompts.",
    intro:
      "Every prompt below lists Gemini among the models it was tested with. Each page shows the full prompt, the variables to fill in, example input and output, and usage notes. Most also work in ChatGPT and Claude. For photo edits with Gemini's image model, see the Nano Banana prompts hub.",
    keywords: [
      "Gemini prompts",
      "Google Gemini prompts",
      "best Gemini prompts",
      "Gemini prompt examples",
      "Nano Banana prompts",
    ],
    publisher: "aipm",
    promptSlugs: [
      "us-stock-research-prompt-filings-news-first",
      "compare-two-stocks-with-sources",
      "earnings-report-explained-in-plain-english",
      "monday-market-one-pager-india-or-us",
      "chatgpt-ats-resume-from-jd",
      "biz-lean-canvas",
      "data-survey-analysis-summary",
      "ship-log-every-weekday",
      "learning-streak-coach",
      "gemini-linkedin-headshot-nano-banana",
      "gemini-resume-photo-from-selfie",
    ],
    updatedAt: "2026-09-25",
  },
  {
    slug: "claude-prompts",
    title: "Claude Prompts: Tested Prompts for Claude",
    h1: "Claude prompts for code, analysis, and writing",
    description:
      "Copy-ready Claude prompts for code review, multi-agent planning, incident response, contract review, SQL narratives, and cover letters, each tested with Claude.",
    intro:
      "Every prompt below lists Claude among the models it was tested with. They lean toward the long, structured work people use Claude for: reviewing code, planning features with multiple agents, reading contracts, and turning data into plain-English write-ups. If you reuse a prompt every day, consider turning it into a Claude skill so it loads automatically.",
    keywords: [
      "Claude prompts",
      "Claude AI prompts",
      "best Claude prompts",
      "Claude prompt examples",
      "Claude Code prompts",
    ],
    publisher: "aipm",
    promptSlugs: [
      "code-review-prompt-that-checks-if-it-actually-works",
      "4-agents-to-spec-build-break-and-fix-a-feature",
      "turn-my-workflow-into-a-cursor-skill",
      "incident-commander-kit",
      "code-rate-limit-design-python",
      "meta-output-schema-designer",
      "contract-red-flags-in-plain-english",
      "saas-due-diligence-in-one-sitting",
      "data-sql-to-narrative",
      "3-agents-debate-your-plan-until-it-s-final",
      "chatgpt-cover-letter-from-resume-jd",
      "role-technical-writer",
    ],
    updatedAt: "2026-09-25",
  },
  {
    slug: "nano-banana-prompts",
    title: "Nano Banana Prompts: Gemini Photo Editing Prompts",
    h1: "Nano Banana prompts that keep your real face",
    description:
      "Gemini Nano Banana prompts for editing your own photos: headshots, resume photos, backdrop swaps, outfit try-ons, thumbnails, and listing photos.",
    intro:
      "Nano Banana is the popular name for Google Gemini's image model. These prompts start from a photo you upload and change only what you ask for, such as the backdrop, lighting, outfit, or framing. Each one includes face-lock rules so the result still looks like you. Every prompt lists Gemini among its tested models, and most also work with ChatGPT image generation.",
    keywords: [
      "Nano Banana prompts",
      "Gemini Nano Banana prompt",
      "Gemini photo editing prompts",
      "Gemini image prompts",
      "Nano Banana headshot prompt",
    ],
    publisher: "aipm",
    promptSlugs: [
      "gemini-linkedin-headshot-nano-banana",
      "gemini-resume-photo-from-selfie",
      "selfie-studio-backdrop-swap",
      "selfie-lighting-clutter-cleanup",
      "interview-outfit-try-on",
      "team-speaker-bio-photo",
      "linkedin-banner-from-headshot",
      "linkedin-dp-clay-3d-portrait",
      "youtube-thumbnail-face-lock",
      "group-photo-cleanup",
      "photo-airbnb-listing",
      "photo-before-after-home",
    ],
    updatedAt: "2026-09-25",
  },
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
