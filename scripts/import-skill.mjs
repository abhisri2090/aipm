#!/usr/bin/env node
import { pathToFileURL } from "node:url";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile, access } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import {
  buildPackageName,
  computeContentHash,
  detectLicense,
  fetchGitHubFolder,
  fetchGitHubUser,
  githubRequest,
  parseFrontmatter,
  parseGitHubFolderUrl,
  pickEntryFile,
  resolveDescription,
  resolveAgentDescription,
  resolveImportVersion,
} from "./import-skill-lib.mjs";

const execFileAsync = promisify(execFile);
const AUDIT_PATH = new URL("./imported-skills.json", import.meta.url);

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

async function packDirectory(dir) {
  const { stdout } = await execFileAsync("tar", ["-czf", "-", "-C", dir, "."], {
    maxBuffer: 50 * 1024 * 1024,
    encoding: "buffer",
  });
  return Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout);
}

async function fetchImportMeta(registryUrl, packageName) {
  const response = await fetch(
    `${registryUrl}/v1/packages/${encodeURIComponent(packageName)}/import-meta`,
  );
  if (response.status === 404) {
    return { latestVersion: null, latestContentHash: null };
  }
  if (!response.ok) {
    throw new Error(`Import meta failed: ${response.status}`);
  }
  return response.json();
}

async function appendAudit(entry) {
  let existing = [];
  try {
    await access(AUDIT_PATH);
    existing = JSON.parse(await readFile(AUDIT_PATH, "utf8"));
  } catch {
    existing = [];
  }
  existing.push(entry);
  await writeFile(AUDIT_PATH, `${JSON.stringify(existing, null, 2)}\n`, "utf8");
}

async function postImport({ registryUrl, adminToken, tarball, author, provenance }) {
  const boundary = `aipm-import-${Date.now()}`;
  const chunks = [
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="author"\r\n\r\n${JSON.stringify(author)}\r\n`,
    ),
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="provenance"\r\n\r\n${JSON.stringify(provenance)}\r\n`,
    ),
    Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="tarball"; filename="package.tgz"\r\nContent-Type: application/gzip\r\n\r\n`,
    ),
    tarball,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ];
  const response = await fetch(`${registryUrl}/v1/admin/import`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${adminToken}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`,
    },
    body: Buffer.concat(chunks),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error ?? `Import failed: ${response.status}`);
  }
  return body;
}

export async function importSkillFromUrl(sourceUrl, env = process.env) {
  const githubToken = env.GITHUB_TOKEN?.trim();
  const adminToken = requiredEnv("AIPM_ADMIN_TOKEN");
  const registryUrl = (env.AIPM_REGISTRY_URL ?? "http://localhost:8080").replace(/\/$/, "");

  const parsed = parseGitHubFolderUrl(sourceUrl);
  const folderName = parsed.path.split("/").pop() ?? "skill";
  const packageName = buildPackageName(parsed.owner, folderName);

  const [{ files, commitSha }, user, repoMeta] = await Promise.all([
    fetchGitHubFolder({ ...parsed, token: githubToken }),
    fetchGitHubUser(parsed.owner, githubToken),
    githubRequest(`/repos/${parsed.owner}/${parsed.repo}`, githubToken),
  ]);

  const entry = pickEntryFile(Object.keys(files));
  if (!entry) throw new Error("Could not find SKILL.md or README.md in folder");

  const frontmatter = parseFrontmatter(files[entry] ?? "");
  const description = resolveDescription({
    frontmatter,
    readmeContent: files["README.md"] ?? files["readme.md"],
    fallbackName: folderName,
  });
  const agentDescription = resolveAgentDescription(files[entry]);
  const license = detectLicense(files, repoMeta.license);
  const contentHash = computeContentHash(files);
  const importMeta = await fetchImportMeta(registryUrl, packageName);
  const versionDecision = resolveImportVersion({
    latestVersion: importMeta.latestVersion,
    latestContentHash: importMeta.latestContentHash,
    contentHash,
  });

  if (versionDecision.action === "skip") {
    const skipped = {
      sourceUrl,
      packageName,
      version: versionDecision.version,
      action: "skipped",
      contentHash,
      at: new Date().toISOString(),
    };
    await appendAudit(skipped);
    return skipped;
  }

  const tempDir = await mkdtemp(join(tmpdir(), "aipm-import-"));
  try {
    for (const [name, content] of Object.entries(files)) {
      await writeFile(join(tempDir, name), content, "utf8");
    }
    await writeFile(
      join(tempDir, "aipm.manifest.json"),
      `${JSON.stringify(
        {
          schemaVersion: "0.1",
          name: packageName,
          version: versionDecision.version,
          type: "skill",
          description,
          entry,
          targets: ["*"],
          license,
          ...(agentDescription ? { agentDescription } : {}),
        },
        null,
        2,
      )}\n`,
      "utf8",
    );

    const tarball = await packDirectory(tempDir);
    const author = {
      githubId: String(user.id),
      githubLogin: user.login,
      name: user.name ?? null,
      avatarUrl: user.avatar_url ?? null,
      email: user.email ?? null,
      xHandle: user.twitter_username ?? null,
      githubUrl: user.html_url ?? null,
    };
    const provenance = {
      sourceUrl,
      commitSha,
      license,
      contentHash,
    };
    const result = await postImport({ registryUrl, adminToken, tarball, author, provenance });
    const published = {
      sourceUrl,
      packageName: result.name,
      version: result.version,
      action: "published",
      contentHash,
      integrity: result.integrity,
      at: new Date().toISOString(),
    };
    await appendAudit(published);
    return published;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const sourceUrl = process.argv[2];
  if (!sourceUrl) {
    console.error("Usage: pnpm import-skill <github-folder-url>");
    process.exit(1);
  }
  importSkillFromUrl(sourceUrl)
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exit(1);
    });
}
