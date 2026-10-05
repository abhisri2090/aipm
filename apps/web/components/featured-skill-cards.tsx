import Link from "next/link";
import { featuredSkillPath, type FeaturedSkill } from "../lib/featured-skills";
import { cards, cn, shell } from "../lib/page-styles";
import styles from "./skills-intro.module.css";

function publisherOf(name: string): string {
  return name.replace(/^@/, "").split("/")[0] ?? name;
}

/**
 * Hand-picked skill pages as simple cards: a plain name, who made it, and one sentence on what it does.
 * Used on /skills and at the end of selected guides so strong skill pages get internal links.
 */
export function FeaturedSkillCards({
  skills,
  id,
  eyebrow = "Popular skills",
  title,
  intro,
}: {
  skills: readonly FeaturedSkill[];
  id: string;
  eyebrow?: string;
  title: string;
  intro?: string;
}) {
  if (skills.length === 0) return null;
  return (
    <section className={shell.panelSection} aria-labelledby={id}>
      <div className={shell.sectionHeading}>
        <div>
          <p className={shell.eyebrow}>{eyebrow}</p>
          <h2 id={id}>{title}</h2>
          {intro ? <p className={styles.sectionIntro}>{intro}</p> : null}
        </div>
        <Link className={shell.textLink} href="/best-claude-skills">
          See the most-installed skills
        </Link>
      </div>
      <div className={cn(cards.guideGrid, styles.flushGrid)}>
        {skills.map((skill) => (
          <Link
            className={cards.guideCard}
            href={featuredSkillPath(skill)}
            key={skill.name}
          >
            <h3>{skill.title}</h3>
            <p>{skill.summary}</p>
            <p className={styles.byline}>By {publisherOf(skill.name)} · Open skill →</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
