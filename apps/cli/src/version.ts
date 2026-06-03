import { readFileSync } from "node:fs";
import { join } from "node:path";

/** Resolved from apps/cli/package.json next to dist/bin.cjs at runtime. */
export function getCliVersion(): string {
  const pkgPath = join(__dirname, "..", "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };
  return pkg.version;
}
