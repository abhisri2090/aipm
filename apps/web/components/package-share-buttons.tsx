"use client";

import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import styles from "./package-share-buttons.module.css";

export function PackageShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);
  const text = `Install ${title} with AIPM`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const xUrl = `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await copyLink();
  }

  return (
    <div className={styles.group} aria-label="Share this skill">
      <button className={styles.primary} onClick={share} type="button">
        <Share2 aria-hidden="true" size={17} />
        Share
      </button>
      <button className={styles.button} onClick={copyLink} type="button">
        {copied ? <Check aria-hidden="true" size={17} /> : <Copy aria-hidden="true" size={17} />}
        {copied ? "Copied" : "Copy link"}
      </button>
      <a className={styles.button} href={linkedInUrl} rel="noreferrer" target="_blank">
        <span aria-hidden="true" className={styles.linkedInIcon}>in</span>
        LinkedIn
      </a>
      <a className={styles.button} href={xUrl} rel="noreferrer" target="_blank">
        <span aria-hidden="true" className={styles.xIcon}>X</span>
        Post
      </a>
      <span className={styles.status} aria-live="polite">{copied ? "Skill link copied." : ""}</span>
    </div>
  );
}
