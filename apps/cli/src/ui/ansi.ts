/** Minimal ANSI helpers for interactive CLI UI (no external deps). */

export { supportsColor } from "./theme.js";

export const ansi = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",
  clearLine: "\x1b[2K",
  cursorTo(col: number): string {
    return `\x1b[${Math.max(1, col)}G`;
  },
  /** Move cursor up `n` lines (0 = no-op). */
  cursorUp(n: number): string {
    return n > 0 ? `\x1b[${n}A` : "";
  },
};
