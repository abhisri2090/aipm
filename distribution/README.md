# CLI Distribution

AIPM CLI is published to npm first, then distributed as standalone binaries and
package-manager manifests.

## Targets

- GitHub Releases: standalone binaries for macOS, Linux, and Windows.
- Homebrew: `aipm-registry/tap/aipm`.
- Scoop: `aipm-registry/scoop-bucket/aipm`.
- winget: `aipm-registry.aipm` in `microsoft/winget-pkgs`.

## Build Locally

```bash
pnpm release:cli:binaries
pnpm release:cli:templates
```

Generated files:

```txt
release/binaries/
release/homebrew/Formula/aipm.rb
release/scoop/bucket/aipm.json
release/winget/aipm.yaml
release/installers/install.sh
release/installers/install.ps1
```

## Accounts And Repositories Needed

- GitHub org access to `aipm-registry/aipm` with permission to create releases.
- Optional public Homebrew tap repo: `aipm-registry/homebrew-tap`.
- Optional public Scoop bucket repo: `aipm-registry/scoop-bucket`.
- A GitHub account that can submit PRs to `microsoft/winget-pkgs`.

No separate Homebrew, Scoop, or winget account is required. They are GitHub
repository/PR workflows. The same `aipm-registry/aipm` repo can hold generated
release files under `release/`; dedicated tap/bucket repos only make the install
commands shorter and more conventional later.

## Release Order

1. Tag the CLI release, for example `cli-v0.1.9`.
2. Let GitHub Actions upload standalone binaries and checksums.
3. Copy `release/homebrew/Formula/aipm.rb` into
   `aipm-registry/homebrew-tap/Formula/aipm.rb`.
4. Copy `release/scoop/bucket/aipm.json` into
   `aipm-registry/scoop-bucket/bucket/aipm.json`.
5. Submit the winget manifest to `microsoft/winget-pkgs`.
6. Upload or link the install scripts from the release page and website.

## Notes

- The standalone binaries are built from `apps/cli/dist/bin.cjs`.
- The npm package remains the canonical JavaScript package.
- The binaries should be treated as release artifacts, not committed source.
