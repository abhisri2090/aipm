# AIPM CLI

AIPM installs project-ready AI skills into supported tools such as Cursor and
Claude.

## Install

```bash
npm install -g @aipm-registry/cli
aipm --version
aipm doctor
aipm config
```

## Use

Initialize a project:

```bash
aipm init
```

Install a skill from the public registry:

```bash
aipm add @scope/name@1.0.0 --target cursor --ci
```

List installed skills:

```bash
aipm list
```

Search the registry:

```bash
aipm search sentry
```

Update installed skills:

```bash
aipm update
```

This package is bundled. Installing `@aipm-registry/cli` gives you the `aipm`
command without needing to install any other AIPM npm packages manually.

Publishing is currently approval-only:

```bash
aipm publish init --name @team/review-helper
aipm publish explain
aipm publish add .
aipm publish status
aipm publish preview
aipm publish validate
aipm publish token --package @team/review-helper
AIPM_TOKEN=<5-minute-token> aipm publish push --yes
```

Use `.aipmignore` to exclude local-only files from publishing. AIPM also
rejects common private key, env, Azure connection string, publish profile, and
large package mistakes before upload.

Helpful publishing commands:

```bash
aipm publish open --docs
aipm publish open --package @team/review-helper
aipm doctor --publish
```

The default registry API is `https://api.aipm-registry.com`. Use `--registry <url>`,
`AIPM_REGISTRY_URL=<url>`, or `AIPM_REGISTRY=<url>` for local or private
registries.
