import { createServer } from "node:http";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { ProjectPackageJson } from "@aipm-registry/schemas";
import {
  installTrackedPrompt,
  parsePromptUrl,
  promptSnapshotPath,
} from "./prompt-install.js";
import { readLockfile, readProjectPackageJson } from "./project-files.js";

function promptDetail(promptText = "Summarize {{topic}} clearly.") {
  return {
    id: "prompt-1",
    slug: "clear-summary",
    title: "Clear Summary",
    summary: "Creates a concise summary.",
    category: "Productivity",
    tags: ["summary"],
    inputTypes: ["text"],
    outputTypes: ["text"],
    effort: "quick",
    language: "English",
    promptText,
    variables: [{ name: "topic", description: "Material to summarize.", example: "Quarterly notes", required: true }],
    exampleInput: "Quarterly notes",
    exampleOutput: "A concise summary.",
    usageNotes: "Verify important facts.",
    license: "CC BY 4.0",
    sourceUrl: null,
    updatedAt: "2026-09-05T00:00:00.000Z",
    path: "/prompts/aipm/clear-summary",
    publisher: {
      scope: "aipm",
      kind: "organization" as const,
      org: { slug: "aipm", name: "AIPM" },
      user: { username: "owner", name: "Owner" },
    },
  };
}

describe("prompt installation", () => {
  it("recognizes only canonical AIPM prompt URLs", () => {
    expect(parsePromptUrl("https://www.aipm-registry.com/prompts/AIPM/Clear-Summary?x=1")).toMatchObject({
      publisher: "aipm",
      slug: "clear-summary",
      alias: "clear-summary",
      url: "https://www.aipm-registry.com/prompts/aipm/clear-summary",
    });
    expect(parsePromptUrl("https://example.com/prompts/aipm/clear-summary")).toBeNull();
    expect(parsePromptUrl("@aipm/clear-summary")).toBeNull();
  });

  it("tracks the URL, writes a Markdown snapshot, and records lock metadata", async () => {
    const root = await mkdtemp(join(tmpdir(), "aipm-prompt-install-"));
    let copyRecorded = false;
    const server = createServer((request, response) => {
      if (request.method === "GET" && request.url === "/v1/prompts/aipm/clear-summary") {
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify(promptDetail()));
        return;
      }
      if (request.method === "POST" && request.url === "/v1/prompts/aipm/clear-summary/copy") {
        copyRecorded = true;
        response.writeHead(200, { "content-type": "application/json" });
        response.end(JSON.stringify({ copyCount: 1 }));
        return;
      }
      response.writeHead(404).end();
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected server port");
    const project: ProjectPackageJson = {
      schemaVersion: "0.1",
      registry: `http://127.0.0.1:${address.port}`,
      packages: {},
      prompts: {},
    };
    const reference = parsePromptUrl("https://www.aipm-registry.com/prompts/aipm/clear-summary")!;
    try {
      const result = await installTrackedPrompt({
        configRoot: root,
        registry: project.registry,
        project,
        reference,
        track: true,
        recordCopy: true,
      });
      expect(result.changed).toBe(true);
      expect(result.path).toBe(promptSnapshotPath(root, reference));
      expect(await readFile(result.path, "utf8")).toContain("## Prompt\n\nSummarize {{topic}} clearly.");
      expect((await readProjectPackageJson(root))?.prompts).toEqual({
        "clear-summary": "https://www.aipm-registry.com/prompts/aipm/clear-summary",
      });
      expect((await readLockfile(root))?.prompts["clear-summary"]).toMatchObject({
        id: "prompt-1",
        publisher: "aipm",
        slug: "clear-summary",
        installedPath: ".aipm/prompts/aipm--clear-summary.md",
      });
      expect(copyRecorded).toBe(true);
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
  });
});
