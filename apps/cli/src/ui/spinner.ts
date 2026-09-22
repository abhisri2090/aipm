import { createTheme } from "./theme.js";

const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"] as const;

export type SpinnerOptions = {
  text: string;
  stream?: NodeJS.WriteStream;
  /** Disable animation (e.g. CI). */
  disabled?: boolean;
};

/**
 * Minimal TTY spinner. No-ops when the stream is not interactive.
 */
export function createSpinner(options: SpinnerOptions) {
  const stream = options.stream ?? process.stderr;
  const theme = createTheme(stream);
  const disabled = options.disabled || !stream.isTTY || !theme.color;
  let text = options.text;
  let frame = 0;
  let timer: NodeJS.Timeout | undefined;
  let active = false;

  const clearLine = () => {
    if (!stream.isTTY) return;
    stream.write("\r\x1b[2K");
  };

  const render = () => {
    if (disabled || !active) return;
    const spin = FRAMES[frame % FRAMES.length]!;
    stream.write(`\r\x1b[2K${theme.accent}${spin}${theme.reset} ${text}`);
    frame += 1;
  };

  return {
    start(nextText?: string) {
      if (nextText) text = nextText;
      if (disabled) return;
      if (active) return;
      active = true;
      render();
      timer = setInterval(render, 80);
      timer.unref?.();
    },
    update(nextText: string) {
      text = nextText;
      if (disabled || !active) return;
      render();
    },
    succeed(finalText = text) {
      stop();
      if (disabled) return;
      stream.write(
        `${theme.accent}${theme.bold}✔${theme.reset} ${finalText}\n`,
      );
    },
    fail(finalText = text) {
      stop();
      if (disabled) {
        stream.write(`${finalText}\n`);
        return;
      }
      stream.write(`${theme.danger}${theme.bold}✖${theme.reset} ${finalText}\n`);
    },
    stop() {
      stop();
    },
  };

  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = undefined;
    }
    if (active) {
      clearLine();
      active = false;
    }
  }
}

export type Spinner = ReturnType<typeof createSpinner>;
