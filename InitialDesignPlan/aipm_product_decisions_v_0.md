# AIPM Product Decisions — v0 Working Notes

## Product Direction

AIPM is an AI package and environment manager for organizations.

Its purpose is to streamline AI usage, configuration, and distribution inside teams and companies. If one person creates or improves an AI capability that works well and aligns with the organization, they should be able to share it easily with others.

AIPM should make AI environments reproducible in the same way package managers make code dependencies reproducible.

When someone clones a repository or opens a project folder, they should be able to install the AI environment required for that project.

AIPM is not limited to coding. It should also support non-coding AI environments such as finance, legal, operations, research, HR, sales, support, and internal business workflows.

---

## Core Product Definition

AIPM is a CLI tool that installs and manages AI-related packages.

It can install:

- AI skills
- AI instructions
- AI context packs
- MCP servers
- memory/context configuration
- policies
- workflows
- tool-specific configurations
- future AI infrastructure components

AIPM itself does not become the AI runtime. It configures and distributes AI infrastructure across tools.

The actual execution remains with tools such as Cursor, Claude, OpenAI, Continue, Cline, Aider, MCP runtimes, or future AI tools.

---

## Installation Behavior

AIPM installs AI packages into the correct locations for the user's AI tools.

For example:

- Cursor-compatible files go into `.cursor/`
- Claude-compatible files go into `.claude/`
- Other tool-specific files go into their respective folders

If a package supports multiple tools, AIPM can install the same package into multiple tool-specific formats at once.

Example:

```bash
aipm install @org/frontend-ai-env
```

This could install:

```txt
.cursor/
.claude/
.aipm/
```

with the required files generated for each supported AI tool.

---

## API Token Usage

AIPM can work without an AI model when packages can be installed directly from package content and adapters.

If installation requires model-based conversion, interpretation, migration, or compatibility generation, AIPM may accept an AI model API token.

Example use cases where an AI model may be needed:

- converting a generic AI package into a tool-specific format
- generating a compatible instruction version
- validating instruction quality
- detecting conflicts
- suggesting package migration fixes

But model usage should be optional, not required for basic installation.

---

## Scopes

AIPM should support at least two install scopes initially:

### Global Scope

Installed once and available broadly to the user across projects.

Example:

```bash
aipm install -g @org/company-base-ai-env
```

### Folder / Project Scope

Installed inside a specific folder or repository.

Example:

```bash
aipm install @org/project-ai-env
```

This creates project-level AI configuration inside the current folder.

A project-level package should override or extend global packages when needed.

---

## Enterprise / Private Registry Direction

Enterprises should be able to host their own private AI packages, skills, context, and AI infrastructure.

AIPM should support private spaces that require authentication tokens.

Example:

```bash
aipm login --registry https://company.aipm.dev
```

Then teammates can install approved internal packages:

```bash
aipm install @company/security-review-env
```

Private enterprise packages may include:

- internal coding standards
- architecture context
- compliance policies
- finance analysis workflows
- domain-specific AI instructions
- MCP configuration
- internal knowledge connectors

---

## Open Source Direction

AIPM should be open source.

The CLI, core package format, adapters, and public specification should remain open.

This is important because the product must be independent of any single AI model, vendor, or coding assistant.

---

## Tool-Agnostic Philosophy

AIPM should be independent of any specific AI model or AI tool.

It should provide a common package format that can be converted into different tool-specific formats.

Example:

One package can support:

- Cursor
- Claude
- OpenAI Custom GPTs
- Continue
- Cline
- Aider
- future tools

AIPM's job is to read the package configuration and install the right files for each target tool.

---

## AI-Agent-Friendly Direction

AIPM should be usable by AI agents.

An AI agent should be able to install required skills, MCP servers, context packs, or AI infrastructure using AIPM.

AIPM may eventually expose an MCP server so AI agents can interact with it directly.

Example future usage:

```txt
Agent detects missing capability → calls AIPM MCP → installs required package → continues task
```

---

## Security Responsibility

AIPM is responsible for helping users know whether a package is safe, trustworthy, and suitable to install.

AIPM should not become a full runtime observability product.

Its security responsibilities may include:

- package verification
- signed packages
- publisher trust
- package audit
- malware/prompt-injection scanning
- suspicious instruction detection
- dependency checks
- private registry auth
- install permissions
- warning users before dangerous package behavior

