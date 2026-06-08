import { createHash } from "node:crypto";

const GITHUB_TREE_URL =
  /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/tree\/([^/]+)\/(.+?)\/?$/;

export function parseGitHubFolderUrl(url) {
  const match = url.trim().match(GITHUB_TREE_URL);
  if (!match) {
    throw new Error("Expected https://github.com/{owner}/{repo}/tree/{branch}/{path}");
  }
  return {
    owner: match[1],
    repo: match[2],
    branch: match[3],
    path: match[4].replace(/\/$/, ""),
  };
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
  if (frontmatter.description?.trim()) return frontmatter.description.trim();
  if (frontmatter.name?.trim()) return frontmatter.name.trim();
  if (readmeContent) {
    const stripped = readmeContent.replace(/^---[\s\S]*?---\s*/m, "").trim();
    const firstLine = stripped.split("\n").find((line) => line.trim());
    if (firstLine) return firstLine.replace(/^#\s*/, "").trim();
  }
  return fallbackName;
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
  const refData = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/${branch}`, token);
  const commitSha = refData.object.sha;
  const treeData = await githubRequest(
    `/repos/${owner}/${repo}/git/trees/${commitSha}?recursive=1`,
    token,
  );
  const prefix = `${path.replace(/\/$/, "")}/`;
  const blobs = treeData.tree.filter(
    (entry) => entry.type === "blob" && (entry.path === path || entry.path.startsWith(prefix)),
  );
  const files = {};
  for (const blob of blobs) {
    const relativePath =
      blob.path === path ? blob.path.split("/").pop() : blob.path.slice(prefix.length);
    if (!relativePath) continue;
    const contentResponse = await fetch(blob.url, {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: token ? `Bearer ${token}` : undefined,
        "User-Agent": "aipm-import-skill",
      },
    });
    if (!contentResponse.ok) {
      throw new Error(`Failed to download ${blob.path}: ${contentResponse.status}`);
    }
    const payload = await contentResponse.json();
    files[relativePath] = Buffer.from(payload.content, payload.encoding === "base64" ? "base64" : "utf8").toString("utf8");
  }
  return { files, commitSha };
}

export async function fetchGitHubUser(owner, token) {
  return githubRequest(`/users/${owner}`, token);
}

export function detectLicense(files, repoLicense) {
  const licenseFile = Object.keys(files).find((name) => /^license/i.test(name));
  if (licenseFile) {
    const firstLine = files[licenseFile].split("\n")[0]?.trim();
    if (firstLine) return firstLine.replace(/\s+/g, " ");
  }
  if (repoLicense?.spdx_id && repoLicense.spdx_id !== "NOASSERTION") {
    return repoLicense.spdx_id;
  }
  return "Apache-2.0";
}
