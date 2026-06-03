#!/usr/bin/env node
import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = join(webRoot, "app");
const symbols = ["shell", "cards", "docs", "home", "dash", "cn"];

function importPath(file) {
  const rel = relative(dirname(file), join(webRoot, "lib", "page-styles.ts")).replace(/\\/g, "/");
  return rel.replace(/\.ts$/, "");
}

for (const file of globSync("**/*.tsx", { cwd: appRoot }).map((p) => join(appRoot, p))) {
  let source = readFileSync(file, "utf8");
  if (!source.includes("page-styles")) continue;

  const used = symbols.filter((symbol) => source.includes(`${symbol}.`) || source.includes(`${symbol}(`));
  const importLine = `import { ${used.join(", ")} } from "${importPath(file)}";\n`;
  source = source.replace(/import \{[^}]+\} from ["'][^"']*page-styles["'];\n/, importLine);
  writeFileSync(file, source);
}
