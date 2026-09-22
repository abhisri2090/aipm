/**
 * AiPM CLI brand tokens — dark mint theme (matches website dark accent / logo).
 * Source: apps/web/app/globals.css dark --accent + logo mint.
 */

export const brand = {
  /** Primary accent — dark-mode site --accent / close to logo mint */
  accent: { r: 72, g: 185, b: 141 }, // #48b98d
  /** Stronger / hover — dark --accent-strong */
  accentStrong: { r: 123, g: 217, b: 173 }, // #7bd9ad
  /** Logo mint (slightly brighter) */
  mint: { r: 79, g: 196, b: 154 }, // #4FC49A
  /** On-accent text (dark green-black) */
  onAccent: { r: 7, g: 17, b: 13 }, // #07110d
  /** Muted secondary text */
  muted: { r: 157, g: 175, b: 170 }, // #9dafaa
  /** Warning */
  warning: { r: 245, g: 165, b: 36 }, // #f5a524
  /** Danger */
  danger: { r: 249, g: 112, b: 102 }, // #f97066
} as const;

export type Rgb = { r: number; g: number; b: number };

export type ThemeEnv = {
  NO_COLOR?: string;
  FORCE_COLOR?: string;
  COLORTERM?: string;
};

export function fgTruecolor({ r, g, b }: Rgb): string {
  return `\x1b[38;2;${r};${g};${b}m`;
}

export function bgTruecolor({ r, g, b }: Rgb): string {
  return `\x1b[48;2;${r};${g};${b}m`;
}

function envValue(env: ThemeEnv, key: keyof ThemeEnv): string | undefined {
  return env[key];
}

export function supportsColor(
  stream: { isTTY?: boolean },
  env: ThemeEnv = process.env,
): boolean {
  const noColor = envValue(env, "NO_COLOR");
  if (noColor != null && noColor !== "") return false;
  const force = envValue(env, "FORCE_COLOR");
  if (force === "0") return false;
  if (force != null && force !== "") return true;
  return Boolean(stream.isTTY);
}

/** Whether the stream can use 24-bit color (truecolor). */
export function supportsTruecolor(
  stream: { isTTY?: boolean },
  env: ThemeEnv = process.env,
): boolean {
  if (!supportsColor(stream, env)) return false;
  const force = envValue(env, "FORCE_COLOR");
  if (force === "3") return true;
  const colorterm = (envValue(env, "COLORTERM") ?? "").toLowerCase();
  if (colorterm.includes("truecolor") || colorterm.includes("24bit")) return true;
  // Modern terminals: assume truecolor when TTY + color enabled.
  return Boolean(stream.isTTY);
}

/**
 * Brand-aware style helpers. Prefer truecolor mint; fall back to ANSI green.
 */
export function createTheme(
  stream: { isTTY?: boolean },
  env: ThemeEnv = process.env,
) {
  const color = supportsColor(stream, env);
  const truecolor = supportsTruecolor(stream, env);

  const accentFg = !color
    ? ""
    : truecolor
      ? fgTruecolor(brand.accent)
      : "\x1b[32m";
  const accentStrongFg = !color
    ? ""
    : truecolor
      ? fgTruecolor(brand.accentStrong)
      : "\x1b[32m";
  const mutedFg = !color
    ? ""
    : truecolor
      ? fgTruecolor(brand.muted)
      : "\x1b[2m";
  const onAccentFg = !color
    ? ""
    : truecolor
      ? fgTruecolor(brand.onAccent)
      : "\x1b[30m";
  const accentBg = !color
    ? ""
    : truecolor
      ? bgTruecolor(brand.accent)
      : "\x1b[42m";

  return {
    color,
    truecolor,
    reset: color ? "\x1b[0m" : "",
    bold: color ? "\x1b[1m" : "",
    dim: color ? "\x1b[2m" : "",
    accent: accentFg,
    accentStrong: accentStrongFg,
    muted: mutedFg,
    /** Selected row: mint background + dark text (site on-accent). */
    highlight: color ? `${accentBg}${onAccentFg}\x1b[1m` : "",
    warning: color
      ? truecolor
        ? fgTruecolor(brand.warning)
        : "\x1b[33m"
      : "",
    danger: color
      ? truecolor
        ? fgTruecolor(brand.danger)
        : "\x1b[31m"
      : "",
  };
}

export type Theme = ReturnType<typeof createTheme>;
