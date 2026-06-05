"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import styles from "./not-found.module.css";

const STARS = [
  { x: "8%", y: "14%", size: 2, duration: "3.2s", delay: "0s" },
  { x: "22%", y: "72%", size: 3, duration: "4.1s", delay: "0.6s" },
  { x: "35%", y: "28%", size: 2, duration: "2.8s", delay: "1.1s" },
  { x: "48%", y: "8%", size: 3, duration: "3.6s", delay: "0.3s" },
  { x: "61%", y: "64%", size: 2, duration: "4.4s", delay: "1.4s" },
  { x: "74%", y: "22%", size: 3, duration: "3s", delay: "0.9s" },
  { x: "88%", y: "48%", size: 2, duration: "3.8s", delay: "1.8s" },
  { x: "14%", y: "44%", size: 3, duration: "4.6s", delay: "2s" },
  { x: "52%", y: "78%", size: 2, duration: "2.6s", delay: "0.2s" },
  { x: "92%", y: "12%", size: 2, duration: "3.4s", delay: "1.6s" },
] as const;

const ORBIT_ANGLES = [0, 120, 240] as const;

export function NotFoundScene() {
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) return;

    const onMove = (event: MouseEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 24;
      const y = (event.clientY / window.innerHeight - 0.5) * 18;
      setOffset({ x, y });
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <main className={styles.notFoundPage}>
      <div
        className={styles.parallaxLayer}
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
        aria-hidden="true"
      >
        <div className={styles.gridFloor} />
        <div className={styles.radar}>
          <span className={styles.radarRing} />
          <span className={styles.radarRing} />
          <span className={styles.radarRing} />
        </div>
        {STARS.map((star) => (
          <span
            key={`${star.x}-${star.y}`}
            className={styles.star}
            style={
              {
                "--x": star.x,
                "--y": star.y,
                "--size": `${star.size}px`,
                "--duration": star.duration,
                "--delay": star.delay,
              } as CSSProperties
            }
          />
        ))}
        <div className={styles.orbit} aria-hidden="true">
          {ORBIT_ANGLES.map((angle, index) => (
            <span
              key={angle}
              className={styles.orbitNode}
              style={
                {
                  "--angle": `${angle}deg`,
                  "--node-delay": `${index * 0.8}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>
        <div className={styles.scanline} />
      </div>

      <div className={styles.content}>
        <p className={styles.ghostPackage} aria-hidden="true">
          <span />
          @???/missing-skill
        </p>

        <p className={styles.codeRow} aria-label="404">
          {(["4", "0", "4"] as const).map((digit) => (
            <span key={digit} className={styles.digit}>
              {digit}
              <span className={styles.digitGlitch} aria-hidden="true">
                {digit}
              </span>
            </span>
          ))}
        </p>

        <p className={styles.eyebrow}>Page not found</p>
        <h1 className={styles.title}>This page isn&apos;t in the registry.</h1>
        <p className={styles.lede}>
          The link may be wrong, the page may have moved, or it was never published. Scan complete —
          nothing here.
        </p>
        <div className={styles.actions}>
          <Link className={styles.button} href="/">
            Back to home
          </Link>
          <Link className={`${styles.button} ${styles.secondary}`} href="/registry">
            Browse registry
          </Link>
        </div>
      </div>
    </main>
  );
}
