/**
 * Format a recommended CLI command for error and hint messages.
 *
 * Renders as a quoted command (`"aipm init"`) in brand mint when stderr is a TTY.
 * Use angle brackets for placeholders the user must fill in, e.g.
 * `recommendCmd("aipm add <@scope/pkg>@<version>")`.
 */
import { createTheme, type ThemeEnv } from "./ui/theme.js";

export function recommendCmd(
  command: string,
  stream: NodeJS.WriteStream = process.stderr,
  env?: ThemeEnv,
): string {
  const quoted = `"${command}"`;
  const theme = createTheme(stream, env);
  if (!theme.color) return quoted;
  return `${theme.accent}${quoted}${theme.reset}`;
}
