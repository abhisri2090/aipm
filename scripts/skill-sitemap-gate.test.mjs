import { describe, expect, it } from "vitest";
import { selectSkillsForSitemap, skillSitemapLastmod } from "../apps/web/lib/skill-sitemap-gate.ts";

const curated = new Set(["@hub/picked"]);

function skill(overrides = {}) {
  return {
    name: "@acme/review",
    version: "1.0.0",
    description: "Reviews a pull request and lists the risks before you merge it.",
    createdAt: "2026-09-01T00:00:00.000Z",
    installCount: 0,
    githubStars: 12,
    publisher: { user: { verified: false } },
    import: { contentHash: null },
    scan: { status: "clean", scannedAt: "2026-09-02T00:00:00.000Z" },
    ...overrides,
  };
}

describe("selectSkillsForSitemap", () => {
  it("keeps a skill with a real description, a scan, and a trust signal", () => {
    expect(selectSkillsForSitemap([skill()], curated).map((item) => item.name)).toEqual(["@acme/review"]);
  });

  it("drops a blank description, a yaml artifact, a title copy, and a too-short description", () => {
    const rows = [
      skill({ name: "@acme/blank", description: "   " }),
      skill({ name: "@acme/gt", description: ">" }),
      skill({
        name: "@acme/title",
        description: "This description is long enough but it is also the title",
        displayName: "This description is long enough but it is also the title",
      }),
      skill({ name: "@acme/short", description: "Reviews code." }),
    ];
    expect(selectSkillsForSitemap(rows, curated)).toEqual([]);
  });

  it("drops skills that are not yet scanned", () => {
    expect(selectSkillsForSitemap([skill({ scan: { status: "not_scanned", scannedAt: null } })], curated)).toEqual([]);
    expect(selectSkillsForSitemap([skill({ scan: undefined })], curated)).toEqual([]);
  });

  it("requires at least one trust signal", () => {
    const quiet = skill({ githubStars: 0, installCount: 0, publisher: { user: { verified: false } } });
    expect(selectSkillsForSitemap([quiet], curated)).toEqual([]);
    expect(selectSkillsForSitemap([skill({ githubStars: 0, installCount: 3 })], curated)).toHaveLength(1);
    expect(
      selectSkillsForSitemap(
        [skill({ githubStars: 0, publisher: { user: { verified: true } } })],
        curated,
      ),
    ).toHaveLength(1);
    expect(
      selectSkillsForSitemap(
        [skill({ name: "@hub/picked", githubStars: 0, installCount: 0 })],
        curated,
      ),
    ).toHaveLength(1);
  });

  it("keeps only the earliest skill when SKILL.md hashes match, then the most-starred", () => {
    const early = skill({
      name: "@acme/original",
      createdAt: "2026-08-01T00:00:00.000Z",
      githubStars: 2,
      import: { contentHash: "same" },
    });
    const later = skill({
      name: "@acme/copy",
      createdAt: "2026-09-01T00:00:00.000Z",
      githubStars: 900,
      import: { contentHash: "same" },
    });
    expect(selectSkillsForSitemap([later, early], curated).map((item) => item.name)).toEqual(["@acme/original"]);

    const tiedEarlyName = skill({
      name: "@acme/b",
      createdAt: "2026-08-01T00:00:00.000Z",
      githubStars: 1,
      import: { contentHash: "tie" },
    });
    const tiedStar = skill({
      name: "@acme/a",
      createdAt: "2026-08-01T00:00:00.000Z",
      githubStars: 50,
      import: { contentHash: "tie" },
    });
    expect(selectSkillsForSitemap([tiedEarlyName, tiedStar], curated).map((item) => item.name)).toEqual(["@acme/a"]);
  });

  it("uses the later of publish time and scan time, and omits a lastmod it cannot trust", () => {
    expect(
      skillSitemapLastmod({
        createdAt: "2026-09-01T00:00:00.000Z",
        scan: { scannedAt: "2026-09-03T00:00:00.000Z" },
      }),
    ).toBe("2026-09-03T00:00:00.000Z");
    expect(skillSitemapLastmod({ createdAt: "not-a-date", scan: { scannedAt: null } })).toBeNull();
    expect(skillSitemapLastmod({ createdAt: "2026-09-01T00:00:00.000Z", scan: { scannedAt: "nope" } })).toBe(
      "2026-09-01T00:00:00.000Z",
    );
  });

  it("does not treat missing hashes as duplicates", () => {
    const first = skill({ name: "@acme/one", import: {} });
    const second = skill({ name: "@acme/two", import: { contentHash: "" } });
    expect(selectSkillsForSitemap([first, second], curated).map((item) => item.name).sort()).toEqual([
      "@acme/one",
      "@acme/two",
    ]);
  });
});
