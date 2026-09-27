/**
 * Deterministic internal-link model for prompt pages.
 *
 * Prompts are grouped into "series" by shared slug stem inside a category
 * (e.g. `code-rate-limit-design-{language}`, `linkedin-dp-*`, `edu-project-{subject}-grade-N`),
 * with a small manual override map where the automatic stem is wrong or too coarse.
 * Every prompt page then links to its series siblings ("More in this series"), to its series
 * hub (`/prompts/topics/{slug}`), and to a few prompts from other series in the same category
 * ("Related prompts"), chosen by a stable hash and balanced so inbound links spread evenly.
 *
 * Everything here is pure: the same snapshot always produces the same links, so pages can be
 * cached and scripts/prompt-internal-links.test.mjs can check the whole link graph.
 */

export type PromptLinkRecord = {
  path: string;
  publisher: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
};

export type PromptSeriesMeta = {
  /** Hub slug under /prompts/topics/. Must not collide with curated topic hubs unless `topicHub` is set. */
  slug: string;
  /** Short plural label, e.g. "LinkedIn profile picture (DP) prompts". */
  label: string;
  /** One or two sentences shown on the hub and used in its meta description. */
  blurb: string;
  /** Reuse an existing curated hub in lib/prompt-topics.ts instead of generating a new one. */
  topicHub?: string;
};

export type PromptSeries = {
  /** `${category}/${stem}` */
  id: string;
  stem: string;
  category: string;
  slug: string;
  label: string;
  blurb: string;
  /** Indexable members only, in series sort order. */
  members: PromptLinkRecord[];
  /** Hub page path, or null when the series is too small for a hub. */
  hubPath: string | null;
  /** True when the hub is an existing curated topic hub. */
  curatedHub: boolean;
};

export type PromptLink = { path: string; title: string };

export type PromptInternalLinks = {
  series: PromptSeries | null;
  /** Up to SERIES_LINK_CAP siblings, nearest neighbours by series order (wrapping). */
  seriesLinks: PromptLink[];
  /** Up to RELATED_LINK_CAP prompts from other series in the same category. */
  relatedLinks: PromptLink[];
};

export const SERIES_LINK_CAP = 12;
export const RELATED_LINK_CAP = 6;
/** Automatic sub-series (stem of 2+ slug words) need this many indexable members. */
export const MIN_SUB_SERIES_SIZE = 4;
/** One-word families (e.g. `health-*`) and manual groups need this many. */
export const MIN_SERIES_SIZE = 3;
export const MIN_HUB_SIZE = 3;

/**
 * Manual series assignment where the automatic stem is wrong: tool-prefixed slugs
 * (`chatgpt-*`, `gemini-*`, `mj-*`), one-off slugs that clearly belong to a group,
 * and whole categories that read better as one series.
 * Keys are prompt slugs; values are series stems.
 */
