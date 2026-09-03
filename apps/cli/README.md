# Search the registry at [aipm-registry.com](https://www.aipm-registry.com) for a skill


# AIPM CLI

**An Open source command-line tool for AI skills management and discovery [AIPM](https://www.aipm-registry.com)**

## What is this?

AI coding tools like Cursor and Claude can follow **skills**: small instruction files that teach the assistant how to do a job (code review, release notes, issue summaries, and more).

AIPM makes skills easy to **find, install, and share** — like npm, but for AI skills.

This package gives you the `aipm` command. With it you can:

- **Browse and install** skills from the public registry at **[aipm-registry.com](https://www.aipm-registry.com)**
- **Add skills to your project** so your whole team uses the same instructions
- **Publish your own skills** so others can install them

No other AIPM packages are required — everything is bundled in one install.

**Supported tools today:** Cursor and Claude (more targets at [aipm-registry.com/targets](https://www.aipm-registry.com/targets)).

## Install

```bash
npm install -g @aipm-registry/cli
aipm --version
aipm doctor
```

`aipm doctor` checks that your setup is ready. Run it if something does not work.

## Install skills in your project

Start in any project folder:

```bash
aipm init --target cursor
```

*Search the registry at [aipm-registry.com](https://www.aipm-registry.com) for a skill:*

```bash
aipm search sentry
```

Results show version, supported tools, description, publisher, license, and size.

For private organization packages, sign in once from the CLI:

```bash
aipm login
aipm whoami
```

After login, `aipm add`, `aipm install`, `aipm update`, and `aipm search` automatically use your account access. Use `--token` or `AIPM_TOKEN` only for CI or bot installs.

Install a skill:

```bash
aipm add @scope/name@1.0.0 --target cursor
```

Some packages include temporary helper files and a manual AI setup prompt. After install, AIPM
prints the prompt path. You can show it again and clean helper files after setup:

```bash
aipm show-prompt @scope/name
aipm cleanup @scope/name
```

See what is installed:

```bash
aipm list
```

Update installed skills:

```bash
aipm update
```

Browse more packages on the website: **[aipm-registry.com](https://www.aipm-registry.com)**

## Publish your skill (public / private / organization-only)

Share a skill with your team or the public registry.

1. Create a free account at **[aipm-registry.com](https://www.aipm-registry.com)**
2. Create an org and reserve your package name (for example `@team/review-helper`)
3. Scaffold a new skill package:

```bash
aipm publish init --name @team/review-helper --template code-review
cd review-helper
```

1. Add your files and push:

```bash
aipm publish add .
aipm publish preview    # optional — see what will be uploaded
aipm publish validate   # optional — check for problems
AIPM_TOKEN=<5-minute-token> aipm publish push --yes
```

Get the short-lived publish token from your package page on **[aipm-registry.com/dashboard](https://www.aipm-registry.com/dashboard)**.

**Starter templates:** `blank`, `code-review`, `issue-summary`, `release-notes`. They only set the initial `SKILL.md` — edit any file before publishing.

**Already have a skill file?** Import it into an AIPM package:

```bash
aipm publish import ~/.codex/skills/review-helper --name @team/review-helper
cd review-helper
aipm publish add .
```

**Helpful extras:**

```bash
aipm publish explain              # what publishing does
aipm publish status               # staged files
aipm publish token --package @team/review-helper
aipm publish open --docs          # open publishing docs
aipm publish open --package @team/review-helper
aipm doctor --publish             # check publish setup
```

Use `.aipmignore` to skip local-only files. Before upload, AIPM blocks common mistakes such as private keys, `.env` files, and oversized packages.

Full publishing guide: **[aipm-registry.com/publish](https://www.aipm-registry.com/publish)**

## Configuration

```bash
aipm config
aipm logout
```

Default registry API: `https://api.aipm-registry.com`

For a local or private registry, use `--registry <url>`, or set `AIPM_REGISTRY_URL` / `AIPM_REGISTRY`.

## Links

- **Registry & browse skills:** [aipm-registry.com](https://www.aipm-registry.com)
- **Publishing guide:** [aipm-registry.com/publish](https://www.aipm-registry.com/publish)
- **Docs & examples:** [aipm-registry.com/examples](https://www.aipm-registry.com/examples)
- **Source code:** [github.com/abhisri2090/aipm](https://github.com/abhisri2090/aipm)