AIPM is responsible for package delivery and package safety validation, not ongoing business analytics or productivity tracking.

---

## Observability Decision

AIPM should not own organization-level AI productivity observability as a core responsibility.

It does not need to provide:

- productivity impact dashboards
- detailed AI usage analytics
- token usage tracking across every tool
- team performance monitoring
- workflow success analytics

AIPM may still provide basic package-level health signals such as:

- package is deprecated
- package has known security issue
- package has compatibility issue
- package has newer version
- package has failed audit

---

## Initial Target Users

The first target users should be:

- engineering organizations
- AI-native startups
- Cursor-heavy teams
- Claude Code users
- teams trying to standardize AI usage
- companies that want reproducible AI environments

The first positioning should focus on:

```txt
Clone repo → install AI environment → same AI behavior for everyone
```

---

## Core Product Promise

AIPM should make this possible:

```bash
git clone company/project
cd project
aipm install
```

After this, the user gets the right AI setup for the project:

- skills
- instructions
- context
- MCP config
- memory config
- policies
- workflows
- tool-specific folders

---

## v0 Package Manifest Decisions

AIPM v0 will support only three AI package categories:

- skills
- rules
- MCP servers/configurations

The package file name will be:

```txt
aipm.package.json
```

This file is the project-level declaration of required AI packages.

---

## v0 Manifest Shape — Draft

AIPM package declarations should support two formats:

1. Simple version string format
2. Expanded object format

Use the simple format when the package can be installed across all allowed/resolved tools and does not need package-level overrides.

Use the expanded object format only when the package needs custom tool restrictions, permissions, required environment variables, or other package-specific settings.

Example:

```json
{
  "schemaVersion": "0.1",
  "appName": "frontend-dashboard",
  "description": "AI environment for frontend dashboard project",
  "version": "1.0.0",
  "targets": "*",
  "restrictTargets": [],
  "registries": ["https://registry.aipm.dev"],
  "skills": {
    "@company/react-reviewer": "^1.2.0"
  },
  "rules": {
    "@company/frontend-rules": "^2.0.0",
    "@company/cursor-only-rules": {
      "version": "^1.0.0",
      "tools": ["cursor"],
      "permissions": []
    }
  },
  "mcp": {
    "@company/jira-mcp": {
      "version": "^1.0.0",
      "tools": ["cursor", "claude"],
      "permissions": ["jira.read"],
      "requiredEnv": ["JIRA_API_TOKEN"]
    }
  },
  "config": {
    "installMode": "normal",
    "writeStrategy": "namespaced",
    "allowPrerelease": false
  }
}
```

---

## Manifest Field Responsibility

`aipm.package.json` represents the desired AI environment.

It should stay lightweight and easy to read.

Security/trust metadata should not be stored in this file.

Security/trust metadata belongs in:

- registry metadata
- package metadata
- lockfile

---

## Target Semantics

The `targets` key defines where AIPM should install packages.

Possible values:

```json
"targets": "*"
```

This means AIPM should auto-detect available AI tools and install compatible package outputs accordingly.

Or:

```json
"targets": ["cursor", "claude", "openai", "continue"]
```

This means AIPM should install only for the listed tools, if supported.

A separate restriction key can limit installation to specific tools even if packages support more tools.

Example:

```json
"restrictTargets": ["cursor", "claude"]
```

---

## Package Naming Convention

AIPM package names should follow npm-style naming conventions.

Examples:

```txt
@company/react-reviewer
@company/frontend-rules
@company/jira-mcp
@public/security-code-review
```

This keeps naming familiar and supports public/private scoping.

---

## Package Category Format

Each category uses package names as keys.

Example:

```json
"skills": {
  "@company/react-reviewer": {
    "version": "^1.2.0",
    "tools": ["cursor", "claude"],
    "permissions": []
  }
}
```

Each package entry can contain:

- `version` — semver range
- `tools` — optional tool-specific installation filter
- `permissions` — only required if the package needs additional permissions beyond default AI tool behavior

---

## Security and Trust Decision

Detailed security and trust metadata does not need to live in the local `aipm.package.json` file for v0.

Security metadata can live in the registry/website/package index instead.

Examples:

- publisher verification
- package signature
- audit status
- security warnings
- package quality score
- content hash
- registry trust status

The local manifest should stay lightweight.

---

## Context Budget Decision

Context budget metadata is not required in the local `aipm.package.json` file for v0.

It can be shown on the website or package registry page instead.

