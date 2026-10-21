import { MarkdownView } from "./markdown-view";
import { skillPlainSummary } from "../lib/skill-trust";

type SkillDocumentProps = {
  description: string;
  markdown: string | null;
};

/** Summary plus SKILL.md in the first HTML response. Markdown is rendered without raw HTML. */
export function SkillDocument({ description, markdown }: SkillDocumentProps) {
  const summary = skillPlainSummary(description);
  if (!summary && !markdown?.trim()) return null;

  return (
    <article id="skill-document">
      {summary ? (
        <>
          <h2>Summary</h2>
          <p id="skill-summary">{summary}</p>
        </>
      ) : null}
      {markdown?.trim() ? (
        <>
          <h2>Skill instructions</h2>
          <MarkdownView source={markdown} />
        </>
      ) : null}
    </article>
  );
}
