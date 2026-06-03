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

Search results include package version, supported targets, description,
publisher identity when available, license, and package size.

Update installed skills:

```bash
aipm update
```

This package is bundled. Installing `@aipm-registry/cli` gives you the `aipm`
command without needing to install any other AIPM npm packages manually.

Publish a public skill:

```bash
aipm publish init --name @team/review-helper --template code-review
cd review-helper
aipm publish explain # (optional)
aipm publish add .
aipm publish status # (optional)
aipm publish preview # (optional)
aipm publish validate # (optional)
aipm publish token --package @team/review-helper # (optional)
AIPM_TOKEN=<5-minute-token> aipm publish push --yes
```

Create an account on `https://aipm-registry.com`, create an org, reserve the
package name, and generate the 5-minute token from the package dashboard.

Use `.aipmignore` to exclude local-only files from publishing. AIPM also
rejects common private key, env, Azure connection string, publish profile, and
large package mistakes before upload.

Helpful publishing commands:

```bash
aipm publish init --name @team/issue-summary --template issue-summary
aipm publish init --name @team/release-notes --template release-notes
aipm publish open --docs # (optional)
aipm publish open --package @team/review-helper # (optional)
aipm doctor --publish # (optional)
```

Starter templates are `blank`, `code-review`, `issue-summary`, and
`release-notes`. They only change the starter `SKILL.md`; you can edit every
file before staging and publishing.

If your AI tool already generated a skill or rule file, import it into an AIPM package folder:

```bash
aipm publish import ~/.codex/skills/review-helper --name @team/review-helper
cd review-helper
aipm publish add .
aipm publish preview # (optional)
```

The default registry API is `https://api.aipm-registry.com`. Use `--registry <url>`,
`AIPM_REGISTRY_URL=<url>`, or `AIPM_REGISTRY=<url>` for local or private
registries.