export const SERIES_MEMBER_OVERRIDES: Readonly<Record<string, string>> = {
  // Photo: LinkedIn headshots are one series regardless of the tool prefix (matches the curated hub).
  "chatgpt-linkedin-headshot-from-selfie": "linkedin-headshot",
  "gemini-linkedin-headshot-nano-banana": "linkedin-headshot",
  "chatgpt-executive-headshot": "linkedin-headshot",
  "chatgpt-healthcare-headshot": "linkedin-headshot",
  "chatgpt-tech-founder-headshot": "linkedin-headshot",
  // Photo: old photo restoration.
  "chatgpt-old-photo-colorize": "photo-restoration",
  "chatgpt-old-photo-restore": "photo-restoration",
  "chatgpt-scanned-photo-cleanup": "photo-restoration",
  "restore-old-photo-carefully": "photo-restoration",
  "photo-yearbook-retouch-light": "photo-restoration",
  "group-photo-cleanup": "photo-restoration",
  // Photo: ID, passport and resume photos.
  "chatgpt-eu-cv-photo": "id-resume-photo",
  "chatgpt-passport-style-id-photo": "id-resume-photo",
  "chatgpt-resume-photo-from-selfie": "id-resume-photo",
  "gemini-resume-photo-from-selfie": "id-resume-photo",
  "photo-passport-style": "id-resume-photo",
  "photo-id-badge": "id-resume-photo",
  // Photo: product photography across Midjourney, Flux and SD (matches the curated hub).
  "mj-product-photography": "product-photography",
  "mj-product-on-white": "product-photography",
  "mj-product-backpack": "product-photography",
  "flux-product-photography": "product-photography",
  "sd-product-photography": "product-photography",
  "mj-amazon-product-main-image": "product-photography",
  "flux-amazon-product-main-image": "product-photography",
  "mj-shopify-lifestyle-product-photo": "product-photography",
  "mj-jewelry-product-photo": "product-photography",
  "mj-jewelry-macro": "product-photography",
  "mj-skincare-product-hero": "product-photography",
  "photo-etsy-listing-natural-light": "product-photography",
  "photo-etsy-listing-overcast-soft": "product-photography",
  "photo-ecommerce-ghost-mannequin": "product-photography",
  "photo-product-on-model": "product-photography",
  // Photo: prompts that read a photo and return a plan.
  "closet-to-capsule-wardrobe": "photo-to-plan",
  "identify-object-from-photo": "photo-to-plan",
  "ingredients-photo-to-meals": "photo-to-plan",
  "visualize-room-redesign": "photo-to-plan",
  // Photo: selfie and portrait edits belong with the photo shoot family.
  "selfie-lighting-clutter-cleanup": "photo",
  "selfie-studio-backdrop-swap": "photo",
  "social-profile-photo-crops": "photo",
  "team-speaker-bio-photo": "photo",
  "interview-outfit-try-on": "photo",
  "youtube-thumbnail-face-lock": "photo",
  "flux-portrait-editorial": "photo",
  "sd-logo-vectorish": "mj",
  // Marketing: logo prompts.
  "mj-mascot-logo": "logo",
  "mj-minimal-wordmark-logo": "logo",
  "chatgpt-logo-brief-to-prompts": "logo",
  // Marketing: one-off marketing prompts join the marketing family.
  "adapt-message-across-markets": "marketing",
  "audit-campaign-brief": "marketing",
  "extract-brand-voice": "marketing",
  "landing-page-conversion-audit": "marketing",
  "mine-customer-language": "marketing",
  "repurpose-content-asset": "marketing",
  "sales-cold-email-sequence": "marketing",
  "sales-linkedin-inmail": "marketing",
  // Coding: one-off coding prompts join the coding family.
  "api-test-cases-from-contract": "code",
  "4-agents-to-spec-build-break-and-fix-a-feature": "code",
  "agent-report-card-pass-fail-tests": "code",
  "architecture-diagram-risk-review": "code",
  "explain-legacy-codebase": "code",
  "incident-commander-kit": "code",
  "minimal-bug-reproduction-plan": "code",
  "requirements-to-acceptance-tests": "code",
  "safe-dependency-upgrade-plan": "code",
  "sql-with-validation-plan": "code",
  "turn-my-workflow-into-a-cursor-skill": "code",
  // Productivity.
  "3-agents-debate-your-plan-until-it-s-final": "multi-agent",
  "5-research-agents-dig-1-editor-merges": "multi-agent",
  "turn-one-idea-into-a-4-agent-startup-war-room": "multi-agent",
  "meta-multi-agent-debate": "multi-agent",
  "honest-feedback-prompt-no-sugarcoating": "meta",
  "prompt-that-argues-with-you-until-you-show-proof": "meta",
  "shrink-this-prompt-without-losing-the-rules": "meta",
  "budget-meal-plan-shopping-list": "finance",
  "audit-recurring-expenses": "finance",
  "compare-quotes-hidden-costs": "finance",
  "money-pulse-friday": "finance",
  "plan-pre-mortem": "life",
  "realistic-weekly-planner": "life",
  "brain-dump-to-action-plan": "life",
  "build-sop-from-my-process": "life",
  "find-automation-and-delegation-opportunities": "life",
  "form-to-checklist": "life",
  "home-maintenance-calendar": "life",
  "ideal-daily-operating-system": "life",
  "morning-inbox-triage-agent": "life",
  "relationship-check-in-reminder-pack": "life",
  "sunday-second-brain-reset": "life",
  // Work: stock and portfolio research.
  "4-trading-agents-research-one-stock-together": "stock-research",
  "build-a-portfolio-that-has-a-job-for-every-dollar": "stock-research",
  "bull-vs-bear-stock-debate-then-one-summary": "stock-research",
  "check-my-portfolio-risk-needs-your-holdings-list": "stock-research",
  "compare-two-stocks-with-sources": "stock-research",
  "design-an-income-stream-then-check-its-safety": "stock-research",
  "earnings-report-explained-in-plain-english": "stock-research",
  "find-the-moat-in-a-crowded-industry": "stock-research",
  "hunt-for-repeatable-patterns-not-market-myths": "stock-research",
  "india-stock-research-prompt-pulls-real-data-first": "stock-research",
  "make-the-valuation-math-show-its-work": "stock-research",
  "map-the-economy-s-ripple-effects-across-your-holdings": "stock-research",
  "monday-market-one-pager-india-or-us": "stock-research",
  "read-the-earnings-tea-leaves-before-the-call": "stock-research",
  "screen-stocks-like-goldman-before-you-spend-a-dollar": "stock-research",
  "stress-test-your-portfolio-before-the-storm": "stock-research",
  "turn-price-charts-into-a-clear-trade-map": "stock-research",
  "us-stock-research-prompt-filings-news-first": "stock-research",
  // Work: resume, cover letter and interview prompts.
  "analyze-job-fit": "job-search",
  "chatgpt-ats-resume-from-jd": "job-search",
  "chatgpt-cover-letter-from-resume-jd": "job-search",
  "chatgpt-resume-bullets-from-notes": "job-search",
  "cover-letter-from-jd": "job-search",
  "experience-to-interview-stories": "job-search",
  "interview-prep-from-jd": "job-search",
  "interview-review-prompt-what-went-wrong": "job-search",
  "recruiter-reply-salary-negotiation": "job-search",
  "resume-rewrite-for-jd": "job-search",
  "chatgpt-linkedin-about-from-resume": "linkedin",
  "create-30-60-90-day-plan": "career",
  "performance-review-evidence-pack": "career",
  // Work: data, business and communication one-offs.
  "create-data-dictionary": "data",
  "dashboard-to-executive-narrative": "data",
  "reconcile-conflicting-reports": "data",
  "find-themes-user-feedback": "data",
  "find-spreadsheet-anomalies": "data",
  "3-agents-run-founder-office-hours": "biz",
  "contract-red-flags-in-plain-english": "biz",
  "saas-due-diligence-in-one-sitting": "biz",
  "executive-brief-from-document": "workplace-communication",
  "helpful-customer-support-response": "workplace-communication",
  "meeting-notes-decisions-actions": "workplace-communication",
  "discussion-to-decision-memo": "workplace-communication",
  "messy-process-to-workflow-map": "workplace-communication",
  "multi-audience-stakeholder-update": "workplace-communication",
  "prepare-difficult-conversation": "workplace-communication",
  "ship-log-every-weekday": "workplace-communication",
  "stress-test-product-requirements": "workplace-communication",
  // Learning: learner-side study prompts vs teacher tools.
  "interactive-topic-tutor": "learn",
  "audit-research-paper-methodology": "learn",
  "explain-at-three-levels": "learn",
  "find-understanding-gaps": "learn",
  "learning-streak-coach": "learn",
  "notes-to-spaced-repetition-cards": "learn",
  "project-based-learning-path": "learn",
  "edu-study-plan-exam": "learn",
  "edu-flashcards-anki": "learn",
  "edu-socratic-tutor": "learn",
  "edu-project-based-unit": "edu",
};

