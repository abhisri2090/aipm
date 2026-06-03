"use client";

import { useEffect, useState } from "react";

type ThemeChoice = "system" | "light" | "dark";

const STORAGE_KEY = "aipm-theme";
const choices: ThemeChoice[] = ["system", "light", "dark"];

function applyTheme(choice: ThemeChoice): void {
  const root = document.documentElement;
  if (choice === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.dataset.theme = choice;
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeChoice>("system");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const next = choices.includes(saved as ThemeChoice) ? (saved as ThemeChoice) : "system";
    setTheme(next);
    applyTheme(next);
  }, []);

  function choose(next: ThemeChoice) {
    setTheme(next);
    applyTheme(next);
    if (next === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  }

  return (
    <div className="theme-toggle" role="group" aria-label="Theme">
      {choices.map((choice) => (
        <button
          aria-pressed={theme === choice}
          className="theme-toggle-button"
          data-theme-choice={choice}
          key={choice}
          onClick={() => choose(choice)}
          type="button"
        >
          {choice}
        </button>
      ))}
    </div>
  );
}
