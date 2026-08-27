import { createHash } from "node:crypto";

function normalizeGitHubFolderPath(path) {
  const cleaned = path.replace(/\/$/, "");
  const segments = cleaned.split("/");
  const last = segments[segments.length - 1] ?? "";
  if (/\.(md|markdown|txt|json|yaml|yml)$/i.test(last)) {
    return segments.slice(0, -1).join("/");
  }
  return cleaned;
}

export function parseGitHubFolderUrl(url) {
  let parsed;
  try {
    parsed = new URL(url.trim());
  } catch {
    throw new Error(
      "Expected a GitHub repo or folder URL, like https://github.com/owner/repo or https://github.com/owner/repo/tree/main/path/to/skill",
    );
  }
  const host = parsed.hostname.toLowerCase();
  if (host !== "github.com" && host !== "www.github.com") {
    throw new Error(
      "Expected a GitHub repo or folder URL, like https://github.com/owner/repo or https://github.com/owner/repo/tree/main/path/to/skill",
    );
  }
  const segments = parsed.pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  if (segments.length < 2) {
    throw new Error(
      "Expected a GitHub repo or folder URL, like https://github.com/owner/repo or https://github.com/owner/repo/tree/main/path/to/skill",
    );
  }
  const owner = segments[0];
  let repo = segments[1];
  if (repo.toLowerCase().endsWith(".git")) {
    repo = repo.slice(0, -4);
  }
  const rest = segments.slice(2);
  if (rest.length === 0) {
    return { owner, repo, branch: "", path: "" };
  }
  if ((rest[0] === "tree" || rest[0] === "blob") && rest[1]) {
    return {
      owner,
      repo,
      branch: rest[1],
      path: normalizeGitHubFolderPath(rest.slice(2).join("/")),
    };
  }
  throw new Error(
    "Expected a GitHub repo or folder URL, like https://github.com/owner/repo or https://github.com/owner/repo/tree/main/path/to/skill",
  );
}

export function normalizeOrgSlug(value) {
  const collapsed = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  let candidate = collapsed;
  if (!candidate || candidate.length < 3) candidate = `user-${collapsed || "member"}`;
  candidate = candidate.slice(0, 32).replace(/^-|-$/g, "");
  if (!candidate || candidate.length < 3) candidate = "user-member";
  return candidate;
}

export function normalizeSkillSlug(value) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "");
  return normalized || "skill";
}

export function buildPackageName(owner, folderName) {
  const orgSlug = normalizeOrgSlug(owner);
  const skillSlug = normalizeSkillSlug(folderName);
  return `@${orgSlug}/${skillSlug}`;
}

export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return {};
  const fields = {};
  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
  }
  return fields;
}

export function pickEntryFile(fileNames) {
  const lower = new Map(fileNames.map((name) => [name.toLowerCase(), name]));
  if (lower.has("skill.md")) return lower.get("skill.md");
  if (lower.has("readme.md")) return lower.get("readme.md");
  return null;
}

export function resolveDescription({ frontmatter, readmeContent, fallbackName }) {
  let description;
  if (frontmatter.description?.trim()) {
    description = frontmatter.description.trim();
  } else if (frontmatter.name?.trim()) {
    description = frontmatter.name.trim();
  } else if (readmeContent) {
    const stripped = readmeContent.replace(/^---[\s\S]*?---\s*/m, "").trim();
    const firstLine = stripped.split("\n").find((line) => line.trim());
    description = firstLine ? firstLine.replace(/^#\s*/, "").trim() : fallbackName;
  } else {
    description = fallbackName;
  }
  return truncateDescription(description);
}

const MAX_DESCRIPTION_CHARS = 240;

export function truncateDescription(value) {
  const trimmed = value.trim();
  if (trimmed.length <= MAX_DESCRIPTION_CHARS) return trimmed;
  return `${trimmed.slice(0, MAX_DESCRIPTION_CHARS - 3).trimEnd()}...`;
}

const MAX_AGENT_DESCRIPTION_CHARS = 12000;

export function resolveAgentDescription(entryContent) {
  if (!entryContent) return undefined;
  const body = entryContent.replace(/^---[\s\S]*?---\r?\n?/, "").trim();
  if (!body) return undefined;
  if (body.length <= MAX_AGENT_DESCRIPTION_CHARS) return body;
  return `${body.slice(0, MAX_AGENT_DESCRIPTION_CHARS - 3).trimEnd()}...`;
}

export function computeContentHash(files) {
  const entries = Object.entries(files).sort(([a], [b]) => a.localeCompare(b));
  const hash = createHash("sha256");
  for (const [path, content] of entries) {
    hash.update(path);
    hash.update("\0");
    hash.update(content);
    hash.update("\0");
  }
  return hash.digest("hex");
}

export function nextPatchVersion(latestVersion) {
  if (!latestVersion) return "1.0.0";
  const match = latestVersion.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return "1.0.0";
  return `${match[1]}.${match[2]}.${Number(match[3]) + 1}`;
}

export function resolveImportVersion({ latestVersion, latestContentHash, contentHash }) {
  if (latestContentHash && latestContentHash === contentHash) {
    return { action: "skip", version: latestVersion };
  }
  return { action: "publish", version: nextPatchVersion(latestVersion) };
}

export async function githubRequest(path, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: token ? `Bearer ${token}` : undefined,
      "User-Agent": "aipm-import-skill",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!response.ok) {
    throw new Error(`GitHub API ${path} failed: ${response.status}`);
  }
  return response.json();
}

