import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = new URL("..", import.meta.url).pathname;

async function sourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(path);
      return /\.(tsx?|mdx?)$/.test(entry.name) ? [path] : [];
    }),
  );
  return files.flat();
}

describe("web copy matches the CLI install paths", () => {
  it("Claude adapter writes .claude/skills/<name>/ and /targets says so", async () => {
    const adapter = await readFile(join(root, "packages/adapter-claude/src/index.ts"), "utf8");
    expect(adapter).toContain('join(input.projectRoot, ".claude", "skills", short)');
    const targets = await readFile(join(root, "apps/web/app/targets/page.tsx"), "utf8");
    expect(targets).toContain('writes: ".claude/skills/<skill>/SKILL.md"');
  });

  it("no web page claims Claude skills install to .claude/aipm/skills", async () => {
    const offenders = [];
    const dirs = ["apps/web/app", "apps/web/lib", "apps/web/components"];
    const files = (await Promise.all(dirs.map((dir) => sourceFiles(join(root, dir))))).flat();
    for (const file of files) {
      if ((await readFile(file, "utf8")).includes(".claude/aipm/skills")) offenders.push(file.replace(root, ""));
    }
    expect(offenders).toEqual([]);
  });
});
