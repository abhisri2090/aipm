import { DocSidebar } from "./doc-sidebar";
import styles from "./doc-layout.module.css";

type DocLayoutProps = {
  children: React.ReactNode;
  wide?: boolean;
};

export function DocLayout({ children }: DocLayoutProps) {
  return (
    <main className={styles.docPage}>
      <div className={styles.docShell}>
        <DocSidebar />
        <div className={styles.docMain}>{children}</div>
      </div>
    </main>
  );
}
