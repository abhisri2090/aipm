# Open Source Readiness Checklist

Use this before making the repository public or before a major public release.

## Repository

- [ ] Repository URL points to `https://github.com/aipm-registry/aipm`.
- [ ] `README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `SUPPORT.md`, and `CODE_OF_CONDUCT.md` are present.
- [ ] License is present and matches package metadata.
- [ ] GitHub issues, discussions, and security advisories are configured as desired.
- [ ] Branch protection is enabled for `main`.

## Secrets

- [ ] No `.env` files are tracked.
- [ ] No Azure publish profiles, storage keys, SAS URLs, SSH keys, or connection strings are tracked.
- [ ] No npm tokens, GitHub OAuth secrets, session secrets, or AIPM publish tokens are tracked.
- [ ] Run `pnpm scan:secrets`.
- [ ] Review `git status --short` and every untracked file.

## Product

- [ ] `pnpm install` works from a clean checkout.
- [ ] `pnpm build`, `pnpm test`, `pnpm lint`, and `pnpm typecheck` pass.
- [ ] CLI package can be packed with `pnpm release:cli:pack`.
- [ ] Website builds with `pnpm --filter @aipm-registry/web build`.
- [ ] Public docs explain install, use, publish, security, privacy, and support.

## Deployment

- [ ] Vercel secrets are configured outside git.
- [ ] Azure secrets are stored outside git, preferably in Key Vault.
- [ ] npm publish permissions are limited to trusted maintainers.
- [ ] Production backend deployment uses `infra/azure/deploy-registry-vm.sh`.
