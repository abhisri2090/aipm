/**
 * Format a recommended CLI command for error and hint messages.
 *
 * Renders as a quoted command (`"aipm init"`) and cyan when stderr is a TTY.
 * Use angle brackets for placeholders the user must fill in, e.g.
 * `recommendCmd("aipm add <@scope/pkg>@<version>")`.
 */
export function recommendCmd(command: string, stream: NodeJS.WriteStream = process.stderr): string {
  const quoted = `"${command}"`;
  if (!stream.isTTY) return quoted;
  return `\u001b[36m${quoted}\u001b[39m`;
}