---

## Lockfile Requirement

AIPM needs an elaborated lockfile.

The lockfile should store exact resolved installation data, including:

- exact package version
- resolved source URL
- registry source
- package hash
- compatible tool outputs
- generated/installed files
- target tool versions, if known
- dependencies
- permissions resolved during install
- MCP server install details
- prompt/rule/skill content hash
- installation timestamp

The lockfile should make the AI environment reproducible for every teammate.

Suggested file name:

```txt
aipm-lock.json
```

---

## Dependency and Conflict Resolution — v0 Decisions

For v0, AIPM should support deterministic dependency resolution and basic conflict detection.

The goal is reliability and reproducibility, not intelligent AI-based conflict solving.

---

## Dependency Support

Packages can depend on other packages.

Example:

```json
{
  "dependencies": {
    "@company/frontend-rules": "^2.0.0"
  }
}
```

Dependencies should be resolved using semver-style versioning.

Supported version syntax:

```txt
^1.2.0
~1.2.0
1.2.3
latest
```

AIPM should resolve versions and store exact installed versions inside:

```txt
aipm-lock.json
```

---

## Conflict Types For v0

### Same Package Version Conflict

Example:

```txt
Project wants @company/frontend-rules@2.x
Dependency wants @company/frontend-rules@1.x
```

Behavior:

- resolve latest compatible version if possible
- fail if incompatible
- do not silently install wrong versions

---

### Same Output File Conflict

Two packages attempting to write to the same tool file location.

Behavior:

- avoid this by using namespaced install folders
- never overwrite unrelated user files

Suggested install pattern:

```txt
.cursor/aipm/
.claude/aipm/
```

---

### Same MCP Server Name Conflict

Example:

Two packages both installing:

```txt
jira
```

Behavior:

- fail unless package/version matches exactly
- do not attempt automatic merge

---

### Tool Compatibility Conflict

Example:

Package supports Claude only, but project targets Cursor.

Behavior:

- skip with warning by default
- future versions may allow strict mode

---

### Permission Conflict

If package requests permissions not allowed locally or by organization policy:

Behavior:

- block install unless approved

---

## Conflict Resolution Philosophy

For v0:

```txt
detect → explain → fail/warn → let user decide
```

AIPM should not use AI to automatically solve conflicts in v0.

---

## Project vs Global Precedence

Project packages override global packages.

Priority:

```txt
project > global
```

---

## Lockfile Behavior

If `aipm-lock.json` exists:

```bash
aipm install
```

should restore exact package versions and exact package state.

The lockfile becomes the reproducibility source of truth.

---

## Dependency Fields Planned For v0

```json
{
  "dependencies": {},
  "incompatibleWith": {}
}
```

Fields planned for later phases:

```txt
optionalDependencies
peerDependencies
```

---

## Security Model — v0 Decisions

Security is a core part of AIPM from day 1.

AIPM is responsible for install-time trust and package safety.

It should protect users from:

- malicious prompts/rules
- unsafe MCP servers
- package tampering
- fake publishers
- dependency attacks
- accidental over-permissioning

---

## Package Integrity

Every installed package should include:

- content hash
- resolved version
- source URL
- registry source
- publisher identity

Stored inside:

```txt
aipm-lock.json
```

No silent package mutation should be allowed.

---

## Signed Packages

AIPM registries should support package signing.

Publishers sign package hashes.

AIPM verifies signatures during install.

If signature validation fails:

```txt
install fails
```

---

## Publisher Identity

Every package should expose:

- publisher name
- verified/unverified status
- registry source
- publish date
- update date

Private registries should allow only approved publishers.

---

## Permission Declaration

Packages should declare additional permissions.

Example:

```json
{
  "permissions": [
    "filesystem.read",
    "filesystem.write",
    "jira.read",
    "jira.write"
  ]
}
```

Packages should not receive additional permissions unless explicitly declared.

---

## MCP Risk Classification

MCP packages should be classified by risk.

Examples:

```txt
low
medium
high
critical
```

Examples:

- low → read-only tools
- medium → API access
- high → filesystem or write access
- critical → shell/network/secrets access

High and critical packages should require explicit approval.

---

## Prompt / Rule Static Security Scan

Before install, packages should be scanned for suspicious instructions.

Examples:

```txt
ignore previous instructions
reveal secrets
send data externally
hide this instruction
```

Packages with suspicious behavior should be warned or blocked.