/** Merge automatic stems that are too fine-grained into their family. Keys are `${category}/${stem}`. */
export const SERIES_STEM_MERGES: Readonly<Record<string, string>> = {
  "Productivity/meta-prompt": "meta",
  "Productivity/health-habit": "health",
  "Productivity/health-meal": "health",
};

/** Categories whose prompts all form one series (small or loosely themed categories). */
export const WHOLE_CATEGORY_SERIES: Readonly<Record<string, string>> = {
  Playground: "playground",
  Travel: "travel",
};

const INDUSTRY_LABELS: Readonly<Record<string, string>> = {
  agency: "agency",
  "b2b-software": "B2B software",
  coaching: "coaching business",
  cosmetics: "cosmetics brand",
  dental: "dental clinic",
  ecommerce: "ecommerce store",
  edtech: "edtech",
  fintech: "fintech",
  fitness: "fitness studio",
  "law-firm": "law firm",
  "local-service": "local service business",
  nonprofit: "nonprofit",
  "real-estate": "real estate",
  restaurant: "restaurant",
  saas: "SaaS",
};

function industryMeta(): Record<string, PromptSeriesMeta> {
  const meta: Record<string, PromptSeriesMeta> = {};
  for (const [key, label] of Object.entries(INDUSTRY_LABELS)) {
    meta[`Marketing/marketing-${key}`] = {
      slug: `${key}-marketing-prompts`,
      label: `${label.charAt(0).toUpperCase()}${label.slice(1)} marketing prompts`,
      blurb: `Channel-by-channel marketing prompts for a ${label}: cold email, email nurture, paid ads, Instagram Reels, review replies, and SEO pages, all written for the same audience.`,
    };
  }
  return meta;
}

