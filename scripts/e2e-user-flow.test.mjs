import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  cookieHeader,
  dashboardPackagePath,
  defaultInstallShUrl,
  loadDotEnv,
  packageNameForRun,
  packageVersionForRun,
  publicPackagePath,
  redactSecrets,
  requiredEnv,
  resolveInstallShUrl,
} from "./e2e-user-flow-lib.mjs";

describe("e2e-user-flow helpers", () => {
  it("builds package names, versions, and page paths", () => {
    expect(packageNameForRun("acme-corp", 1700000000)).toBe("@acme-corp/e2e-1700000000");
    expect(packageVersionForRun(1700000000)).toBe("0.0.1700000000");
    expect(publicPackagePath("@acme-corp/e2e-1700000000", "0.0.1700000000")).toBe(
      "/packages/acme-corp/e2e-1700000000/0.0.1700000000",
    );
    expect(dashboardPackagePath("@acme-corp/e2e-1700000000")).toBe(
      "/dashboard/packages/acme-corp/e2e-1700000000",
    );
  });

  it("requires env vars and does not echo the pin", () => {
    expect(() => requiredEnv({})).toThrow(/AIPM_TEST_EMAIL/);
    const parsed = requiredEnv({
      AIPM_TEST_EMAIL: "test.user@example.com",
      AIPM_TEST_AUTH_PIN: "246801",
      AIPM_TEST_ORG: "acme-corp",
      WEB_URL: "https://www.aipm-registry.com/",
      API_URL: "https://api.aipm-registry.com/",
    });
    expect(parsed).toMatchObject({
      email: "test.user@example.com",
      pin: "246801",
      org: "acme-corp",
      webUrl: "https://www.aipm-registry.com",
      apiUrl: "https://api.aipm-registry.com",
    });
    expect(redactSecrets("token=aipm_secret pin=246801", ["aipm_secret", "246801"])).toBe(
      "token=<redacted> pin=<redacted>",
    );
  });

  it("loads dotenv without overriding existing env", async () => {
    const dir = await mkdtemp(join(tmpdir(), "aipm-e2e-env-"));
    const file = join(dir, ".env.e2e");
    await writeFile(file, "AIPM_TEST_ORG=from-file\nAIPM_TEST_EMAIL=from-file@example.com\n");
    const env = { AIPM_TEST_ORG: "already-set" };
    await loadDotEnv(file, env);
    expect(env.AIPM_TEST_ORG).toBe("already-set");
    expect(env.AIPM_TEST_EMAIL).toBe("from-file@example.com");
  });

  it("builds cookie headers and the default install.sh URL", () => {
    expect(cookieHeader([{ name: "aipm_session", value: "abc" }])).toBe("aipm_session=abc");
    expect(defaultInstallShUrl("0.3.3")).toBe(
      "https://github.com/abhisri2090/aipm/releases/download/cli-v0.3.3/install.sh",
    );
  });

  it("falls back to a GitHub release install.sh when the package version URL is missing", async () => {
    const calls = [];
    const fetchImpl = async (url, init = {}) => {
      calls.push({ url: String(url), method: init.method ?? "GET" });
      if (String(url).includes("/cli-v0.3.3/install.sh")) {
        return { ok: false, status: 404 };
      }
      return {
        ok: true,
        status: 200,
        async json() {
          return [
            {
              tag_name: "cli-v0.3.4",
              assets: [
                {
                  name: "install.sh",
                  browser_download_url:
                    "https://github.com/abhisri2090/aipm/releases/download/cli-v0.3.4/install.sh",
                },
              ],
            },
          ];
        },
      };
    };
    await expect(
      resolveInstallShUrl({ cliVersion: "0.3.3", fetchImpl }),
    ).resolves.toBe("https://github.com/abhisri2090/aipm/releases/download/cli-v0.3.4/install.sh");
    expect(calls[0]?.method).toBe("HEAD");
  });
});
