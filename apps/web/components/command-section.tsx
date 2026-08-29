"use client";

import { useEffect, useRef } from "react";
import { cards, docs } from "../lib/page-styles";
import { CodeBlock } from "./code-block";
import styles from "./command-section.module.css";

export type CommandItem = {
  title: string;
  slug?: string;
  description: string;
  code: string;
  options?: string[];
};

type CommandSectionProps = {
  title: string;
  commands: CommandItem[];
  defaultOpen?: boolean;
};

function sectionSlug(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-");
}

export function CommandSection({ title, commands, defaultOpen = true }: CommandSectionProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const titleId = `${sectionSlug(title)}-title`;

  useEffect(() => {
    function expandForHash() {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      if (!hash) {
        return;
      }

      const matchesSection = commands.some((command) => command.slug === hash);
      if (matchesSection) {
        detailsRef.current?.setAttribute("open", "");
      }
    }

    expandForHash();
    window.addEventListener("hashchange", expandForHash);
    return () => window.removeEventListener("hashchange", expandForHash);
  }, [commands]);

  return (
    <section className={styles.commandSection} aria-labelledby={titleId}>
      <details ref={detailsRef} className={styles.commandDetails} open={defaultOpen}>
        <summary className={styles.commandSummary} aria-controls={`${titleId}-panel`}>
          <span className={styles.commandSummaryLabel}>
            <h2 id={titleId}>{title}</h2>
            <span className={styles.chevron} aria-hidden="true" />
          </span>
        </summary>
        <div id={`${titleId}-panel`} className={styles.commandBody}>
          {commands.map((command) => (
            <article className={cards.exampleCard} id={command.slug} key={command.title}>
              <h3>{command.title}</h3>
              <p>{command.description}</p>
              <CodeBlock code={command.code} />
              {command.options ? (
                <ul className={docs.checkList}>
                  {command.options.map((option) => (
                    <li key={option}>{option}</li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}
