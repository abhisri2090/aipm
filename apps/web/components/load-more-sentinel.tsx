"use client";

import { useEffect, useRef } from "react";

export function LoadMoreSentinel({
  enabled,
  loading,
  onLoadMore,
  label = "Loading more…",
}: {
  enabled: boolean;
  loading: boolean;
  onLoadMore: () => void;
  label?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, onLoadMore]);

  if (!enabled && !loading) return null;

  return (
    <div ref={ref} aria-hidden={!loading} style={{ padding: "24px 0", textAlign: "center" }}>
      {loading ? <span>{label}</span> : null}
    </div>
  );
}
