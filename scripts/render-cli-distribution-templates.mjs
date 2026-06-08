#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const version = process.env.AIPM_CLI_VERSION ?? (await readPackageVersion());
const releaseBaseUrl =
  process.env.AIPM_RELEASE_BASE_URL ??
  `https://github.com/aipm-registry/aipm/releases/download/cli-v${version}`;

const binaryDir = join(repoRoot, "release", "binaries");
const releaseDir = join(repoRoot, "release");

const assets = {
  darwinArm64: "aipm-darwin-arm64",
  darwinX64: "aipm-darwin-x64",
  linuxArm64: "aipm-linux-arm64",
  linuxX64: "aipm-linux-x64",
  windowsX64: "aipm-windows-x64.exe",
};

async function readPackageVersion() {
  const pkg = JSON.parse(await readFile(join(repoRoot, "apps", "cli", "package.json"), "utf8"));
  return pkg.version;
}

async function sha256(asset) {
  let data;
  try {
    data = await readFile(join(binaryDir, asset));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      throw new Error(
        `Missing ${asset}. Run all release binary builds first, or use GitHub Actions release-cli.yml.`,
      );
    }
    throw error;
  }
  return createHash("sha256").update(data).digest("hex");
}

async function main() {
  await mkdir(join(releaseDir, "homebrew", "Formula"), { recursive: true });
  await mkdir(join(releaseDir, "scoop", "bucket"), { recursive: true });
  await mkdir(join(releaseDir, "winget"), { recursive: true });
  await mkdir(join(releaseDir, "installers"), { recursive: true });
  const shas = Object.fromEntries(
    await Promise.all(Object.entries(assets).map(async ([key, asset]) => [key, await sha256(asset)])),
  );

  await writeFile(join(releaseDir, "homebrew", "Formula", "aipm.rb"), homebrewFormula(shas));
  await writeFile(join(releaseDir, "scoop", "bucket", "aipm.json"), scoopManifest(shas));
  await writeFile(join(releaseDir, "winget", "aipm.yaml"), wingetManifest(shas));
  await writeFile(join(releaseDir, "installers", "install.sh"), installSh(shas));
  await writeFile(join(releaseDir, "installers", "install.ps1"), installPs1(shas));
  console.log(`Rendered distribution templates for ${version} in ${releaseDir}`);
}

function homebrewFormula(shas) {
  return `class Aipm < Formula
  desc "AI package manager for installing project-ready AI skills"
  homepage "https://aipm-registry.com"
  version "${version}"
  license "Apache-2.0"

  on_macos do
    if Hardware::CPU.arm?
      url "${releaseBaseUrl}/${assets.darwinArm64}"
      sha256 "${shas.darwinArm64}"
    else
      url "${releaseBaseUrl}/${assets.darwinX64}"
      sha256 "${shas.darwinX64}"
    end
  end

  on_linux do
    if Hardware::CPU.arm? && Hardware::CPU.is_64_bit?
      url "${releaseBaseUrl}/${assets.linuxArm64}"
      sha256 "${shas.linuxArm64}"
    else
      url "${releaseBaseUrl}/${assets.linuxX64}"
      sha256 "${shas.linuxX64}"
    end
  end

  def install
    bin.install Dir["aipm-*"].first => "aipm"
  end

  test do
    assert_match "${version}", shell_output("#{bin}/aipm --version")
  end
end
`;
}

function scoopManifest(shas) {
  return `${JSON.stringify(
    {
      version,
      description: "AI package manager for installing project-ready AI skills.",
      homepage: "https://aipm-registry.com",
      license: "Apache-2.0",
      architecture: {
        "64bit": {
          url: `${releaseBaseUrl}/${assets.windowsX64}`,
          hash: shas.windowsX64,
        },
      },
      bin: [["aipm-windows-x64.exe", "aipm"]],
      checkver: {
        github: "https://github.com/aipm-registry/aipm",
        regex: "cli-v([\\\\d.]+)",
      },
      autoupdate: {
        architecture: {
          "64bit": {
            url: "https://github.com/aipm-registry/aipm/releases/download/cli-v$version/aipm-windows-x64.exe",
          },
        },
      },
    },
    null,
    2,
  )}\n`;
}

