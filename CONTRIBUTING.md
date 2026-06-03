# Contributing to AIPM

Thank you for your interest in contributing.

1. Fork [https://github.com/abhisri2090/aipm](https://github.com/abhisri2090/aipm)
2. Create a branch (`feat/my-change`)
3. Run `pnpm install && pnpm build && pnpm test && pnpm lint`
4. Open a pull request with a clear description

Package names must use `@scope/name`. See `InitialDesignPlan/aipm_mvp_skill_registry_plan_v0.md`.

If your change touches publishing, auth, package storage, install behavior, or public package docs, also read `SECURITY.md` and avoid committing secrets, tenant IDs, storage keys, connection strings, private keys, or publish profiles.