/** Hub copy for every series. Keys are `${category}/${stem}`. */
export const SERIES_META: Readonly<Record<string, PromptSeriesMeta>> = {
  ...industryMeta(),
  // Photo
  "Photo/linkedin-dp": {
    slug: "linkedin-profile-picture-prompts",
    label: "LinkedIn profile picture (DP) prompts",
    blurb:
      "Turn one clear photo into a LinkedIn display picture in a specific setting or art style, from boardroom presenter and keynote speaker to watercolor, clay 3D, and flat vector portraits.",
  },
  "Photo/linkedin-banner": {
    slug: "linkedin-banner-prompts",
    label: "LinkedIn banner prompts",
    blurb:
      "Prompts for the LinkedIn cover image behind your profile photo: name and tagline banners, profession scenes, company brand and campaign backdrops, and banners built from your headshot.",
  },
  "Photo/linkedin-headshot": {
    slug: "linkedin-headshots",
    topicHub: "linkedin-headshots",
    label: "LinkedIn headshot prompts",
    blurb: "Selfie-to-headshot prompts for ChatGPT and Gemini that keep your real face.",
  },
  "Photo/product-photography": {
    slug: "product-photography",
    topicHub: "product-photography",
    label: "Product photography prompts",
    blurb:
      "Catalog, marketplace, and lifestyle product photo prompts for Midjourney, Flux, and Stable Diffusion.",
  },
  "Photo/photo-restoration": {
    slug: "old-photo-restoration-prompts",
    label: "Old photo restoration prompts",
    blurb:
      "Restore, colorize, and clean up scanned or damaged photos without inventing new faces or details.",
  },
  "Photo/id-resume-photo": {
    slug: "passport-and-resume-photo-prompts",
    label: "Passport, ID, and resume photo prompts",
    blurb:
      "Prompts for compliant passport-style photos, ID badges, and CV or resume photos made from a selfie, with rules that keep your likeness intact.",
  },
  "Photo/photo-to-plan": {
    slug: "photo-to-plan-prompts",
    label: "Photo-to-plan prompts",
    blurb:
      "Upload a photo of your closet, fridge, room, or an unknown object and get a practical plan back: a capsule wardrobe, meals, a room redesign, or an identification.",
  },
  "Photo/photo": {
    slug: "photo-shoot-prompts",
    label: "AI photo shoot and photo edit prompts",
    blurb:
      "Photo edit prompts for real-life shoots: author and musician press photos, listings, event photos, thumbnails, backdrop swaps, and selfie cleanups, most in two lighting styles.",
  },
  "Photo/mj": {
    slug: "midjourney-design-prompts",
    label: "Midjourney design asset prompts",
    blurb:
      "Midjourney prompts for design assets: album and book covers, coloring pages, posters, stickers, t-shirt prints, logos, patterns, and interior or architecture concepts.",
  },
  "Photo/mj-art": {
    slug: "midjourney-art-style-prompts",
    label: "Midjourney art style prompts",
    blurb:
      "One Midjourney prompt per art style, from art nouveau and Bauhaus to ukiyo-e, risograph, pixel art, and watercolor botanicals.",
  },
  "Photo/flux-art": {
    slug: "flux-art-style-prompts",
    label: "Flux art style prompts",
    blurb:
      "The same art style library written for Flux: charcoal sketches, comic panels, cyberpunk alleys, stained glass, claymation, and more.",
  },
  "Photo/sd-art": {
    slug: "stable-diffusion-art-style-prompts",
    label: "Stable Diffusion art style prompts",
    blurb:
      "Art style prompts tuned for Stable Diffusion, covering illustration, poster, painting, and 3D looks.",
  },
  // Playground, Fun, Travel
  "Playground/playground": {
    slug: "fun-ai-photo-prompts",
    label: "Fun AI photo and persona prompts",
    blurb:
      "Playful prompts for your photos and personality: action figures, sitcom casts, movie trailers, magazine covers, sticker packs, and honest roasts.",
  },
  "Fun/astrology": {
    slug: "astrology-prompts",
    label: "Astrology prompts",
    blurb:
      "Astrology question prompts about career, money, marriage, relationships, and timing. For entertainment only.",
  },
  "Travel/travel": {
    slug: "travel-planning-prompts",
    label: "Travel planning prompts",
    blurb:
      "Plan trips with constraint-aware itineraries, route planning, packing lists, jet-lag schedules, and travel option comparisons.",
  },
  // Coding
  "Coding/code": {
    slug: "coding-workflow-prompts",
    label: "Coding workflow prompts",
    blurb:
      "Prompts for everyday engineering work: debugging, refactors, code review, test suites, migrations, CI pipelines, threat models, and system design.",
  },
  "Coding/code-adr-writer": {
    slug: "architecture-decision-record-prompts",
    label: "Architecture decision record (ADR) prompts",
    blurb:
      "Write an architecture decision record for a C, Kotlin, PHP, Rust, or TypeScript codebase: context, options, decision, and consequences.",
  },
  "Coding/code-authz-rbac-matrix": {
    slug: "rbac-authorization-matrix-prompts",
    label: "RBAC authorization matrix prompts",
    blurb:
      "Design a role-based access control matrix and enforcement plan, with one prompt per language.",
  },
  "Coding/code-changelog-from-commits": {
    slug: "changelog-from-commits-prompts",
    label: "Changelog from commits prompts",
    blurb:
      "Turn a commit log into a readable changelog and release notes, with language-specific versions.",
  },
  "Coding/code-docstring-generator": {
    slug: "docstring-generator-prompts",
    label: "Docstring generator prompts",
    blurb:
      "Generate idiomatic docstrings and API comments for Go, Java, Python, Ruby, SQL, and Swift code.",
  },
  "Coding/code-feature-flag-plan": {
    slug: "feature-flag-plan-prompts",
    label: "Feature flag rollout plan prompts",
    blurb:
      "Plan a feature flag rollout, kill switch, and cleanup, with one prompt per language.",
  },
  "Coding/code-graphql-schema": {
    slug: "graphql-schema-prompts",
    label: "GraphQL schema design prompts",
    blurb:
      "Design a GraphQL schema, resolvers, and pagination for Go, Java, Python, Ruby, SQL, or Swift backends.",
  },
  "Coding/code-kafka-consumer-design": {
    slug: "kafka-consumer-design-prompts",
    label: "Kafka consumer design prompts",
    blurb:
      "Design a Kafka consumer with retries, idempotency, and dead-letter handling, with one prompt per language.",
  },
  "Coding/code-load-test-plan": {
    slug: "load-test-plan-prompts",
    label: "Load test plan prompts",
    blurb:
      "Write a load test plan with scenarios, targets, and pass/fail thresholds for Go, Java, Python, Ruby, or Swift services.",
  },
  "Coding/code-observability-checklist": {
    slug: "observability-checklist-prompts",
    label: "Observability checklist prompts",
    blurb:
      "Logging, metrics, tracing, and alerting checklists for a service, with one prompt per language.",
  },
  "Coding/code-rate-limit-design": {
    slug: "rate-limit-design-prompts",
    label: "API rate limit design prompts",
    blurb:
      "Design API rate limiting (token bucket, sliding window, quotas, and 429 handling) for Go, Java, Python, SQL, or Swift.",
  },
  // Productivity
  "Productivity/meta": {
    slug: "prompt-engineering-prompts",
    label: "Prompt engineering (meta) prompts",
    blurb:
      "Prompts that write, critique, compress, test, and improve other prompts: few-shot builders, eval rubrics, guardrails, output schemas, and system prompt builders.",
  },
  "Productivity/health": {
    slug: "health-and-wellness-prompts",
    label: "Health and wellness routine prompts",
    blurb:
      "Non-medical wellness prompts for habits, sleep, movement, meals, hydration, and stress, written as routines you can follow.",
  },
  "Productivity/life": {
    slug: "personal-productivity-prompts",
    label: "Personal productivity prompts",
    blurb:
      "Plan your week, run a shutdown ritual, triage your inbox, set personal OKRs, and turn brain dumps into action plans.",
  },
  "Productivity/role": {
    slug: "role-system-prompts",
    label: "Role and persona system prompts",
    blurb:
      "System prompts that set an AI up as a specific expert: editor, staff engineer reviewer, career coach, negotiation coach, QA lead, and more.",
  },
  "Productivity/finance": {
    slug: "personal-finance-prompts",
    label: "Personal finance prompts",
    blurb:
      "Budget, debt paydown, emergency fund, subscription audit, and tax checklist prompts for households and freelancers.",
  },
  "Productivity/multi-agent": {
    slug: "multi-agent-prompts",
    label: "Multi-agent prompts",
    blurb:
      "Prompts that run several AI roles against each other, such as debaters, researchers and an editor, or a startup war room, so the final answer is stress-tested.",
  },
  // Work
  "Work/career": {
    slug: "career-prompts",
    label: "Career and workplace prompts",
    blurb:
      "Prompts for promotions, offers, negotiations, resignations, networking, and 30-60-90 day plans, many with role-specific versions.",
  },
  "Work/career-returnship-application": {
    slug: "returnship-application-prompts",
    label: "Returnship application prompts",
    blurb:
      "Returnship applications that explain a career break with confidence, in design, operations, product, and sales versions.",
  },
  "Work/career-volunteer-impact-bullets": {
    slug: "volunteer-impact-bullet-prompts",
    label: "Volunteer impact resume bullet prompts",
    blurb:
      "Turn volunteer work into measurable resume bullets for design, operations, sales, or tech roles.",
  },
  "Work/job-search": {
    slug: "resume-and-interview-prompts",
    label: "Resume, cover letter, and interview prompts",
    blurb:
      "Tailor your resume and cover letter to a job description, prepare interview stories, and review how an interview went.",
  },
  "Work/linkedin": {
    slug: "linkedin-profile-writing-prompts",
    label: "LinkedIn profile writing prompts",
    blurb:
      "Rewrite your LinkedIn headline, About section, and experience bullets, audit your profile like a recruiter, and write posts and connection requests.",
  },
  "Work/stock-research": {
    slug: "stock-research-prompts",
    label: "Stock and portfolio research prompts",
    blurb:
      "Research prompts that pull filings and news first: compare stocks, read earnings, stress-test a portfolio, and check valuation math. Research only, not investment advice.",
  },
  "Work/data": {
    slug: "data-analysis-prompts",
    label: "Data analysis and analytics prompts",
    blurb:
      "Prompts for KPI trees, metric definitions, cohort and funnel narratives, experiment write-ups, tracking plans, and turning SQL or dashboards into plain English.",
  },
  "Work/design": {
    slug: "product-design-prompts",
    label: "Product design and UX prompts",
    blurb:
      "UX critiques, accessibility reviews, design specs, error and empty state copy, personas, and handoff notes.",
  },
  "Work/biz": {
    slug: "startup-business-prompts",
    label: "Startup and business planning prompts",
    blurb:
      "Lean canvas, board updates, investor emails, pitch deck outlines, OKRs, pricing strategy, hiring plans, and contract red flags.",
  },
  "Work/sales": {
    slug: "sales-prompts",
    label: "B2B sales prompts",
    blurb:
      "Discovery scripts, battlecards, objection handling, MEDDIC prep, mutual action plans, QBRs, renewals, and RFP responses.",
  },
  "Work/finance": {
    slug: "business-finance-prompts",
    label: "Business finance prompts",
    blurb:
      "Cash flow narratives, runway scenarios, board financial summaries, monthly close checklists, and invoice follow-ups.",
  },
  "Work/workplace-communication": {
    slug: "workplace-communication-prompts",
    label: "Meeting, memo, and stakeholder update prompts",
    blurb:
      "Turn meetings, documents, and discussions into decisions, briefs, and updates for different audiences.",
  },
  // Learning
  "Learning/edu-lesson-plan": {
    slug: "lesson-plan-prompts",
    label: "Lesson plan prompts",
    blurb:
      "Lesson plans by subject and grade, from grade 6 algebra to undergraduate statistics.",
  },
  "Learning/edu-quiz": {
    slug: "quiz-generator-prompts",
    label: "Quiz generator prompts",
    blurb: "Quiz prompts by subject and level, plus a quiz-from-your-notes generator.",
  },
  "Learning/edu-project": {
    slug: "student-project-brief-prompts",
    label: "Student mini project brief prompts",
    blurb:
      "Mini project briefs by subject and grade, from grade 8 biology to adult-learner psychology.",
  },
  "Learning/edu-study-guide": {
    slug: "study-guide-prompts",
    label: "Study guide prompts",
    blurb:
      "Study guides by subject and level, from grade 6 physics to undergraduate economics.",
  },
  "Learning/edu": {
    slug: "teacher-prompts",
    label: "Teacher and classroom prompts",
    blurb:
      "Classroom tools for teachers: differentiated worksheets, rubrics, IEP goal drafts, parent emails, lab safety briefs, and project-based units.",
  },
  "Learning/learn": {
    slug: "self-study-prompts",
    label: "Self-study and learning prompts",
    blurb:
      "Learn faster on your own: Socratic tutoring, explanations at three levels, spaced-repetition flashcards, exam study plans, and learning paths.",
  },
  // Marketing
  "Marketing/marketing": {
    slug: "marketing-copy-prompts",
    label: "Marketing copy and strategy prompts",
    blurb:
      "Landing pages, email sequences, ad copy, SEO outlines, launch posts, brand voice, and campaign briefs.",
  },
  "Marketing/video": {
    slug: "video-and-youtube-prompts",
    label: "Video and YouTube prompts",
    blurb:
      "Scripts, hooks, B-roll shot lists, chapter titles, thumbnails, end screens, and series bibles for YouTube and short-form video.",
  },
  "Marketing/logo": {
    slug: "logo-design-prompts",
    label: "Logo design prompts",
    blurb:
      "Mascot and wordmark logo prompts for Midjourney, plus a brief-to-prompts generator for ChatGPT.",
  },
};