function wingetManifest(shas) {
  return `# Copy into microsoft/winget-pkgs under manifests/a/aipm-registry/aipm/${version}/
PackageIdentifier: aipm-registry.aipm
PackageVersion: ${version}
PackageLocale: en-US
Publisher: AIPM Registry
PublisherUrl: https://aipm-registry.com
PackageName: AIPM
License: Apache-2.0
LicenseUrl: https://github.com/aipm-registry/aipm/blob/main/LICENSE
ShortDescription: AI package manager for installing project-ready AI skills.
Moniker: aipm
Tags:
  - ai
  - cli
  - developer-tools
  - skills
Installers:
  - Architecture: x64
    InstallerType: portable
    InstallerUrl: ${releaseBaseUrl}/${assets.windowsX64}
    InstallerSha256: ${shas.windowsX64.toUpperCase()}
    Commands:
      - aipm
ManifestType: singleton
ManifestVersion: 1.9.0
`;
}

function installSh(shas) {
  return `#!/usr/bin/env sh
set -eu

version="\${AIPM_VERSION:-${version}}"
base_url="\${AIPM_RELEASE_BASE_URL:-https://github.com/aipm-registry/aipm/releases/download/cli-v\${version}}"
install_dir="\${AIPM_INSTALL_DIR:-/usr/local/bin}"

os="$(uname -s | tr '[:upper:]' '[:lower:]')"
arch="$(uname -m)"
case "$os:$arch" in
  darwin:arm64) asset="${assets.darwinArm64}"; sha="${shas.darwinArm64}" ;;
  darwin:x86_64) asset="${assets.darwinX64}"; sha="${shas.darwinX64}" ;;
  linux:aarch64|linux:arm64) asset="${assets.linuxArm64}"; sha="${shas.linuxArm64}" ;;
  linux:x86_64) asset="${assets.linuxX64}"; sha="${shas.linuxX64}" ;;
  *) echo "Unsupported platform: $os $arch" >&2; exit 1 ;;
esac

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
curl -fsSL "$base_url/$asset" -o "$tmp"
actual="$(shasum -a 256 "$tmp" | awk '{print $1}')"
if [ "$actual" != "$sha" ]; then
  echo "Checksum mismatch for $asset" >&2
  exit 1
fi
chmod +x "$tmp"
mkdir -p "$install_dir"
mv "$tmp" "$install_dir/aipm"
echo "Installed aipm to $install_dir/aipm"
`;
}

function installPs1(shas) {
  return `$Version = $env:AIPM_VERSION
if (-not $Version) { $Version = "${version}" }
$BaseUrl = $env:AIPM_RELEASE_BASE_URL
if (-not $BaseUrl) { $BaseUrl = "https://github.com/aipm-registry/aipm/releases/download/cli-v$Version" }
$InstallDir = $env:AIPM_INSTALL_DIR
if (-not $InstallDir) { $InstallDir = Join-Path $env:LOCALAPPDATA "AIPM\\\\bin" }

$Asset = "${assets.windowsX64}"
$ExpectedSha = "${shas.windowsX64.toUpperCase()}"
$Tmp = Join-Path $env:TEMP $Asset
New-Item -ItemType Directory -Force -Path $InstallDir | Out-Null
Invoke-WebRequest -Uri "$BaseUrl/$Asset" -OutFile $Tmp
$ActualSha = (Get-FileHash -Algorithm SHA256 $Tmp).Hash
if ($ActualSha -ne $ExpectedSha) {
  throw "Checksum mismatch for $Asset"
}
Move-Item -Force $Tmp (Join-Path $InstallDir "aipm.exe")
Write-Output "Installed aipm to $InstallDir\\\\aipm.exe"
Write-Output "Add $InstallDir to PATH if aipm is not found."
`;
}

await main();
