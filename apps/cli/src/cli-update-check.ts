import { stderr } from "node:process";

export const CLI_PACKAGE_NAME = "@aipm-registry/cli";
export const CLI_UPDATE_COMMAND = `npm install -g ${CLI_PACKAGE_NAME}`;

const NPM_REGISTRY = "https://registry.npmjs.org";
const FETCH_TIMEOUT_MS = 3_000;

export type SemVer = {
  major: number;
  minor: number;
  patch: number;
};

export type CliUpdateLevel = "none" | "patch-minor" | "major";

export function parseSemVer(version: string): SemVer | null {
  const match = version.trim().match(/^(\d+)\.(\d+)\.(\d+)/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function isSemVerNewer(current: SemVer, latest: SemVer): boolean {
  if (latest.major !== current.major) return latest.major > current.major;
  if (latest.minor !== current.minor) return latest.minor > current.minor;
  return latest.patch > current.patch;
}

export function classifyCliUpdate(current: string, latest: string): CliUpdateLevel {
  const cur = parseSemVer(current);
  const lat = parseSemVer(latest);
  if (!cur || !lat || !isSemVerNewer(cur, lat)) return "none";
  if (lat.major > cur.major) return "major";
  return "patch-minor";
}

export async function fetchLatestCliVersion(
  fetchImpl: typeof fetch = fetch,
): Promise<string | null> {
  try {
    const response = await fetchImpl(
      `${NPM_REGISTRY}/${encodeURIComponent(CLI_PACKAGE_NAME)}/latest`,
      {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      },
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { version?: string };
    return data.version ?? null;
  } catch {
    return null;
  }
}

export interface CliUpdateNoticeOptions {
  currentVersion: string;
  latestVersion: string;
  level: Exclude<CliUpdateLevel, "none">;
  useColor?: boolean;
  writeInfo?: (message: string) => void;
  writeWarn?: (message: string) => void;
}

export function formatCliUpdateNotice(options: CliUpdateNoticeOptions): string {
  const { currentVersion, latestVersion, level } = options;
  const cmd = CLI_UPDATE_COMMAND;
  if (level === "major") {
    return `AIPM CLI ${latestVersion} is available (you have ${currentVersion}). Update now: ${cmd}`;
  }
  return `A new AIPM CLI version is available (${currentVersion} → ${latestVersion}). Run: ${cmd}`;
}

export function printCliUpdateNotice(options: CliUpdateNoticeOptions): void {
  const useColor = options.useColor ?? stderr.isTTY;
  const writeInfo = options.writeInfo ?? ((message) => console.log(message));
  const writeWarn = options.writeWarn ?? ((message) => console.error(message));
  const message = formatCliUpdateNotice(options);

  if (options.level === "major") {
    const red = useColor ? "\x1b[31m" : "";
    const reset = useColor ? "\x1b[0m" : "";
    writeWarn(`${red}${message}${reset}`);
    return;
  }

  writeInfo(message);
}

export async function notifyCliUpdateIfNeeded(
  currentVersion: string,
  options?: {
    fetchLatest?: () => Promise<string | null>;
    useColor?: boolean;
    writeInfo?: (message: string) => void;
    writeWarn?: (message: string) => void;
  },
): Promise<CliUpdateLevel> {
  const latestVersion = await (options?.fetchLatest ?? fetchLatestCliVersion)();
  if (!latestVersion) return "none";

  const level = classifyCliUpdate(currentVersion, latestVersion);
  if (level === "none") return "none";

  printCliUpdateNotice({
    currentVersion,
    latestVersion,
    level,
    useColor: options?.useColor,
    writeInfo: options?.writeInfo,
    writeWarn: options?.writeWarn,
  });
  return level;
}
