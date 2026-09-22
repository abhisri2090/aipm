import { stdin as defaultInput, stdout as defaultOutput } from "node:process";
import { ansi } from "./ansi.js";
import { createTheme, type Theme } from "./theme.js";

export type SelectOption<T> = {
  value: T;
  label: string;
  /** Optional secondary text shown dimmed beside the label. */
  hint?: string;
};

export type SelectPromptOptions<T> = {
  message: string;
  options: ReadonlyArray<SelectOption<T>>;
  /** Index of the initially highlighted option (default 0). */
  initialIndex?: number;
  input?: NodeJS.ReadStream;
  output?: NodeJS.WriteStream;
};

export class SelectCancelledError extends Error {
  constructor(message = "Selection cancelled") {
    super(message);
    this.name = "SelectCancelledError";
  }
}

type RenderState = {
  lines: number;
};

function assertSelectable<T>(options: ReadonlyArray<SelectOption<T>>): void {
  if (options.length === 0) {
    throw new Error("selectPrompt requires at least one option");
  }
}

function wrap(open: string, text: string, reset: string): string {
  return open ? `${open}${text}${reset}` : text;
}

function renderFrame<T>(
  output: NodeJS.WriteStream,
  opts: {
    message: string;
    options: ReadonlyArray<SelectOption<T>>;
    index: number;
    theme: Theme;
    previous?: RenderState;
  },
): RenderState {
  const { message, options, index, theme } = opts;
  const lines: string[] = [];

  lines.push(""); // top padding
  lines.push(
    `${wrap(theme.accent + theme.bold, "?", theme.reset)} ${wrap(theme.bold, message, theme.reset)}`,
  );
  lines.push(""); // space under question

  for (let i = 0; i < options.length; i++) {
    const option = options[i]!;
    const selected = i === index;
    const pointer = selected ? "❯" : " ";

    if (selected && theme.color) {
      lines.push(`${theme.highlight} ${pointer} ${option.label} ${theme.reset}`);
      if (option.hint) {
        lines.push(`${theme.highlight}     ${option.hint} ${theme.reset}`);
      }
    } else if (selected) {
      lines.push(` ${pointer} ${option.label}`);
      if (option.hint) lines.push(`     ${option.hint}`);
    } else {
      lines.push(` ${pointer} ${wrap(theme.muted, option.label, theme.reset)}`);
      if (option.hint) {
        lines.push(`     ${wrap(theme.muted, option.hint, theme.reset)}`);
      }
    }
    lines.push(""); // gap between options
  }

  lines.push(wrap(theme.muted, "  ↑↓ navigate · enter select · esc cancel", theme.reset));
  lines.push(""); // bottom padding

  if (opts.previous && opts.previous.lines > 0) {
    output.write(ansi.cursorUp(opts.previous.lines));
  }

  for (const line of lines) {
    output.write(`${ansi.clearLine}${ansi.cursorTo(1)}${line}\n`);
  }

  // If the new frame is shorter, clear leftover lines from the previous frame.
  const prev = opts.previous?.lines ?? 0;
  for (let i = lines.length; i < prev; i++) {
    output.write(`${ansi.clearLine}${ansi.cursorTo(1)}\n`);
  }
  if (prev > lines.length) {
    output.write(ansi.cursorUp(prev - lines.length));
  }

  return { lines: Math.max(lines.length, prev) };
}

function clearFrame(output: NodeJS.WriteStream, state: RenderState): void {
  if (state.lines <= 0) return;
  output.write(ansi.cursorUp(state.lines));
  for (let i = 0; i < state.lines; i++) {
    output.write(`${ansi.clearLine}${ansi.cursorTo(1)}\n`);
  }
  output.write(ansi.cursorUp(state.lines));
}

function writeDone<T>(
  output: NodeJS.WriteStream,
  message: string,
  option: SelectOption<T>,
  theme: Theme,
): void {
  const prefix = wrap(theme.accent + theme.bold, "✔", theme.reset);
  const msg = wrap(theme.bold, message, theme.reset);
  const value = wrap(theme.accentStrong, option.label, theme.reset);
  output.write("\n");
  output.write(
    `${prefix} ${msg} ${wrap(theme.muted, "·", theme.reset)} ${value}\n`,
  );
  output.write("\n");
}

function readKey(chunk: string): "up" | "down" | "enter" | "cancel" | "ignore" {
  if (chunk === "\u0003" || chunk === "\u001b") return "cancel"; // Ctrl+C or Esc
  if (chunk === "\r" || chunk === "\n") return "enter";
  if (chunk === "\u001b[A" || chunk === "\u001bOA" || chunk === "k") return "up";
  if (chunk === "\u001b[B" || chunk === "\u001bOB" || chunk === "j") return "down";
  // Esc-[ alone can arrive split; treat other CSI as ignore for now.
  if (chunk.startsWith("\u001b")) return "ignore";
  return "ignore";
}

/**
 * Interactive single-select with arrow-key navigation and a highlight bar.
 * Requires a TTY. Throws {@link SelectCancelledError} on Esc / Ctrl+C.
 */
export async function selectPrompt<T>(options: SelectPromptOptions<T>): Promise<T> {
  assertSelectable(options.options);

  const input = options.input ?? defaultInput;
  const output = options.output ?? defaultOutput;
  const theme = createTheme(output);

  if (!input.isTTY || !output.isTTY || typeof input.setRawMode !== "function") {
    throw new Error(
      "Interactive selection requires a TTY. Pass an explicit flag (e.g. --target / --ci) or run in a terminal.",
    );
  }

  const initial = Math.min(
    Math.max(options.initialIndex ?? 0, 0),
    options.options.length - 1,
  );
  let index = initial;
  let frame: RenderState = { lines: 0 };

  const wasRaw = input.isRaw;
  input.setRawMode(true);
  input.resume();
  output.write(ansi.hideCursor);

  const redraw = () => {
    frame = renderFrame(output, {
      message: options.message,
      options: options.options,
      index,
      theme,
      previous: frame,
    });
  };

  redraw();

  try {
    return await new Promise<T>((resolve, reject) => {
      const onData = (chunk: string | Buffer) => {
        const key = readKey(typeof chunk === "string" ? chunk : chunk.toString("utf8"));
        if (key === "ignore") return;
        if (key === "up") {
          index = (index - 1 + options.options.length) % options.options.length;
          redraw();
          return;
        }
        if (key === "down") {
          index = (index + 1) % options.options.length;
          redraw();
          return;
        }
        if (key === "cancel") {
          cleanup();
          clearFrame(output, frame);
          reject(new SelectCancelledError());
          return;
        }
        // enter
        const selected = options.options[index]!;
        cleanup();
        clearFrame(output, frame);
        writeDone(output, options.message, selected, theme);
        resolve(selected.value);
      };

      const cleanup = () => {
        input.off("data", onData);
      };

      input.on("data", onData);
    });
  } finally {
    output.write(ansi.showCursor);
    if (typeof input.setRawMode === "function") {
      input.setRawMode(wasRaw);
    }
    // Prevent Node from staying alive on an open stdin stream after raw-mode prompts.
    if (typeof input.pause === "function") {
      input.pause();
    }
  }
}
