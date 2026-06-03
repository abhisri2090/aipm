import { DocSidebar } from "./doc-sidebar";

type DocLayoutProps = {
  children: React.ReactNode;
  wide?: boolean;
};

export function DocLayout({ children, wide = false }: DocLayoutProps) {
  return (
    <main className="doc-page">
      <div className="doc-shell">
        <DocSidebar />
        <div className={wide ? "doc-main doc-main--wide" : "doc-main"}>{children}</div>
      </div>
    </main>
  );
}
