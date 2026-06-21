import { shell, cards, docs, cn } from "../../lib/page-styles";
import { pageMetadata } from "../../lib/seo";
import { DocLayout } from "../../components/doc-layout";

const people = [
  {
    name: "The Transformer authors",
    work: "Attention Is All You Need",
    href: "https://arxiv.org/abs/1706.03762",
    image: "/thanks/transformer.png",
    imageAlt: "arXiv paper icon for Attention Is All You Need",
    note: "Transformers made modern large language model workflows possible.",
  },
  {
    name: "Geoffrey Hinton, Yoshua Bengio, and Yann LeCun",
    work: "Foundational deep learning research",
    href: "https://amturing.acm.org/award_winners/bengio_3406373.cfm",
    image: "/thanks/turing.svg",
    imageAlt: "ACM A.M. Turing Award",
    note: "Their work helped build the neural network foundation behind today's AI systems.",
  },
  {
    name: "Fei-Fei Li and the ImageNet contributors",
    work: "ImageNet and data-centric benchmark culture",
    href: "https://www.image-net.org/",
    image: "/thanks/imagenet.svg",
    imageAlt: "ImageNet logo",
    note: "ImageNet showed how shared datasets and benchmarks can move a field forward.",
  },
  {
    name: "Demis Hassabis, John Jumper, and the AlphaFold team",
    work: "AlphaFold",
    href: "https://deepmind.google/technologies/alphafold/",
    image: "/thanks/alphafold.png",
    imageAlt: "DeepMind AlphaFold",
    note: "AlphaFold showed how AI can help with real scientific discovery.",
  },
  {
    name: "Richard Sutton and Andrew Barto",
    work: "Reinforcement learning foundations",
    href: "https://amturing.acm.org/award_winners/sutton_3840188.cfm",
    image: "/thanks/rl.svg",
    imageAlt: "Reinforcement learning foundations",
    note: "Their reinforcement learning work shaped how agents learn from actions and rewards.",
  },
  {
    name: "OpenAI research and product teams",
    work: "GPT models, ChatGPT, APIs, and developer tooling",
    href: "https://openai.com/research/",
    image: "/thanks/openai.svg",
    imageAlt: "OpenAI logo",
    note: "Their public products made powerful AI available to many builders and teams.",
  },
  {
    name: "Anthropic research and product teams",
    work: "Claude, Constitutional AI, and safety-focused assistant design",
    href: "https://www.anthropic.com/research/constitutional-ai-harmlessness-from-ai-feedback",
    image: "/thanks/anthropic.svg",
    imageAlt: "Anthropic logo",
    note: "Their work helped popularize safer assistant behavior and practical prompt guidance.",
  },
  {
    name: "Andrew Ng and DeepLearning.AI",
    work: "AI education for practitioners",
    href: "https://www.deeplearning.ai/",
    image: "/thanks/deeplearning-ai.svg",
    imageAlt: "DeepLearning.AI logo",
    note: "Their courses and writing made machine learning and AI easier for working developers to learn.",
  },
  {
    name: "NVIDIA and the accelerated computing community",
    work: "GPU computing and AI systems infrastructure",
    href: "https://www.nvidia.com/gtc/",
    image: "/thanks/nvidia.png",
    imageAlt: "NVIDIA logo",
    note: "Modern AI depends on the hardware and systems that make large-scale training and inference practical.",
  },
  {
    name: "Stanford HAI and the AI Index team",
    work: "Measuring AI progress and impact",
    href: "https://hai.stanford.edu/ai-index/",
    image: "/thanks/stanford-hai.png",
    imageAlt: "Stanford University logo",
    note: "The AI Index gives builders, policymakers, and researchers data about how AI is changing.",
  },
];

const conferenceSignals = [
  {
    event: "NeurIPS",
    href: "https://neurips.cc/",
    sourceLabel: "Neural Information Processing Systems",
    work: "The largest global meeting for machine learning research, with papers, workshops, and talks that shape models, training methods, and evaluation practice worldwide.",
    productLesson:
      "Reusable AI skills should reflect what the field is actually shipping and testing, not only demo-friendly cases.",
  },
  {
    event: "ICML",
    href: "https://icml.cc/",
    sourceLabel: "International Conference on Machine Learning",
    work: "A flagship global conference for core ML research, from theory and optimization to systems and applications used across industry and academia.",
    productLesson:
      "Publishing should include evaluation, governance, and context before a skill is widely reused.",
  },
  {
    event: "ICLR",
    href: "https://iclr.cc/",
    sourceLabel: "International Conference on Learning Representations",
    work: "One of the most influential global venues for deep learning and representation learning, with open review and worldwide participation.",
    productLesson:
      "AIPM skills need multi-turn tests, clear versions, and honest notes about failure cases.",
  },
  {
    event: "CVPR",
    href: "https://cvpr.thecvf.com/",
    sourceLabel: "Computer Vision and Pattern Recognition",
    work: "The premier global computer vision conference, covering perception, robotics, multimodal models, and production vision systems.",
    productLesson:
      "Reusable AI tooling should support more than text-only prompt files as the registry grows.",
  },
  {
    event: "AI Engineer conference & YouTube",
    href: "https://www.youtube.com/@aidotengineer",
    sourceLabel: "AI Engineer YouTube channel",
    work: "Global AI Engineer events and the @aidotengineer channel share practical talks on agents, coding workflows, evals, and production AI from builders around the world.",
    productLesson:
      "AIPM should stay close to practitioner signal — the workflows teams actually reuse day to day.",
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
    "ICML",
    "ICLR",
    "CVPR",
    "AI Engineer",
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
            <img
              alt={person.imageAlt}
              className={cards.thanksCardImage}
              height={180}
              loading="lazy"
              src={person.image}
              width={240}
            />
            <div className={cards.thanksCardBody}>
              <p className={shell.eyebrow}>{person.work}</p>
              <h2>{person.name}</h2>
              <p>{person.note}</p>
              <a className={cn(cards.thanksCardLink, shell.textLink)} href={person.href}>
                Read the public work
              </a>
            </div>
          </article>
        ))}
      </section>

      <section className={cn(docs.doc, docs.wideDoc)} aria-labelledby="recent-conferences">
        <section>
          <h2 id="recent-conferences">Global conferences & communities</h2>
          <p>
            AI changes through papers, talks, workshops, open video, and products shared worldwide.
            AIPM tracks these communities so reusable skills stay close to real practice. Updated June
            21, 2026.
          </p>
          <div className={cards.sourceList}>
            {conferenceSignals.map((signal) => (
              <a className={cards.sourceCard} href={signal.href} key={signal.event}>
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
