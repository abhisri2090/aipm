# Open Source Readiness Checklist

Use this before making the repository public or before a major public release.

## Repository

- [x] Repository URL points to `https://github.com/abhisri2090/aipm`.
- [x] `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, and `CODE_OF_CONDUCT.md` are present.
- [x] License is present and matches package metadata.
- [ ] GitHub issues, discussions, and security advisories are configured as desired.
- [ ] Branch protection is enabled for `main`.

## Secrets

- [x] No `.env` files are tracked.
- [x] No Azure publish profiles, storage keys, SAS URLs, SSH keys, or connection strings are tracked.
- [x] No npm tokens, GitHub OAuth secrets, session secrets, or AIPM publish tokens are tracked.
- [x] Run `pnpm scan:secrets`.
- [x] Review `git status --short` and every untracked file.

## Product

- [x] `pnpm install` works from a clean checkout.
- [x] `pnpm build`, `pnpm test`, `pnpm lint`, and `pnpm typecheck` pass.
- [x] CLI package can be packed with `pnpm release:cli:pack`.
- [x] Website builds with `pnpm --filter @aipm-registry/web build`.
- [x] Public docs explain install, use, publish, security, privacy, and support.

## Deployment

- [ ] Vercel secrets are configured outside git.
- [ ] Azure secrets are stored outside git, preferably in Key Vault.
- [ ] npm publish permissions are limited to trusted maintainers.
- [ ] Production backend deployment uses `infra/azure/deploy-registry-vm.sh`.
