"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./theme-toggle.module.css";

type ThemeChoice = "system" | "light" | "dark";

const STORAGE_KEY = "aipm-theme";
const choices: ThemeChoice[] = ["system", "light", "dark"];

const labels: Record<ThemeChoice, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.dataset.theme = choice;
  }
}

function BulbIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18h6M10 22h4M12 2a6 6 0 0 0-3 11v1h6v-1a6 6 0 0 0-3-11Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ choice }: { choice: ThemeChoice }) {
  if (choice === "dark") {
    return (
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path
          d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (choice === "light") {
    return (
      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M8 20h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeChoice>("system");
  const rootRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const next = choices.includes(saved as ThemeChoice) ? (saved as ThemeChoice) : "system";
    setTheme(next);
    applyTheme(next);
  }, []);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      const root = rootRef.current;
      if (!root?.open || root.contains(event.target as Node)) return;
      root.open = false;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && rootRef.current?.open) {
        rootRef.current.open = false;
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function choose(next: ThemeChoice) {
    setTheme(next);
    applyTheme(next);
    if (next === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
    if (rootRef.current) rootRef.current.open = false;
  }

  return (
    <details ref={rootRef} className={styles.themeToggle}>
      <summary className={styles.themeToggleTrigger} aria-label="Change theme">
        <BulbIcon />
      </summary>
      <fieldset
        className={styles.themeToggleMenu}
        onMouseDown={(event) => event.preventDefault()}
        onPointerDown={(event) => event.stopPropagation()}
      >
        <legend className={styles.themeToggleLabel}>Theme</legend>
        {choices.map((choice) => (
          <label
            key={choice}
            className={styles.themeToggleOption}
            onClick={() => choose(choice)}
          >
            <input
              type="radio"
              name="aipm-theme-choice"
              value={choice}
              checked={theme === choice}
              readOnly
              tabIndex={-1}
            />
            <MenuIcon choice={choice} />
            <span>{labels[choice]}</span>
          </label>
        ))}
      </fieldset>
    </details>
  );
}
