import { shell, cards, docs, cn } from "../../lib/page-styles";
import { pageMetadata } from "../../lib/seo";
import { DocLayout } from "../../components/doc-layout";

const people = [
  {
    name: "The Transformer authors",
    work: "Attention Is All You Need",
    href: "https://arxiv.org/abs/1706.03762",
    note: "Transformers made modern large language model workflows possible.",
  },
  {
    name: "Geoffrey Hinton, Yoshua Bengio, and Yann LeCun",
    work: "Foundational deep learning research",
    href: "https://amturing.acm.org/award_winners/bengio_3406373.cfm",
    note: "Their work helped build the neural network foundation behind today's AI systems.",
  },
  {
    name: "Fei-Fei Li and the ImageNet contributors",
    work: "ImageNet and data-centric benchmark culture",
    href: "https://www.image-net.org/",
    note: "ImageNet showed how shared datasets and benchmarks can move a field forward.",
  },
  {
    name: "Demis Hassabis, John Jumper, and the AlphaFold team",
    work: "AlphaFold",
    href: "https://deepmind.google/technologies/alphafold/",
    note: "AlphaFold showed how AI can help with real scientific discovery.",
  },
  {
    name: "Richard Sutton and Andrew Barto",
    work: "Reinforcement learning foundations",
    href: "https://amturing.acm.org/award_winners/sutton_3840188.cfm",
    note: "Their reinforcement learning work shaped how agents learn from actions and rewards.",
  },
  {
    name: "OpenAI research and product teams",
    work: "GPT models, ChatGPT, APIs, and developer tooling",
    href: "https://openai.com/research/",
    note: "Their public products made powerful AI available to many builders and teams.",
  },
  {
    name: "Anthropic research and product teams",
    work: "Claude, Constitutional AI, and safety-focused assistant design",
    href: "https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback",
    note: "Their work helped popularize safer assistant behavior and practical prompt guidance.",
  },
  {
    name: "Andrew Ng and DeepLearning.AI",
    work: "AI education for practitioners",
    href: "https://www.deeplearning.ai/",
    note: "Their courses and writing made machine learning and AI easier for working developers to learn.",
  },
  {
    name: "NVIDIA and the accelerated computing community",
    work: "GPU computing and AI systems infrastructure",
    href: "https://www.nvidia.com/gtc/",
    note: "Modern AI depends on the hardware and systems that make large-scale training and inference practical.",
  },
  {
    name: "Stanford HAI and the AI Index team",
    work: "Measuring AI progress and impact",
    href: "https://hai.stanford.edu/ai-index/",
    note: "The AI Index gives builders, policymakers, and researchers data about how AI is changing.",
  },
];