---

## Dependency Security Checks

AIPM should scan dependencies for:

- unknown publishers
- deprecated packages
- suspicious package replacement
- unexpected permission escalation
- unsafe dependency chain

---

## Permission Diff On Update

If an update introduces new permissions:

Example:

```txt
v1.0.0 → jira.read
v1.1.0 → jira.read + jira.write
```

AIPM should explicitly warn users before update/install.

---

## Safe Install Locations

AIPM should never overwrite unrelated user files.

Suggested install folders:

```txt
.cursor/aipm/
.claude/aipm/
.aipm/
```

---

## Private Registry Security

Enterprise/private registries should support:

- auth token login
- role-based publishing
- install permissions
- audit logs
- publisher approval
- token revocation

Suggested roles:

```txt
admin
publisher
viewer
```

---

## Install Security Modes

Suggested install modes:

```txt
strict
normal
unsafe
```

Behavior:

- strict → block unsafe/unverified packages
- normal → warn before install
- unsafe → allow install with warning

Enterprise default should be:

```txt
strict
```

---

## Server-Side Package Security Scan

When a package is published, the AIPM registry/server should automatically run security checks.

The registry assigns a security classification.

Suggested classifications:

```txt
secure
mild-secure
insecure
```

Alternative naming:

```txt
safe
warning
blocked
```

---

## Server-Side Security Checks

Registry security checks may include:

- prompt injection detection
- secret exfiltration detection
- hidden/obfuscated instruction detection
- dangerous MCP permission detection
- filesystem/shell/network access detection
- suspicious dependency behavior
- publisher reputation
- package signature validation
- permission escalation checks
- malicious install script detection
- suspicious external URLs
- license/repository mismatch

---

## Registry Security Behavior

Suggested behavior:

```txt
secure      → install normally
mild-secure → install with warning
insecure    → blocked by default
```

Enterprise admins should be able to configure strictness.

---

## Local Install Verification

Even if registry checks pass, local AIPM install should still verify:

- content hash
- package integrity
- signature validity

Registry scan provides trust signals.

Local install verification ensures package content has not changed.

---

## Lockfile Design — v0 Decisions

The lockfile is one of the core foundations of AIPM.

The purpose of the lockfile is to make AI environments:

- reproducible
- verifiable
- secure
- deterministic

The lockfile should answer:

```txt
Can another teammate recreate the exact same AI environment safely?
```

Suggested file name:

```txt
aipm-lock.json
```

---

## Lockfile Responsibilities

The lockfile should manage:

```txt
1. exact package resolution
2. exact installed content
3. exact target-tool output
4. exact security/trust verification
```

---

## Lockfile Metadata

Example:

```json
{
  "lockfileVersion": 1,
  "generatedBy": "aipm@0.1.0",
  "createdAt": "2026-05-11T10:00:00Z"
}
```

This tracks:

- lockfile schema version
- AIPM version used to generate it
- generation timestamp

---

## Project Identity

Example:

```json
{
  "project": {
    "appName": "frontend-dashboard",
    "packageFile": "aipm.package.json"
  }
}
```

This allows validation and environment consistency.

---

## Target Tool Resolution

Example:

```json
{
  "targets": {
    "requested": "*",
    "resolved": ["cursor", "claude"]
  }
}
```

If wildcard auto-detection is used, the lockfile stores the exact resolved tools.

---

## Exact Package Resolution

Example:

```json
{
  "packages": {
    "@company/react-reviewer": {
      "type": "skill",
      "requested": "^1.2.0",
      "resolved": "1.2.7"
    }
  }
}
```

This stores:

- package type
- requested semver range
- exact resolved version

---

## Package Source Tracking

Example:

```json
{
  "source": {
    "registry": "https://registry.aipm.dev",
    "resolvedUrl": "https://registry.aipm.dev/@company/react-reviewer/-/1.2.7.tgz"
  }
}
```

This makes installs traceable and reproducible.

---

## Integrity Hash

Example:

```json
{
  "integrity": {
    "algorithm": "sha256",
    "hash": "sha256:abc123"
  }
}
```

This prevents package tampering.

---

## Publisher & Signature

Example:

```json
{
  "publisher": {
    "name": "company",
    "verified": true
  },
  "signature": {
    "keyId": "company-key-1",
    "value": "..."
  }
}
```

This stores trust and verification information.

---

## Security Status

Example:

