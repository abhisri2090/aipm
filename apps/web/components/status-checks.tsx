"use client";

import { useEffect, useState } from "react";
import cards from "../app/cards.module.css";

type CheckState = {
  label: string;
  path: string;
  description: string;
  status: "checking" | "ok" | "error";
  detail: string;
};

const checks: Array<Omit<CheckState, "status" | "detail">> = [
  {
    label: "Process health",
    path: "/health",
    description: "Checks whether the registry API is running.",
  },
  {
    label: "Registry ready",
    path: "/ready",
    description: "Checks whether the API can reach the database and package storage.",
  },
];

export function StatusChecks() {
  const [states, setStates] = useState<CheckState[]>(
    checks.map((check) => ({ ...check, status: "checking", detail: "Checking..." })),
  );

  useEffect(() => {
    let cancelled = false;

    async function runCheck(check: Omit<CheckState, "status" | "detail">) {
      try {
        const response = await fetch(check.path, { cache: "no-store" });
        const body = (await response.json().catch(() => null)) as unknown;
        const detail =
          body && typeof body === "object" && "status" in body
            ? `HTTP ${response.status} - ${String(body.status)}`
            : `HTTP ${response.status}`;

        return {
          ...check,
          status: response.ok ? "ok" : "error",
          detail,
        } satisfies CheckState;
      } catch (error) {
        return {
          ...check,
          status: "error",
          detail: error instanceof Error ? error.message : "Unable to reach endpoint",
        } satisfies CheckState;
      }
    }

    Promise.all(checks.map(runCheck)).then((nextStates) => {
      if (!cancelled) setStates(nextStates);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className={cards.statusGrid} aria-label="Live registry status checks">
      {states.map((check) => (
        <article className={cards.statusCard} data-status={check.status} key={check.path}>
          <div>
            <h2>{check.label}</h2>
            <p>{check.description}</p>
          </div>
          <strong>{check.detail}</strong>
        </article>
      ))}
    </section>
  );
}
