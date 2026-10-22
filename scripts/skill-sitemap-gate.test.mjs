import { describe, expect, it } from "vitest";
import { GSC_SITEMAP_ALLOWLIST, isVersionedSkillSitemapPath } from "../apps/web/lib/gsc-sitemap-allowlist.ts";
import { selectSkillsForSitemap, skillSitemapLastmod, skillSitemapLocs } from "../apps/web/lib/skill-sitemap-gate.ts";
import sitemap from "../apps/web/lib/static-sitemap";

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

  it("keeps allowlisted URLs that fail the quality gate, including a duplicate loser", () => {
    const quiet = skill({
      name: "@coreyhaines31/competitor-profiling",
      version: "1.0.0",
      description: "short",
      githubStars: 0,
      installCount: 0,
      scan: { status: "not_scanned", scannedAt: null },
    });
    const allow = new Set(["/skills/coreyhaines31/competitor-profiling/1.0.0"]);
    expect(selectSkillsForSitemap([quiet], curated)).toEqual([]);
    expect(selectSkillsForSitemap([quiet], curated, allow).map((item) => item.name)).toEqual([
      "@coreyhaines31/competitor-profiling",
    ]);

    const copy = skill({
      name: "@mattpocock/teach",
      version: "1.0.1",
      description: "short",
      githubStars: 0,
      installCount: 0,
      import: { contentHash: "same" },
      createdAt: "2026-10-01T00:00:00.000Z",
    });
    const original = skill({
      name: "@other/teach",
      version: "1.0.0",
      githubStars: 4,
      import: { contentHash: "same" },
      createdAt: "2026-08-01T00:00:00.000Z",
    });
    const names = selectSkillsForSitemap([copy, original], curated, new Set(["/skills/mattpocock/teach/1.0.1"])).map(
      (item) => item.name,
    );
    expect(names).toContain("@other/teach");
    expect(names).toContain("@mattpocock/teach");
  });

  it("emits every allowlisted skill version once, even when the listing omits it", () => {
    expect(GSC_SITEMAP_ALLOWLIST.some((path) => path.startsWith("/packages/"))).toBe(false);
    expect(GSC_SITEMAP_ALLOWLIST).toContain("/skills/coreyhaines31/competitor-profiling/1.0.0");
    expect(GSC_SITEMAP_ALLOWLIST).toContain("/skills/mattpocock/teach/1.0.1");

    const dropped = skill({
      name: "@coreyhaines31/competitor-profiling",
      version: "1.0.0",
      description: "short",
      githubStars: 0,
      installCount: 0,
      scan: undefined,
    });
    const locs = skillSitemapLocs([dropped], curated, GSC_SITEMAP_ALLOWLIST);
    const paths = locs.map((entry) => entry.path);
    expect(paths.filter((path) => path === "/skills/coreyhaines31/competitor-profiling/1.0.0")).toHaveLength(1);
    for (const path of GSC_SITEMAP_ALLOWLIST) {
      if (isVersionedSkillSitemapPath(path)) expect(paths, path).toContain(path);
      else expect(paths, path).not.toContain(path);
    }
    const missing = skillSitemapLocs([], curated, ["/skills/mattpocock/teach/1.0.1", "/skills/claude"]);
    expect(missing).toEqual([{ path: "/skills/mattpocock/teach/1.0.1", lastmod: null }]);
  });

  it("keeps allowlisted discovery hubs on the static sitemap", async () => {
    const paths = new Set((await sitemap()).map((entry) => new URL(entry.url).pathname));
    for (const path of ["/skills/claude", "/skills/cursor", "/skills/code-review"]) {
      expect(paths.has(path), path).toBe(true);
    }
    expect(paths.has("/skills/mattpocock/teach/1.0.1")).toBe(false);
    expect(paths.has("/packages/mattpocock/teach/1.0.1")).toBe(false);
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
