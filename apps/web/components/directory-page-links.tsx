import Link from "next/link";
import { directoryPagePath } from "../lib/directory-pagination";
import styles from "./directory-page-links.module.css";

export function DirectoryPageLinks({
  basePath,
  currentPage,
  hasNext,
}: {
  basePath: string;
  currentPage: number;
  hasNext: boolean;
}) {
  if (currentPage === 1 && !hasNext) return null;
  return (
    <nav className={styles.pagination} aria-label="Directory pages">
      {currentPage > 1 ? (
        <Link href={directoryPagePath(basePath, currentPage - 1)}>Previous page</Link>
      ) : null}
      <span>Page {currentPage}</span>
      {hasNext ? <Link href={directoryPagePath(basePath, currentPage + 1)}>Next page</Link> : null}
    </nav>
  );
}
