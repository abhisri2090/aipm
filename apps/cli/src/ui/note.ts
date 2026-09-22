import { createTheme, type Theme } from "./theme.js";

export type NoteType = "info" | "warn" | "error" | "success";

export type NoteOptions = {
  type?: NoteType;
  title?: string;
  message: string;
  stream?: NodeJS.WriteStream;
};

function symbolFor(type: NoteType): string {
  switch (type) {
    case "success":
      return "✔";
    case "warn":
      return "⚠";
    case "error":
      return "✖";
    default:
      return "ℹ";
  }
}

function colorFor(type: NoteType, theme: Theme): string {
  switch (type) {
    case "success":
      return theme.accent;
    case "warn":
      return theme.warning;
    case "error":
      return theme.danger;
    default:
      return theme.accentStrong;
  }
}

/** Print a branded callout (info / warn / error / success) with breathing room. */
export function printNote(options: NoteOptions): void {
  const stream = options.stream ?? process.stderr;
  const theme = createTheme(stream);
  const type = options.type ?? "info";
  const symbol = symbolFor(type);
  const color = colorFor(type, theme);

  stream.write("\n");
  if (options.title) {
    stream.write(
      `${color}${theme.bold}${symbol} ${options.title}${theme.reset}\n`,
    );
    stream.write(`  ${theme.muted}${options.message}${theme.reset}\n`);
  } else {
    stream.write(
      `${color}${theme.bold}${symbol}${theme.reset} ${options.message}\n`,
    );
  }
  stream.write("\n");
}