const conferenceSignals = [
  {
    event: "NeurIPS 2025 invited speakers",
    href: "https://blog.neurips.cc/2025/09/10/2025-speaker-lineup-announced/",
    sourceLabel: "NeurIPS announcement",
    work: "Kyunghyun Cho's GRU and neural machine translation work, Yejin Choi's commonsense reasoning research, Melanie Mitchell's abstraction and analogy work, Andrew Saxe's theory of learning, Richard Sutton's reinforcement learning foundations, and Zeynep Tufekci's technology-and-society analysis.",
    productLesson:
      "Reusable AI skills should be tested on hard cases, not only happy-path demos.",
  },
  {
    event: "ICLR 2026 keynotes",
    href: "https://blog.iclr.cc/2026/04/17/announcing-the-iclr-2026-keynotes/",
    sourceLabel: "ICLR keynote announcement",
    work: "Maja Mataric on human-centered AI and robotics, Max Welling on physics-to-AI-to-materials, Percy Liang on Marin and open frontier AI, Katie Bouman on imaging hidden science, Karen Adolph on infant learning, and Pablo Arbelaez on AI for open science.",
    productLesson:
      "AIPM should make AI work easy to inspect and grounded in real user behavior.",
  },
  {
    event: "ICML 2026 invited talks",
    href: "https://blog.icml.cc/2026/05/18/announcing-the-icml-2026-invited-talks/",
    sourceLabel: "ICML invited-talk announcement",
    work: "Pascale Fung on conversational and ethical AI, Susan Athey on causal inference and AI economics, Sham Kakade on RL and deep learning theory, Aviv Regev on AI for biology, Verena Rieser on alignment and evaluation, and Arvind Narayanan on AI's social impact.",
    productLesson:
      "Publishing should include evaluation, governance, and context before a skill is widely reused.",
  },
  {
    event: "ICLR 2026 outstanding papers",
    href: "https://blog.iclr.cc/2026/04/23/announcing-the-iclr-2026-outstanding-papers/",
    sourceLabel: "ICLR outstanding-papers announcement",
    work: "Transformers are Inherently Succinct, LLMs Get Lost In Multi-Turn Conversation, and The Polar Express: Optimal Matrix Sign Methods and their Application to the Muon Algorithm.",
    productLesson:
      "AIPM skills need multi-turn tests, clear versions, and honest notes about failure cases.",
  },
  {
    event: "CVPR 2025 keynotes",
    href: "https://cvpr.thecvf.com/Conferences/2025/News/Keynote_PR",
    sourceLabel: "CVPR keynote announcement",
    work: "Harry Shum on low-altitude airspace infrastructure, Laurens van der Maaten on the Llama herd of models, and Carolina Parada on Gemini Robotics and embodied AI.",
    productLesson:
      "Reusable AI tooling should support more than simple prompt files as the registry grows.",
  },
];

export const metadata = pageMetadata({
  title: "Special Thanks to the AI Community",
  description:
    "Acknowledgements for the people, papers, companies, and public work that shaped modern AI tools.",
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
    <DocLayout wide>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "Special Thanks to the AI Community",
            description:
              "Acknowledgements for the people, papers, companies, and public work that shaped modern AI tools.",
            url: "https://aipm-registry.com/thanks",
            about: [...people.map((person) => person.work), ...conferenceSignals.map((signal) => signal.work)],
          }),
        }}
      />

      <section className={shell.pageHeader}>
        <p className={shell.eyebrow}>Special Thanks</p>
        <h1>AI tools are built on shared work.</h1>
        <p className={shell.lede}>
          AIPM exists because researchers, product teams, open communities, and conferences made AI
          useful for everyday project work. This page says thanks. It does not claim endorsement.
        </p>
      </section>

      <section className={cards.thanksList} aria-label="AI community acknowledgements">
        {people.map((person) => (
          <article className={cards.thanksCard} key={person.name}>
            <p className={shell.eyebrow}>{person.work}</p>
            <h2>{person.name}</h2>
            <p>{person.note}</p>
            <a className={cn(cards.thanksCardLink, shell.textLink)} href={person.href}>
              Read the public work
            </a>
          </article>
        ))}
      </section>

      <section className={cn(docs.doc, docs.wideDoc)} aria-labelledby="recent-conferences">
        <section>
          <h2 id="recent-conferences">Recent conference signals</h2>
          <p>
            AI changes through papers, talks, workshops, datasets, replication, and products. AIPM
            tracks these communities so reusable skills stay close to real practice. Updated June 3,
            2026.
          </p>
          <div className={cards.sourceList}>
            {conferenceSignals.map((signal) => (
              <a className={cards.sourceCard} href={signal.href} key={signal.href}>
                <strong>{signal.event}</strong>
                <span>{signal.work}</span>
                <span>{signal.productLesson}</span>
                <small>{signal.sourceLabel}</small>
              </a>
            ))}
          </div>
        </section>

        <section>
          <h2>How we keep this page fair</h2>
          <ul className={docs.checkList}>
            <li>Use public sources and direct links to papers, projects, or official pages.</li>
            <li>Separate appreciation from endorsement or partnership claims.</li>
            <li>Update names as new public work becomes important to AI builders.</li>
            <li>Credit communities, maintainers, and educators, not only famous founders.</li>
          </ul>
        </section>
      </section>
    </DocLayout>
  );
}
