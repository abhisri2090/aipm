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

## GitHub Environment Setup

Create a GitHub environment named `production` for release workflows.

Secrets:

```txt
NPM_TOKEN
PACKAGE_REPO_TOKEN
```

Variables:

```txt
HOMEBREW_TAP_REPO=aipm-registry/homebrew-tap
SCOOP_BUCKET_REPO=aipm-registry/scoop-bucket
```

`NPM_TOKEN` publishes `@aipm-registry/cli` to npm. `PACKAGE_REPO_TOKEN` needs
write access to the optional Homebrew tap and Scoop bucket repos.

## Accounts And Repositories Needed

- GitHub org access to `aipm-registry/aipm` with permission to create releases.
- npm account/token with publish access to `@aipm-registry/cli`.
- Optional public Homebrew tap repo: `aipm-registry/homebrew-tap`.
- Optional public Scoop bucket repo: `aipm-registry/scoop-bucket`.
- A GitHub account that can submit PRs to `microsoft/winget-pkgs`.

No separate Homebrew, Scoop, or winget account is required. They are GitHub
repository/PR workflows. The same `aipm-registry/aipm` repo can hold generated
release files under `release/`; dedicated tap/bucket repos only make the install
commands shorter and more conventional later.

## Release Order

1. Push a CLI release tag, for example `cli-v0.2.0`.
2. GitHub Actions sets `apps/cli/package.json` to the tag version in the
   runner, builds standalone binaries, and creates checksums.
3. GitHub Actions uploads binaries, installer scripts, and package-manager
   manifests to the GitHub release.
4. GitHub Actions publishes `@aipm-registry/cli` to npm with `NPM_TOKEN`.
5. If `HOMEBREW_TAP_REPO` and `PACKAGE_REPO_TOKEN` are set, GitHub Actions
   updates `Formula/aipm.rb` in the Homebrew tap repo.
6. If `SCOOP_BUCKET_REPO` and `PACKAGE_REPO_TOKEN` are set, GitHub Actions
   updates `bucket/aipm.json` in the Scoop bucket repo.
7. Submit the generated winget manifest to `microsoft/winget-pkgs`.

Create the tag from the commit you want to release:

```bash
git tag cli-v0.2.0
git push origin cli-v0.2.0
```

## Notes

- The standalone binaries are built from `apps/cli/dist/bin.cjs`.
- The npm package remains the canonical JavaScript package.
- Release workflows are tag-only. Do not run CLI releases from branch pushes.
- The binaries should be treated as release artifacts, not committed source.
- Winget remains a generated manifest plus PR flow for now.
