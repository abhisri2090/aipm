import { describe, expect, it } from "vitest";
import { splitMarkdownDocument } from "./markdown-document";

describe("splitMarkdownDocument", () => {
  it("lifts SKILL.md frontmatter out of the body", () => {
    const source = `---
name: brush
description: >
  Design finished artwork
  as SVG.
license: Apache-2.0
---

# Playcut Brush
`;

    const document = splitMarkdownDocument(source);
    expect(document.frontmatter).toEqual({
      name: "brush",
      description: "Design finished artwork as SVG.\n",
      license: "Apache-2.0",
    });
    expect(document.body.trimStart().startsWith("# Playcut Brush")).toBe(true);
  });

  it("keeps a leading thematic break when it is not frontmatter", () => {
    const source = "---\n\n# Title\n";
    expect(splitMarkdownDocument(source)).toEqual({ frontmatter: null, body: source });
  });

  it("returns the original markdown when there is no frontmatter", () => {
    const source = "# Notes\n\n- one\n";
    expect(splitMarkdownDocument(source)).toEqual({ frontmatter: null, body: source });
  });
});