```json
{
  "security": {
    "status": "secure",
    "scannedAt": "2026-05-11T09:00:00Z",
    "riskLevel": "low"
  }
}
```

This comes from registry/server-side package scanning.

---

## Permission Tracking

Example:

```json
{
  "permissions": ["jira.read"]
}
```

Permissions are stored for:

- reproducibility
- permission diffing
- security review

---

## Dependency Tracking

Example:

```json
{
  "dependencies": {
    "@company/frontend-rules": "2.1.0"
  }
}
```

This stores exact resolved dependency versions.

---

## Installed Target Outputs

The lockfile should track exactly what AIPM generated and installed.

Example:

```json
{
  "installedTargets": {
    "cursor": {
      "files": [
        {
          "path": ".cursor/aipm/react-reviewer.md",
          "hash": "sha256:filehash"
        }
      ]
    },
    "claude": {
      "files": [
        {
          "path": ".claude/aipm/react-reviewer/SKILL.md",
          "hash": "sha256:filehash"
        }
      ]
    }
  }
}
```

This allows AIPM to:

- verify generated files
- detect tampering
- clean unused files
- reproduce exact installations

---

## MCP Installation Details

For MCP packages:

Example:

```json
{
  "mcp": {
    "serverName": "jira",
    "transport": "stdio",
    "command": "node",
    "args": ["server.js"],
    "envRequired": ["JIRA_API_TOKEN"],
    "riskLevel": "medium"
  }
}
```

The lockfile should never store actual secrets.

Only required environment variable names.

---

## Sensitive Data Rules

The lockfile must never store:

- API keys
- auth tokens
- passwords
- private secrets
- raw sensitive organization data

Allowed:

```txt
JIRA_API_TOKEN required
```

Not allowed:

```txt
JIRA_API_TOKEN=actual-token
```

---

## Lockfile Behavioral Rules

### aipm install

If `aipm-lock.json` exists:

- install exact versions from lockfile
- verify hashes
- verify signatures
- recreate exact installed files

---

### aipm update

Behavior:

- resolve new versions
- show permission/security diff
- update lockfile

---

### aipm verify

Behavior:

- check installed files against lockfile
- detect tampering
- detect manual modification

---

### aipm clean

Behavior:

- remove files previously installed by AIPM but no longer present in lockfile

---

## Lockfile Philosophy

The lockfile should be treated as:

```txt
AI environment fingerprint
```

It is not only package version pinning.

It stores:

- exact package state
- exact trust state
- exact generated file state
- exact installed target state

This is one of the core foundations of reproducible AI environments.

---

## Tool Compatibility & Adapter Architecture — v0 Decisions

AIPM should include built-in default adapters for supported AI tools.

Users should not need to manually think about tool-specific formats.

Example:

```bash
aipm install
```

AIPM handles conversion into:

- Cursor-compatible output
- Claude-compatible output
- MCP configuration
- future tool outputs

---

## Core Adapter Philosophy

AIPM should not tightly couple packages to one AI tool.

Architecture:

```txt
AIPM package
      ↓
AIPM internal normalized model
      ↓
Official built-in adapter
      ↓
Tool-specific generated output
```

This keeps AIPM stable even if AI tools change their internal formats.

---

## Adapter Purpose

An adapter answers:

```txt
How should this package type be installed for this AI tool?
```

Examples:

```txt
skill + cursor → .cursor/aipm/skills/
rule + cursor  → .cursor/aipm/rules/
skill + claude → .claude/aipm/skills/
mcp + cursor  → update Cursor MCP config
mcp + claude  → update Claude MCP config
```

---

## v0 Supported Adapters

For v0, support only:

```txt
cursor
claude
```

Potential future adapters:

```txt
openai
continue
cline
aider
vscode
```

Reason:

Cursor + Claude are enough to validate the architecture.

---

## v0 Adapter Types

AIPM v0 requires three adapter categories:

### Skill Adapter

Converts AIPM skill packages into tool-native instruction/skill files.

---

### Rule Adapter

Converts AIPM rules into tool-native project-level AI rules.

---

### MCP Adapter

Installs MCP server configuration for the target AI tool.

---

## Internal Adapter Registry

AIPM should internally know which tools support which package types.

Example:

```json
{
  "cursor": {
    "supports": ["skills", "rules", "mcp"],
    "paths": {
      "rules": ".cursor/aipm/rules/",
      "skills": ".cursor/aipm/skills/"
    }
  },
  "claude": {
    "supports": ["skills", "mcp"],
    "paths": {
      "skills": ".claude/aipm/skills/"
    }
  }
}
```

This configuration should live inside AIPM itself.

Not inside user packages.

---

## Tool Compatibility Matrix

Each tool should expose compatibility metadata.

Example:

```json
{
  "tool": "cursor",
  "versions": ">=1.0.0",
  "supports": {
    "skills": true,
    "rules": true,
    "mcp": true
  }
}
```

AIPM should validate:

- package compatibility
- tool compatibility
- supported package types
- target support

---

## Install Strategy

AIPM should install only into namespaced folders.

Examples:

```txt
.cursor/aipm/
.claude/aipm/
```

AIPM should avoid modifying unrelated user-managed files directly.

---

## Aggregator Files

Some tools may require a generated aggregator file.

Example:

```txt
.cursor/rules/aipm-generated.md
```

This file can reference or aggregate all AIPM-generated outputs.

Generated files should clearly indicate:

```txt
Generated by AIPM. Do not edit manually.
```

---

## Adapter Output Tracking

All generated files should be tracked inside:

```txt
aipm-lock.json
```

Example:

```json
{
  "installedTargets": {
    "cursor": {
      "adapterVersion": "cursor-adapter@0.1.0",
      "files": [
        {
          "path": ".cursor/aipm/rules/frontend.md",
          "hash": "sha256:abc"
        }
      ]
    }
  }
}
```

This enables:

- verification
- cleanup
- reproducibility
- tamper detection

---

## Adapter Versioning

Adapters must be versioned.

Examples:

```txt
cursor-adapter@0.1.0
claude-adapter@0.1.0
```

The lockfile should store adapter versions.

This protects reproducibility if adapter output changes in future releases.

---

## Tool Detection

If:

```json
"targets": "*"
```

AIPM should auto-detect available AI tools.

Detection methods may include:

- `.cursor/`
- `.claude/`
- installed CLI tools
- local configuration
- user configuration

After resolution, exact detected tools should be stored inside the lockfile.

Example:

```json
{
  "targets": {
    "requested": "*",
    "resolved": ["cursor", "claude"]
  }
}
```

---

## Installation Modes

Suggested install modes:

```txt
auto
targeted
dry-run
verify
```

Examples:

```bash
aipm install --target cursor
aipm install --target claude
aipm install --dry-run
aipm verify
```

---

## Adapter Failure Rules

Suggested behavior:

```txt
unsupported package type → warn/skip
unsupported tool → warn/skip
unsafe MCP config → block
unknown target → error
```

MCP-related failures should be treated more strictly.

---

## v0 Adapter Restrictions

For v0:

```txt
Only official built-in adapters
```

Do not support:

```txt
custom adapters
community adapters
adapter plugins
```

These may be introduced in later versions.

---

## v0 Adapter Architecture Summary

```txt
AIPM package
   ↓
normalize package
   ↓
resolve target tools
   ↓
run official built-in adapter
   ↓
write namespaced files
   ↓
record outputs in lockfile
```

---

## Current Unresolved Areas

## Resolved Areas

The following foundational areas are now considered structurally finalized for AIPM v0:

1. `aipm.package.json` overall direction and manifest philosophy
2. `aipm-lock.json` architecture and reproducibility philosophy
3. Dependency and conflict resolution strategy
4. Security model and package trust architecture
5. Tool compatibility and adapter architecture
6. Folder/project/global precedence model
7. v0 scope boundaries
8. Built-in adapter philosophy
9. Install folder strategy
10. Lockfile verification behavior
11. Package permission declaration model
12. Server-side package security scanning
13. Package integrity and signature verification
14. MCP risk classification approach
15. Deterministic install philosophy for v0

---

## Remaining Major Unresolved Areas

The following major systems still require deeper design before implementation:

1. Exact final `aipm.package.json` schema details
2. Exact final `aipm-lock.json` schema details
3. Private registry architecture and publish flow
4. Package publishing lifecycle
5. Exact published package folder structure
6. CLI command architecture and execution lifecycle
7. MCP configuration synchronization and lifecycle handling
8. Monorepo and multi-project handling
9. AI-assisted operations vs deterministic operations boundaries
10. Future activation rules and scoped package activation
11. Registry scaling and hosting architecture
12. Package update/removal lifecycle behavior