// ---------------------------------------------------------------------------------------------
// Helpers

export function compareSlugs(a: string, b: string): number {
  return a.localeCompare(b, "en", { numeric: true, sensitivity: "base" });
}

/** FNV-1a 32-bit: stable across runs and platforms (never Math.random). */
export function stableHash(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function tokens(slug: string): string[] {
  return slug.toLowerCase().split("-").filter(Boolean);
}

function hasPrefix(words: string[], prefix: string[]): boolean {
  return words.length > prefix.length && prefix.every((word, i) => words[i] === word);
}

function titleCaseStem(stem: string): string {
  return stem
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ---------------------------------------------------------------------------------------------
// Series grouping

/** Assign every indexable prompt to a series stem (or null for a true one-off). */
export function assignSeriesStems(
  prompts: readonly PromptLinkRecord[],
): Map<string, string | null> {
  const result = new Map<string, string | null>();
  const byCategory = new Map<string, PromptLinkRecord[]>();
  for (const prompt of prompts) {
    const list = byCategory.get(prompt.category) ?? [];
    list.push(prompt);
    byCategory.set(prompt.category, list);
  }

  for (const [category, list] of byCategory) {
    const whole = WHOLE_CATEGORY_SERIES[category];
    if (whole) {
      for (const prompt of list)
        result.set(prompt.path, SERIES_MEMBER_OVERRIDES[prompt.slug] ?? whole);
      continue;
    }
    const automatic = list.filter((prompt) => !SERIES_MEMBER_OVERRIDES[prompt.slug]);
    const words = new Map(automatic.map((prompt) => [prompt.path, tokens(prompt.slug)]));
    const countWithPrefix = (prefix: string[]) =>
      automatic.filter((prompt) => hasPrefix(words.get(prompt.path) ?? [], prefix))
        .length;

    // 1. Longest stem of 2+ words shared by at least MIN_SUB_SERIES_SIZE prompts.
    const stems = new Map<string, string | null>();
    for (const prompt of automatic) {
      const w = words.get(prompt.path) ?? [];
      let stem: string | null = null;
      for (let k = w.length - 1; k >= 2; k -= 1) {
        if (countWithPrefix(w.slice(0, k)) >= MIN_SUB_SERIES_SIZE) {
          stem = w.slice(0, k).join("-");
          break;
        }
      }
      stems.set(prompt.path, stem);
    }
    // 2. Otherwise the one-word family (e.g. `health`), counting overrides into that family too.
    const familySize = new Map<string, number>();
    const familyOf = (prompt: PromptLinkRecord) => tokens(prompt.slug)[0] ?? "";
    for (const prompt of automatic) {
      if (stems.get(prompt.path)) continue;
      familySize.set(familyOf(prompt), (familySize.get(familyOf(prompt)) ?? 0) + 1);
    }
    for (const prompt of list) {
      const override = SERIES_MEMBER_OVERRIDES[prompt.slug];
      if (override) familySize.set(override, (familySize.get(override) ?? 0) + 1);
    }
    for (const prompt of list) {
      const override = SERIES_MEMBER_OVERRIDES[prompt.slug];
      let stem: string | null = override ?? stems.get(prompt.path) ?? null;
      if (!stem) {
        const family = familyOf(prompt);
        stem = (familySize.get(family) ?? 0) >= MIN_SERIES_SIZE ? family : null;
      }
      if (stem) stem = SERIES_STEM_MERGES[`${category}/${stem}`] ?? stem;
      result.set(prompt.path, stem);
    }
  }
  return result;
}

export function groupPromptSeries(
  prompts: readonly PromptLinkRecord[],
  options: { topicHubSlugs?: ReadonlySet<string> } = {},
): PromptSeries[] {
  const stems = assignSeriesStems(prompts);
  const groups = new Map<
    string,
    { stem: string; category: string; members: PromptLinkRecord[] }
  >();
  for (const prompt of prompts) {
    const stem = stems.get(prompt.path);
    if (!stem) continue;
    const id = `${prompt.category}/${stem}`;
    const group = groups.get(id) ?? { stem, category: prompt.category, members: [] };
    group.members.push(prompt);
    groups.set(id, group);
  }

  const series: PromptSeries[] = [];
  for (const [id, group] of groups) {
    if (group.members.length < MIN_SERIES_SIZE) continue;
    const members = [...group.members].sort(
      (a, b) => compareSlugs(a.slug, b.slug) || a.path.localeCompare(b.path),
    );
    const meta = SERIES_META[id];
    const slug = meta?.slug ?? `${group.stem}-prompts`;
    const curatedHub = Boolean(
      meta?.topicHub && options.topicHubSlugs?.has(meta.topicHub),
    );
    series.push({
      id,
      stem: group.stem,
      category: group.category,
      slug: curatedHub && meta?.topicHub ? meta.topicHub : slug,
      label: meta?.label ?? `${titleCaseStem(group.stem)} prompts`,
      blurb:
        meta?.blurb ??
        `${members.length} related ${group.category.toLowerCase()} prompts that share one template.`,
      members,
      hubPath:
        members.length >= MIN_HUB_SIZE
          ? `/prompts/topics/${curatedHub && meta?.topicHub ? meta.topicHub : slug}`
          : null,
      curatedHub,
    });
  }
  return series.sort(
    (a, b) => b.members.length - a.members.length || a.id.localeCompare(b.id),
  );
}

// ---------------------------------------------------------------------------------------------
// Link selection

function toLink(prompt: PromptLinkRecord): PromptLink {
  return { path: prompt.path, title: prompt.title };
}

/**
 * Nearest neighbours in series order, wrapping around: half before and half after the prompt.
 * `position` is the prompt's index in `members` or, for a prompt outside the list, the index it
 * would be inserted at.
 */
export function seriesNeighbours(
  members: readonly PromptLinkRecord[],
  position: number,
  isMember: boolean,
  cap = SERIES_LINK_CAP,
): PromptLinkRecord[] {
  const n = members.length;
  const others = isMember ? n - 1 : n;
  if (others <= 0) return [];
  if (others <= cap) {
    const start = isMember ? position + 1 : position;
    return Array.from({ length: others }, (_, k) => members[(start + k) % n]);
  }
  const before = Math.floor(cap / 2);
  const after = cap - before;
  const picked: PromptLinkRecord[] = [];
  for (let k = before; k >= 1; k -= 1)
    picked.push(members[(((position - k) % n) + n) % n]);
  const first = isMember ? position + 1 : position;
  for (let k = 0; k < after; k += 1) picked.push(members[(first + k) % n]);
  return picked;
}

/** Related-link balancing works on inbound-count buckets of this size (smaller = stricter balance). */
export const RELATED_BALANCE_BUCKET = 3;

const STOP_WORDS = new Set(
  "a an and the for to of in on with from your my you me i it its is at by as or into that this than then be are chatgpt prompt prompts gemini claude midjourney flux sd".split(
    " ",
  ),
);
const wordCache = new Map<string, Set<string>>();

function significantWords(
  prompt: Pick<PromptLinkRecord, "path" | "slug"> & { title?: string },
): Set<string> {
  const cached = wordCache.get(prompt.path);
  if (cached) return cached;
  const words = new Set(
    `${prompt.slug} ${prompt.title ?? ""}`
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word)),
  );
  wordCache.set(prompt.path, words);
  return words;
}

