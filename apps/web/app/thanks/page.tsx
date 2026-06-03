import { pageMetadata } from "../../lib/seo";

const people = [
  {
    name: "The Transformer authors",
    work: "Attention Is All You Need",
    href: "https://arxiv.org/abs/1706.03762",
    note: "The transformer architecture made modern large language model workflows possible.",
  },
  {
    name: "Geoffrey Hinton, Yoshua Bengio, and Yann LeCun",
    work: "Foundational deep learning research",
    href: "https://amturing.acm.org/award_winners/bengio_3406373.cfm",
    note: "Their work helped establish the neural network foundations behind today's AI systems.",
  },
  {
    name: "Fei-Fei Li and the ImageNet contributors",
    work: "ImageNet and data-centric benchmark culture",
    href: "https://www.image-net.org/",
    note: "ImageNet helped show how shared datasets and benchmarks can move an entire field forward.",
  },
  {
    name: "Demis Hassabis, John Jumper, and the AlphaFold team",
    work: "AlphaFold",
    href: "https://deepmind.google/technologies/alphafold/",
    note: "AlphaFold showed how AI can become practical infrastructure for scientific discovery.",
  },
  {
    name: "Richard Sutton and Andrew Barto",
    work: "Reinforcement learning foundations",
    href: "https://amturing.acm.org/award_winners/sutton_3840188.cfm",
    note: "Their reinforcement learning work shaped how agents learn from interaction and reward.",
  },
  {
    name: "OpenAI research and product teams",
    work: "GPT models, ChatGPT, APIs, and developer tooling",
    href: "https://openai.com/research/",
    note: "Their public products made high-capability AI accessible to many builders and teams.",
  },
  {
    name: "Anthropic research and product teams",
    work: "Claude, Constitutional AI, and safety-focused assistant design",
    href: "https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback",
    note: "Their work helped popularize safer assistant behavior, constitutional approaches, and practical prompt guidance.",
  },
  {
    name: "Andrew Ng and DeepLearning.AI",
    work: "AI education for practitioners",
    href: "https://www.deeplearning.ai/",
    note: "Their courses and writing helped make machine learning and AI more approachable for working developers.",
  },
  {
    name: "NVIDIA and the accelerated computing community",
    work: "GPU computing and AI systems infrastructure",
    href: "https://www.nvidia.com/gtc/",
    note: "Modern AI depends on the hardware, systems, and ecosystem work that made large-scale training and inference practical.",
  },
  {
    name: "Stanford HAI and the AI Index team",
    work: "Measuring AI progress and impact",
    href: "https://hai.stanford.edu/ai-index/",
    note: "The AI Index gives builders, policymakers, and researchers shared data about how the field is changing.",
  },
];

const conferences = [
  {
    name: "NeurIPS 2025 invited speakers",
    href: "https://blog.neurips.cc/2025/09/10/2025-speaker-lineup-announced/",
    note: "Kyunghyun Cho, Yejin Choi, Melanie Mitchell, Andrew Saxe, Richard Sutton, and Zeynep Tufekci highlighted work across NLP, reinforcement learning, AI and society, cognitive science, and learning theory.",
  },
  {
    name: "ICLR 2026 keynotes",
    href: "https://blog.iclr.cc/2026/04/17/announcing-the-iclr-2026-keynotes/",
    note: "Maja Mataric, Max Welling, Percy Liang, Katie Bouman, Karen Adolph, and Pablo Arbelaez covered human-centered robotics, open frontier AI, scientific imaging, development, and AI for open science.",
  },
  {
    name: "ICML 2026 invited talks",
    href: "https://blog.icml.cc/2026/05/18/announcing-the-icml-2026-invited-talks/",
    note: "Pascale Fung, Susan Athey, Sham Kakade, Aviv Regev, Verena Rieser, and Arvind Narayanan connected machine learning theory, conversational AI, economics, biology, alignment, and AI's social impact.",
  },
  {
    name: "ICLR 2026 outstanding papers",
    href: "https://blog.iclr.cc/2026/04/23/announcing-the-iclr-2026-outstanding-papers/",
    note: "Recent award work included transformer theory, multi-turn LLM evaluation, and optimizer methods, all directly relevant to how reusable AI skills should be tested and updated.",
  },
];

export const metadata = pageMetadata({
  title: "Special Thanks to the AI Community",
  description:
    "AIPM acknowledgements for the people, papers, companies, conferences, and public work that shaped modern AI tools and reusable AI skills.",
  path: "/thanks",
  keywords: [
    "AI acknowledgements",
    "AI conferences",
    "AI research",
    "Transformer",
    "ImageNet",
    "AlphaFold",
    "NeurIPS",
    "ICLR",
    "ICML",
  ],
});

export default function ThanksPage() {
  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Special Thanks to the AI Community",
            description:
              "AIPM acknowledgements for the people, papers, companies, conferences, and public work that shaped modern AI tools and reusable AI skills.",
            url: "https://aipm-registry.com/thanks",
            about: people.map((person) => person.work),
          }),
        }}
      />

      <section className="page-header">
        <p className="eyebrow">Special Thanks</p>
        <h1>The AI world is built on shared work.</h1>
        <p className="lede">
          AIPM exists because many researchers, product teams, open communities, and conferences
          made AI practical enough to become part of everyday project work. This page is a living
          acknowledgement, not an endorsement claim.
        </p>
      </section>

      <section className="thanks-list" aria-label="AI community acknowledgements">
        {people.map((person) => (
          <article className="thanks-card" key={person.name}>
            <p className="eyebrow">{person.work}</p>
            <h2>{person.name}</h2>
            <p>{person.note}</p>
            <a className="text-link" href={person.href}>
              Read the public work
            </a>
          </article>
        ))}
      </section>

      <section className="doc wide-doc" aria-labelledby="recent-conferences">
        <section>
          <h2 id="recent-conferences">Recent conference signal</h2>
          <p>
            The AI field changes through papers, talks, workshops, datasets, replication, and
            product pressure. AIPM tracks these communities because reusable AI skills should stay
            close to real practice, not just demos.
          </p>
          <div className="source-list">
            {conferences.map((conference) => (
              <a className="source-card" href={conference.href} key={conference.href}>
                <strong>{conference.name}</strong>
                <span>{conference.note}</span>
              </a>
            ))}
          </div>
        </section>

        <section>
          <h2>How we will keep this page fair</h2>
          <ul className="check-list">
            <li>Use public sources and direct links to papers, projects, or official pages.</li>
            <li>Separate appreciation from endorsement or partnership claims.</li>
            <li>Update names as new public work becomes important to AI builders.</li>
            <li>Credit communities, maintainers, and educators, not only famous founders.</li>
          </ul>
        </section>
      </section>
    </main>
  );
}
