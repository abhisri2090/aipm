"use client";

import { Check, Copy } from "lucide-react";
import { Children, isValidElement, useEffect, useState, type ComponentProps, type ReactNode } from "react";
import Markdown, { type Components, type Options } from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";
import { copyToClipboard } from "../lib/copy-to-clipboard";
import { splitMarkdownDocument, type MarkdownFrontmatter } from "../lib/markdown-document";
import styles from "./markdown-view.module.css";

const remarkPlugins: Options["remarkPlugins"] = [remarkGfm];
const rehypePlugins: Options["rehypePlugins"] = [
  [rehypeHighlight, { plainText: ["text", "txt", "plain"] }],
];

type MarkdownViewProps = {
  source: string;
};

export function MarkdownView({ source }: MarkdownViewProps) {
  const parsed = splitMarkdownDocument(source);

  return (
    <div className={styles.markdown}>
      {parsed.frontmatter ? <Frontmatter data={parsed.frontmatter} /> : null}
      {parsed.body.trim() ? (
        <Markdown components={components} rehypePlugins={rehypePlugins} remarkPlugins={remarkPlugins}>
          {parsed.body}
        </Markdown>
      ) : null}
    </div>
  );
}

function Frontmatter({ data }: { data: MarkdownFrontmatter }) {
  return (
    <aside aria-label="Frontmatter" className={styles.frontmatter}>
      <p className={styles.frontmatterLabel}>Frontmatter</p>
      <dl className={styles.frontmatterList}>
        {Object.entries(data).map(([key, value]) => (
          <div className={styles.frontmatterRow} key={key}>
            <dt>{key}</dt>
            <dd>
              <FrontmatterValue value={value} />
            </dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}

function FrontmatterValue({ value }: { value: unknown }) {
  if (value == null || value === "") return <span className={styles.empty}>—</span>;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "boolean" || typeof value === "number") return String(value);
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value) && value.every(isPrimitive)) {
    if (value.length === 0) return <span className={styles.empty}>—</span>;
    return (
      <ul className={styles.chips}>
        {value.map((item, index) => (
          <li key={`${String(item)}-${index}`}>{item == null || item === "" ? "—" : String(item)}</li>
        ))}
      </ul>
    );
  }
  if (isRecord(value)) {
    return (
      <dl className={styles.nestedList}>
        {Object.entries(value).map(([key, nested]) => (
          <div className={styles.frontmatterRow} key={key}>
            <dt>{key}</dt>
            <dd>
              <FrontmatterValue value={nested} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return <span>{JSON.stringify(value)}</span>;
}

function MarkdownLink({ href, children, ...props }: ComponentProps<"a">) {
  const external = typeof href === "string" && /^https?:\/\//i.test(href);
  return (
    <a href={href} {...props} {...(external ? { rel: "noreferrer noopener", target: "_blank" } : {})}>
      {children}
    </a>
  );
}

function MarkdownImage({ alt, ...props }: ComponentProps<"img">) {
  return <img alt={alt ?? ""} {...props} />;
}

function MarkdownTable(props: ComponentProps<"table">) {
  return (
    <div className={styles.tableWrap}>
      <table {...props} />
    </div>
  );
}

function MarkdownPre({ children }: ComponentProps<"pre">) {
  const language = codeLanguage(children);
  const code = textOf(children).replace(/\n$/, "");

  return (
    <div className={styles.fence}>
      <div className={styles.fenceBar}>
        <span className={styles.fenceLang}>{language ?? "code"}</span>
        <CopyCodeButton value={code} />
      </div>
      <pre>{children}</pre>
    </div>
  );
}

function CopyCodeButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <button
      type="button"
      className={styles.copy}
      aria-label={copied ? "Copied" : "Copy code"}
      title={copied ? "Copied" : "Copy code"}
      data-copied={copied ? "" : undefined}
      onClick={() => {
        void copyToClipboard(value).then((didCopy) => {
          if (didCopy) setCopied(true);
        });
      }}
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

const components: Components = {
  a: MarkdownLink,
  img: MarkdownImage,
  pre: MarkdownPre,
  table: MarkdownTable,
};

function codeLanguage(children: ReactNode): string | null {
  for (const child of Children.toArray(children)) {
    if (!isValidElement<{ className?: string }>(child)) continue;
    const className = child.props.className;
    if (typeof className !== "string") continue;
    const match = /(?:^|\s)language-([\w#+.-]+)/.exec(className);
    if (match?.[1]) return match[1];
  }
  return null;
}

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map((child) => textOf(child)).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function isPrimitive(value: unknown): boolean {
  return value == null || ["string", "number", "boolean"].includes(typeof value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
}