function sharedWordCount(a: Set<string>, b: Set<string>): number {
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return shared;
}

const CATEGORY_FALLBACKS: Readonly<Record<string, readonly string[]>> = {
  Fun: ["Playground"],
  Playground: ["Fun", "Photo"],
  Travel: ["Productivity"],
};

export type PromptLinkGraph = {
  series: PromptSeries[];
  seriesBySlug: Map<string, PromptSeries>;
  seriesByPath: Map<string, PromptSeries>;
  indexable: PromptLinkRecord[];
  indexableByPath: Map<string, PromptLinkRecord>;
  relatedByPath: Map<string, PromptLinkRecord[]>;
  linksFor(
    prompt: Pick<PromptLinkRecord, "path" | "slug" | "category">,
    options?: { keptPath?: string },
  ): PromptInternalLinks;
};

/**
 * Build the whole link graph once per snapshot.
 * `prompts` should contain every published prompt; `noindexPaths` are never used as link targets.
 */
export function buildPromptLinkGraph(
  prompts: readonly PromptLinkRecord[],
  noindexPaths: ReadonlySet<string>,
  options: { topicHubSlugs?: ReadonlySet<string> } = {},
): PromptLinkGraph {
  const indexable = prompts.filter((prompt) => !noindexPaths.has(prompt.path));
  const indexableByPath = new Map(indexable.map((prompt) => [prompt.path, prompt]));
  const series = groupPromptSeries(indexable, options);
  const seriesBySlug = new Map(series.map((item) => [item.slug, item]));
  const seriesByPath = new Map<string, PromptSeries>();
  for (const item of series)
    for (const member of item.members) seriesByPath.set(member.path, item);

  // Inbound counts from series links and hubs, so related links go where they are needed most.
  const inbound = new Map<string, number>(indexable.map((prompt) => [prompt.path, 0]));
  const bump = (path: string) => inbound.set(path, (inbound.get(path) ?? 0) + 1);
  const seriesLinksByPath = new Map<string, PromptLinkRecord[]>();
  for (const item of series) {
    item.members.forEach((member, index) => {
      const neighbours = seriesNeighbours(item.members, index, true);
      seriesLinksByPath.set(member.path, neighbours);
      for (const neighbour of neighbours) bump(neighbour.path);
      if (item.hubPath) bump(member.path);
    });
  }

  const byCategory = new Map<string, PromptLinkRecord[]>();
  for (const prompt of indexable) {
    const list = byCategory.get(prompt.category) ?? [];
    list.push(prompt);
    byCategory.set(prompt.category, list);
  }

  const pickRelated = (
    source: Pick<PromptLinkRecord, "path" | "slug" | "category"> & { title?: string },
    sourceSeries: PromptSeries | null,
    exclude: ReadonlySet<string>,
    counts: Map<string, number> | null,
  ): PromptLinkRecord[] => {
    const pools = [source.category, ...(CATEGORY_FALLBACKS[source.category] ?? [])];
    const picked: PromptLinkRecord[] = [];
    const taken = new Set<string>([source.path, ...exclude]);
    const sourceWords = significantWords(source);
    const rank = (candidates: PromptLinkRecord[]) =>
      candidates
        .map((candidate) => ({
          candidate,
          // Coarse buckets keep inbound links balanced while leaving room for relevance.
          bucket: Math.floor((counts?.get(candidate.path) ?? 0) / RELATED_BALANCE_BUCKET),
          overlap: sharedWordCount(sourceWords, significantWords(candidate)),
          hash: stableHash(`${source.path}>${candidate.path}`),
        }))
        .sort(
          (a, b) =>
            a.bucket - b.bucket ||
            b.overlap - a.overlap ||
            a.hash - b.hash ||
            a.candidate.path.localeCompare(b.candidate.path),
        );
    const take = (candidates: PromptLinkRecord[]) => {
      for (const { candidate } of rank(candidates)) {
        if (picked.length >= RELATED_LINK_CAP) return;
        if (taken.has(candidate.path)) continue;
        picked.push(candidate);
        taken.add(candidate.path);
      }
    };
    for (const category of pools) {
      if (picked.length >= RELATED_LINK_CAP) break;
      const pool = (byCategory.get(category) ?? []).filter(
        (candidate) => !sourceSeries || seriesByPath.get(candidate.path) !== sourceSeries,
      );
      take(pool);
    }
    if (picked.length < RELATED_LINK_CAP)
      take(
        indexable.filter(
          (candidate) => seriesByPath.get(candidate.path) !== sourceSeries,
        ),
      );
    return picked;
  };

  // Greedy balanced assignment in stable-hash order: each source takes the least-linked eligible
  // targets first (ties broken by a per-pair hash), so inbound links spread across all pages.
  const relatedByPath = new Map<string, PromptLinkRecord[]>();
  const order = [...indexable].sort(
    (a, b) => stableHash(a.path) - stableHash(b.path) || a.path.localeCompare(b.path),
  );
  for (const source of order) {
    const sourceSeries = seriesByPath.get(source.path) ?? null;
    const exclude = new Set(
      (seriesLinksByPath.get(source.path) ?? []).map((link) => link.path),
    );
    const picked = pickRelated(source, sourceSeries, exclude, inbound);
    for (const target of picked) bump(target.path);
    relatedByPath.set(source.path, picked);
  }

  const seriesForOutsider = (
    prompt: Pick<PromptLinkRecord, "path" | "slug" | "category">,
    keptPath?: string,
  ): PromptSeries | null => {
    if (keptPath && seriesByPath.has(keptPath)) return seriesByPath.get(keptPath) ?? null;
    const override = SERIES_MEMBER_OVERRIDES[prompt.slug];
    if (override) {
      const match = series.find(
        (item) => item.category === prompt.category && item.stem === override,
      );
      if (match) return match;
    }
    // Longest shared slug prefix with an indexable prompt in the same category.
    const words = tokens(prompt.slug);
    let best: { length: number; series: PromptSeries } | null = null;
    for (const candidate of byCategory.get(prompt.category) ?? []) {
      const candidateSeries = seriesByPath.get(candidate.path);
      if (!candidateSeries) continue;
      const other = tokens(candidate.slug);
      let length = 0;
      while (
        length < words.length &&
        length < other.length &&
        words[length] === other[length]
      )
        length += 1;
      if (length > 0 && (!best || length > best.length))
        best = { length, series: candidateSeries };
    }
    return best?.series ?? null;
  };

  const linksFor: PromptLinkGraph["linksFor"] = (prompt, linkOptions = {}) => {
    const member = indexableByPath.get(prompt.path);
    if (member) {
      return {
        series: seriesByPath.get(member.path) ?? null,
        seriesLinks: (seriesLinksByPath.get(member.path) ?? []).map(toLink),
        relatedLinks: (relatedByPath.get(member.path) ?? []).map(toLink),
      };
    }
    // Noindexed or not-yet-snapshotted prompt: outbound links only (never counted, never a target).
    const outsiderSeries = seriesForOutsider(prompt, linkOptions.keptPath);
    let seriesLinks: PromptLinkRecord[] = [];
    if (outsiderSeries) {
      const members = outsiderSeries.members;
      let position = members.findIndex(
        (item) => compareSlugs(item.slug, prompt.slug) > 0,
      );
      if (position === -1) position = members.length;
      seriesLinks = seriesNeighbours(
        members,
        position % Math.max(members.length, 1),
        false,
      );
    }
    const exclude = new Set(seriesLinks.map((link) => link.path));
    const relatedLinks = pickRelated(prompt, outsiderSeries, exclude, null);
    return {
      series: outsiderSeries,
      seriesLinks: seriesLinks.map(toLink),
      relatedLinks: relatedLinks.map(toLink),
    };
  };

  return {
    series,
    seriesBySlug,
    seriesByPath,
    indexable,
    indexableByPath,
    relatedByPath,
    linksFor,
  };
}

