# AIPM Security Policy

AIPM publishes public AI skill packages, prompts, rules, and tool files. Treat every published package like open-source code: anyone may inspect the manifest, metadata, entry file, and bundled files.

## Supported Versions

The active development branch is `main`. Security fixes should target `main` first and then be included in the next release of the CLI, registry API, and web app.

## Reporting a Vulnerability

Do not publish exploit details, leaked credentials, or private package contents in a public issue.

Until a dedicated disclosure channel is configured, report sensitive security issues through a private GitHub security advisory for this repository if available. If that is unavailable, contact the maintainer privately and include:

- affected package, route, command, or component
- steps to reproduce
- impact and likely affected users
- whether any secret, token, customer data, or private project file was exposed
- suggested mitigation if you already know one

For non-sensitive hardening work, open a normal pull request.

## Public Package Safety

Before publishing an AIPM package:

- run `aipm publish preview`
- inspect every included file
- keep API keys, tokens, private keys, customer data, internal documents, and private project notes out of public packages
- use `.aipmignore` for logs, local caches, build output, screenshots, exports, and internal-only folders
- generate a fresh short-lived publish token for each publishing session
- rotate any exposed secret immediately, even if the publish failed

Recommended `.aipmignore` starter:

```gitignore
# Secrets and credentials
.env
.env.*
*.pem
*key*

# Private or noisy project files
node_modules/
.git/
dist/
coverage/
*.log
screenshots/
exports/

# Internal-only context
private-notes/
customer-data/
```

## Security Checks For Contributors

Before opening a pull request that changes publishing, auth, package storage, install behavior, or the public website, run the relevant checks:

```sh
pnpm build
pnpm test
pnpm lint
pnpm scan:secrets
pnpm --filter @aipm-registry/web verify:local
```

`pnpm scan:secrets` checks tracked and untracked non-ignored files for common
private keys, publish profiles, storage keys, SAS signatures, service tokens,
and live database URLs. It allows documented placeholders and local development
examples, but treat any finding as a blocker until it is removed or rotated.

## Current Product Limits

- Public packages are not private storage.
- Publish tokens are short-lived and should not be stored by the CLI or committed to projects.
- Private package support, package takedown workflow, stronger package scanning, verified publishers, and a formal disclosure channel are planned product hardening items.

See the public guide at https://aipm-registry.com/security.
