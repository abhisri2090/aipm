import Link from "next/link";
import styles from "./directory-list-tile.module.css";

export function DirectoryListTile({ kind }: { kind: "skill" | "prompt" }) {
  const isSkill = kind === "skill";
  const label = isSkill ? "List your skill" : "List your prompt";
  const description = isSkill
    ? "Share a reusable AI workflow with the AIPM community."
    : "Share a useful prompt with clear inputs, outputs, and examples.";

  return (
    <div className={styles.tileGroup}>
      <Link className={styles.tile} href={isSkill ? "/publish" : "/prompts/new"}>
        <span className={styles.eyebrow}>Create something useful</span>
        <span className={styles.content}>
          <strong>{label}</strong>
          <span>{description}</span>
        </span>
        <span className={styles.arrow} aria-hidden="true">
          →
        </span>
      </Link>
      {isSkill ? (
        <p className={styles.githubHint}>
          Already on GitHub?{" "}
          <Link href="/publish/github">Import a public skill you own</Link>.
        </p>
      ) : null}
    </div>
  );
}
