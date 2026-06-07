# Contributing to AIPM

Thank you for your interest in contributing.

1. Fork [https://github.com/aipm-registry/aipm](https://github.com/aipm-registry/aipm)
2. Create a branch (`feat/my-change`)
3. Run `pnpm install && pnpm build && pnpm test && pnpm lint && pnpm scan:secrets`
4. Open a pull request with a clear description

Package names must use `@scope/name`. See `InitialDesignPlan/aipm_mvp_skill_registry_plan_v0.md`.

If your change touches publishing, auth, package storage, install behavior, or public package docs, also read `SECURITY.md` and avoid committing secrets, tenant IDs, storage keys, connection strings, private keys, or publish profiles. CI runs `pnpm scan:secrets`, but run it locally before pushing when you touch credentials, deployment, docs, or package publishing code.

## Development expectations

- Keep changes focused and describe user-facing behavior in the pull request.
- Add or update tests for CLI, registry API, schema, or install behavior changes.
- Update website/docs when commands, publish flow, or package behavior changes.
- Use placeholders in docs and examples; never paste real cloud/account secrets.
- Follow the [Code of Conduct](CODE_OF_CONDUCT.md).

## Good first contribution areas

- CLI usability and help text
- Additional skill templates and examples
- Adapter tests for supported AI tools
- Documentation clarity and SEO improvements
- Package validation and public package safety checks
