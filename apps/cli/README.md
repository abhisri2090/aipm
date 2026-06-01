# AIPM CLI

AIPM installs project-ready AI skills into supported tools such as Cursor and
Claude.

## Install

```bash
npm install -g @aipm-registry/cli
```

## Use

Initialize a project:

```bash
aipm init
```

Install a skill from the public registry:

```bash
aipm add @team/sample-skill@0.0.1780307807
```

List installed skills:

```bash
aipm list
```

Publishing is currently approval-only:

```bash
AIPM_TOKEN=<admin-token> aipm publish ./my-skill --registry https://aipm-registry.com
```

The default registry is `https://aipm-registry.com`. Use `--registry <url>` or
`AIPM_REGISTRY=<url>` for local or private registries.