// ---------------------------------------------------------------------------------------------
// Hub copy

const SMALL_WORDS = new Set([
  "a",
  "an",
  "and",
  "or",
  "of",
  "for",
  "the",
  "to",
  "in",
  "on",
  "with",
]);

export function titleCaseLabel(label: string): string {
  return label
    .split(" ")
    .map((word, index) =>
      index > 0 && SMALL_WORDS.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

/** e.g. "LinkedIn Profile Picture (DP) Prompts: 13 Free Templates" (layout appends " | AIPM"). */
export function seriesHubTitle(series: Pick<PromptSeries, "label" | "members">): string {
  return `${titleCaseLabel(series.label)}: ${series.members.length} Free Templates`;
}

export function seriesHubDescription(
  series: Pick<PromptSeries, "blurb" | "members">,
): string {
  const suffix = ` Browse ${series.members.length} copy-ready prompts with variables and example output.`;
  return series.blurb.length + suffix.length <= 200
    ? `${series.blurb}${suffix}`
    : series.blurb;
}

const PROPER_FIRST_WORDS = new Set(["Midjourney", "Flux", "Stable", "Kafka"]);

/** Label for use mid-sentence: "old photo restoration prompts", but keeps "LinkedIn …", "Midjourney …", "API …". */
export function midSentenceLabel(label: string): string {
  const [first = ""] = label.split(" ");
  if (!/^[A-Z][a-z-]*$/.test(first) || PROPER_FIRST_WORDS.has(first)) return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
}