export async function fetchGitHubFolder({ owner, repo, branch, path, token }) {
  let resolvedBranch = branch;
  if (!resolvedBranch) {
    const repoMeta = await githubRequest(`/repos/${owner}/${repo}`, token);
    resolvedBranch = repoMeta.default_branch;
    if (!resolvedBranch) throw new Error("Could not resolve the repository default branch");
  }

  let commitSha;
  try {
    const refData = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${resolvedBranch}`, token);
    commitSha = refData.object.sha;
  } catch {
    const { execFile } = await import("node:child_process");
    const { promisify } = await import("node:util");
    const execFileAsync = promisify(execFile);
    const { stdout } = await execFileAsync(
      "git",
      ["ls-remote", `https://github.com/${owner}/${repo}.git`, `refs/heads/${resolvedBranch}`],
      { maxBuffer: 1024 * 1024 },
    );
    commitSha = stdout.trim().split(/\s+/)[0];
    if (!commitSha || !/^[0-9a-f]{40}$/i.test(commitSha)) {
      throw new Error(`Could not resolve commit for ${owner}/${repo}@${resolvedBranch}`);
    }
  }

  const response = await fetch(
    `https://codeload.github.com/${owner}/${repo}/tar.gz/${commitSha}`,
    {
      headers: {
        "User-Agent": "aipm-import-skill",
        Authorization: token ? `Bearer ${token}` : undefined,
      },
      redirect: "follow",
    },
  );
  if (!response.ok) {
    throw new Error(`GitHub archive download for ${owner}/${repo}@${commitSha} failed: ${response.status}`);
  }
  const tarball = Buffer.from(await response.arrayBuffer());
  const files = await extractFilesFromGitHubTarball(tarball, path);
  return { files, commitSha };
}

export async function extractFilesFromGitHubTarball(tarball, folderPath) {
  const { mkdtemp, readdir, readFile, rm, writeFile, stat } = await import("node:fs/promises");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);
  const tempDir = await mkdtemp(join(tmpdir(), "aipm-gh-tar-"));
  const tgzPath = join(tempDir, "repo.tgz");
  try {
    await writeFile(tgzPath, tarball);
    await execFileAsync("tar", ["-xzf", tgzPath, "-C", tempDir]);

    async function walk(dir) {
      const entries = await readdir(dir, { withFileTypes: true });
      const paths = [];
      for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) paths.push(...(await walk(full)));
        else if (entry.isFile()) paths.push(full);
      }
      return paths;
    }

    const normalizedFolder = (folderPath || "").replace(/\/$/, "");
    const files = {};
    for (const fullPath of await walk(tempDir)) {
      if (fullPath === tgzPath) continue;
      const relativeFromTemp = fullPath.slice(tempDir.length + 1);
      const slash = relativeFromTemp.indexOf("/");
      if (slash === -1) continue;
      const repoRelative = relativeFromTemp.slice(slash + 1);
      let relativePath = null;
      if (!normalizedFolder) relativePath = repoRelative || null;
      else if (repoRelative === normalizedFolder) relativePath = repoRelative.split("/").pop() ?? null;
      else if (repoRelative.startsWith(`${normalizedFolder}/`)) {
        relativePath = repoRelative.slice(normalizedFolder.length + 1);
      }
      if (!relativePath) continue;
      const fileStat = await stat(fullPath);
      if (!fileStat.isFile()) continue;
      files[relativePath] = await readFile(fullPath);
    }
    return files;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function fetchGitHubUser(owner, token) {
  return githubRequest(`/users/${owner}`, token);
}

export function detectLicense(files, repoLicense) {
  const licenseFile = Object.keys(files).find((name) => /^license/i.test(name));
  if (licenseFile) {
    const raw = files[licenseFile];
    const text = Buffer.isBuffer(raw) ? raw.toString("utf8") : String(raw ?? "");
    const firstLine = text.split("\n")[0]?.trim();
    if (firstLine) return firstLine.replace(/\s+/g, " ");
  }
  if (repoLicense?.spdx_id && repoLicense.spdx_id !== "NOASSERTION") {
    return repoLicense.spdx_id;
  }
  return "Apache-2.0";
}
