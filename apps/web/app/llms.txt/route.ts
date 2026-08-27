import {
  CLI_HOMEBREW_COMMAND,
  CLI_INSTALL_COMMAND,
  CLI_INSTALL_SCRIPT_COMMAND,
  CLI_RELEASE_URL,
  CLI_SCOOP_COMMAND,
  CLI_VERSION,
  CLI_WINDOWS_INSTALL_COMMAND,
  SITE_URL,
} from "../../lib/registry";
import { buildLlmsTxt } from "../../lib/llms-txt";

export const dynamic = "force-static";

export function GET() {
  const body = buildLlmsTxt({
    siteUrl: SITE_URL,
    cliVersion: CLI_VERSION,
    cliReleaseUrl: CLI_RELEASE_URL,
    cliInstallCommand: CLI_INSTALL_COMMAND,
    cliInstallScriptCommand: CLI_INSTALL_SCRIPT_COMMAND,
    cliHomebrewCommand: CLI_HOMEBREW_COMMAND,
    cliWindowsInstallCommand: CLI_WINDOWS_INSTALL_COMMAND,
    cliScoopCommand: CLI_SCOOP_COMMAND,
  });

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
    },
  });
}
