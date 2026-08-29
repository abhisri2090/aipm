# AIPM Published Package Structure — v0

## Purpose

This defines the structure of an actual AIPM package that gets published and installed.

Example package:

```txt
@company/react-reviewer
```

---

# Package Manifest File

Every published package must contain:

```txt
aipm.manifest.json
```

This file describes the package itself.

Do not confuse it with:

```txt
aipm.package.json
```

`aipm.package.json` is used inside projects to declare required packages.

---

# Recommended v0 Package Structure

```txt
package/
├── aipm.manifest.json
├── README.md
├── skill.md
├── rule.md
├── mcp.json
├── targets/
│   ├── cursor.md
│   └── claude.md
└── assets/
```

Not every package needs every file.

---

# Supported v0 Package Types

```txt
skill
rule
mcp
environment
```

---

# Skill Package

```txt
react-reviewer/
├── aipm.manifest.json
└── skill.md
```

Manifest:

```json
{
  "schemaVersion": "0.1",
  "name": "@company/react-reviewer",
  "version": "1.0.0",
  "type": "skill",
  "description": "Reviews React code using company frontend standards",
  "entry": "skill.md",
  "targets": ["cursor", "claude"],
  "permissions": [],
  "dependencies": {},
  "incompatibleWith": {},
  "license": "MIT"
}
```

---

# Rule Package

```txt
frontend-rules/
├── aipm.manifest.json
└── rule.md
```

Manifest:

```json
{
  "schemaVersion": "0.1",
  "name": "@company/frontend-rules",
  "version": "2.0.0",
  "type": "rule",
  "description": "Company frontend coding rules",
  "entry": "rule.md",
  "targets": ["cursor"],
  "permissions": [],
  "dependencies": {},
  "incompatibleWith": {},
  "license": "MIT"
}
```

---

# MCP Package

```txt
jira-mcp/
├── aipm.manifest.json
└── mcp.json
```

Manifest:

```json
{
  "schemaVersion": "0.1",
  "name": "@company/jira-mcp",
  "version": "1.0.0",
  "type": "mcp",
  "description": "Jira MCP server configuration",
  "entry": "mcp.json",
  "targets": ["cursor", "claude"],
  "permissions": ["jira.read"],
  "requiredEnv": ["JIRA_API_TOKEN"],
  "dependencies": {},
  "incompatibleWith": {},
  "license": "MIT"
}
```

`mcp.json` example:

```json
{
  "serverName": "jira",
  "transport": "stdio",
  "command": "node",
  "args": ["./server.js"],
  "envRequired": ["JIRA_API_TOKEN"]
}
```

Never store actual secrets.

---

# Environment Package

Used to bundle multiple packages together.

```txt
frontend-env/
└── aipm.manifest.json
```

Manifest:

```json
{
  "schemaVersion": "0.1",
  "name": "@company/frontend-env",
  "version": "1.0.0",
  "type": "environment",
  "description": "Complete frontend AI environment for company projects",
  "targets": ["cursor", "claude"],
  "dependencies": {
    "@company/react-reviewer": "^1.0.0",
    "@company/frontend-rules": "^2.0.0",
    "@company/jira-mcp": "^1.0.0"
  },
  "incompatibleWith": {},
  "license": "MIT"
}
```

---

# Tool-Specific Overrides

Optional folder:

```txt
targets/
├── cursor.md
└── claude.md
```

Rule:

```txt
If target override exists → use target-specific file
Else → use generic entry file
```

Example:

```txt
skill.md            → generic skill
targets/cursor.md   → Cursor-specific override
targets/claude.md   → Claude-specific override
```

This keeps normal packages simple but allows tool-specific behavior when needed.

---

# Assets Folder

Optional:

```txt
assets/
```

Used for reference files, examples, screenshots, templates, or supporting content.

For v0, assets should be copied/read-only only.

No executable behavior from assets.

---

# Important v0 Security Rule

Do not allow arbitrary install scripts.

Do not support:

```txt
preinstall
postinstall
shell scripts
custom execution hooks
```

Reason:

```txt
AIPM packages should be declarative in v0.
```

AIPM should install files/configs. It should not execute arbitrary package code.

---

# Final v0 Decision

Use:

```txt
aipm.manifest.json
```

as the required published package manifest.

Use these v0 package types:

```txt
skill
rule
mcp
environment
```

Use generic entry files:

```txt
skill.md
rule.md
mcp.json
```

Use optional target overrides:

```txt
targets/cursor.md
targets/claude.md
```

Keep packages declarative, secure, simple, and easy to scan.

---

# Public Registry Architecture and Publish Flow — v0

## Public Registry Purpose

The public AIPM registry should index, verify, scan, and distribute public AIPM packages.

It should behave like a lightweight package registry plus security trust layer.

Core principle:

```txt
The registry stores immutable package versions, verifies publisher identity, runs security checks, and gives users trust signals before installation.
```

---

## What The Public Registry Stores

The public registry should store:

- package metadata
- package versions
- publisher identity
- package tarballs
- security scan results
- content hash
- signature metadata
- download/install stats
- deprecation status
- blocked/flagged status

---

## Public Registry Components

### Registry API

Handles:

- publish
- search
- package info
- version resolution
- metadata fetch
- security status fetch
- deprecation info

Example endpoints:

```txt
GET /packages/@company/react-reviewer
GET /packages/@company/react-reviewer/versions/1.0.0
POST /publish
```

---

### Package Storage

Stores immutable package tarballs.

Example:

```txt
@company/react-reviewer@1.0.0.tgz
```

Recommended storage:

```txt
Object storage + CDN
```

Examples:

- S3
- Cloudflare R2
- Google Cloud Storage

---

### Metadata Database

Stores searchable package metadata:

- package name
- version
- description
- publisher
- dependencies
- targets
- type
- permissions
- required environment variables
- security status
- created date
- updated date
- download count

---

### Security Scanner

Runs after package upload/publish.

Checks may include:

- manifest validity
- prompt injection patterns
- secret exfiltration instructions
- hidden/obfuscated instructions
- dangerous MCP permissions
- filesystem/shell/network access
- suspicious external URLs
- dependency risk
- license/repository mismatch
- signature validity

Outputs a package security status:

```txt
secure
warning
blocked
```

---

### Public Web UI

The AIPM website should show:

- package details
- versions
- security status
- permissions
- MCP risk level
- dependencies
- publisher identity
- install command
- README
- deprecation warnings

The package page should make risk obvious.

---

## Public Package Identity

Use npm-style scoped package names:

```txt
@scope/name
```

Examples:

```txt
@aipm/react-reviewer
@company/frontend-rules
@abhishek/linkedin-post-skill
```

Rules:

- scope is owned by a user or organization
- package name must be unique within the scope
- package version is immutable once published

---

## Publisher Account and Login Token Flow

A person must have an account on the AIPM website before publishing packages.

Publishing should not be anonymous.

The publishing flow should be:

```txt
1. User creates/logs into account on AIPM website
2. User creates or joins a scope/org
3. User receives package-level or scope-level publishing/admin rights
4. User generates a login token from the website
5. User runs aipm login locally using that token
6. CLI stores the token securely
7. User can publish/manage only packages they are authorized for
```

Example:

```bash
aipm login --token <token>
```

or:

```bash
aipm login
```

Then the CLI can prompt the user to paste the token generated from the website.

---

## Publishing Permissions

To publish or manage a package, the user must:

- be logged in through AIPM CLI
- have a valid token generated from the AIPM website
- own the package scope, or have publishing rights for that scope/package
- publish a version that does not already exist
- pass package validation checks

Supported permission levels:

```txt
owner
admin
publisher
viewer
```

Suggested behavior:

- owner → full control over scope/packages
- admin → manage publishers and package settings
- publisher → publish new versions
- viewer → view package/admin metadata but cannot publish

---

## Public Publish Command

Command:

```bash
aipm publish
```

Publish flow:

```txt
1. Read aipm.manifest.json
2. Validate package structure
3. Validate package name/version/type
4. Check user login token
5. Check publisher has rights for package scope
6. Run local preflight scan
7. Create package tarball
8. Generate content hash
9. Sign package hash if signing is configured
10. Upload tarball + metadata
11. Server verifies token and publishing rights
12. Server verifies manifest and package integrity
13. Server stores immutable tarball
14. Server runs security scan
15. Registry assigns security status
16. Package becomes searchable/installable according to security result
```

---

## Publish State Machine

Package versions should move through states:

```txt
draft/local
uploaded
scanning
published
flagged
blocked
deprecated
```

Suggested behavior:

```txt
uploaded  → package received
scanning  → security scan running
published → installable normally
flagged   → installable with warning
blocked   → blocked by default
deprecated → installable with deprecation warning unless blocked
```

---

## Immutability Rule

Once published:

```txt
@scope/name@1.0.0 cannot be changed
```

No overwrite.

No republish of the same version.

If the author wants to change package content, they must publish a new version.

Example:

```txt
1.0.0 → 1.0.1
```

This is required for lockfile integrity and reproducibility.

---

## Package Signing

For v0, signing should be designed into the system from day 1.

Recommended behavior:

```txt
publisher signs package hash
server verifies signature
lockfile stores signature reference
```

If signing is not implemented in the earliest prototype, the system should still store:

- server-side content hash
- publisher identity
- immutable version
- registry source

---

## Security Status

Use clear security statuses:

```txt
secure
warning
blocked
```

Meaning:

```txt
secure  → passed checks
warning → suspicious/risky but installable with warning
blocked → unsafe and blocked by default
```

---

## Version Resolution

The registry should support:

```txt
latest
^1.2.0
~1.2.0
1.2.3
```

When AIPM installs a package, registry returns resolved metadata:

```json
{
  "name": "@company/react-reviewer",
  "requested": "^1.2.0",
  "resolved": "1.2.7",
  "tarball": "https://...",
  "integrity": "sha256:...",
  "securityStatus": "secure"
}
```

---

## Deprecation

Authors should be able to deprecate versions.

Example:

```bash
aipm deprecate @scope/pkg@1.0.0 "Use 1.1.0"
```

Registry should store:

- deprecated status
- reason
- replacement package/version, if available

Deprecated packages can still install unless security-blocked.

---

## Blocking

Registry admins or security systems can block packages for:

- malicious prompt behavior
- secret exfiltration behavior
- dangerous MCP configuration
- fake package / impersonation
- legal issue
- security issue

Blocked package behavior:

```txt
normal install → blocked
unsafe install → only allowed if local/user/org config permits
```

For the public registry, default behavior should block unsafe packages.

---

## Search

Search should support:

- name
- description
- package type
- target tool
- tags
- publisher
- security status

Useful filters:

```txt
type:skill
type:rule
type:mcp
target:cursor
target:claude
security:secure
```

---

## Minimal Public Registry v0 Architecture

Recommended v0 stack:

```txt
API server
metadata database
object storage for tarballs
CDN for downloads
security scanner worker
web UI
auth system
```

---

## Publish Validation Rules

Before accepting a package, validate:

- `aipm.manifest.json` exists
- package name follows npm-style convention
- version is valid semver
- type is one of skill/rule/mcp/environment
- entry file exists when required
- targets are supported
- permissions are declared
- requiredEnv contains only variable names, not secret values
- dependencies are valid
- no install scripts exist
- package size is under limit
- no forbidden files exist

---

## Local Preflight

Before upload, CLI should run local checks.

Commands:

```bash
aipm scan
aipm pack
aipm publish
```

`aipm publish` should automatically run scan and pack internally.

This catches obvious problems before server upload.

---

## Public Registry Trust Levels

Suggested v0 publisher trust levels:

```txt
unverified
verified
```

Future levels may include:

```txt
trusted
official
```

---

## Anti-Abuse Measures

The public registry should support:

- reserved scopes
- package name squatting prevention
- rate limits
- malware/security reporting
- package takedown flow
- blocked package list
- publisher suspension

---

## Final Public Registry v0 Flow

```txt
Author creates package
        ↓
Author logs into AIPM website
        ↓
Author generates login token
        ↓
Author runs aipm login locally
        ↓
CLI verifies token
        ↓
Author runs aipm publish
        ↓
CLI validates package
        ↓
CLI runs local scan
        ↓
CLI creates tarball
        ↓
CLI uploads package + metadata
        ↓
Server validates token and scope rights
        ↓
Server stores immutable tarball
        ↓
Server computes integrity hash
        ↓
Server runs security scan
        ↓
Registry marks package secure/warning/blocked
        ↓
Package becomes searchable/installable according to status
```

---

## Final v0 Registry Decision

For public v0:

- publishing requires an AIPM website account
- publishing requires a login token generated from the website
- package actions are controlled by package/scope-level rights
- registry stores immutable package versions
- packages are published as tarballs
- every publish is validated and scanned
- every package gets a security status
- every install receives integrity hash and security metadata
- no version overwrite is allowed
- no arbitrary install scripts are allowed
- public registry starts simple but security-first

---

# AIPM CLI Architecture — v0

## Core Philosophy

The AIPM CLI should be deterministic, predictable, and safe.

Core principle:

```txt
AIPM CLI should install, verify, update, remove, scan, pack, and publish AI packages safely.
```

For v0, the CLI should avoid unnecessary AI-driven behavior.

---

# v0 CLI Commands

Essential commands:

```bash
aipm init
aipm install
aipm add <package>
aipm remove <package>
aipm update
aipm list
aipm verify
aipm clean
aipm login
aipm logout
aipm whoami
aipm scan
aipm pack
aipm publish
```

---

## aipm init

Creates:

```txt
aipm.package.json
```

Suggested flow:

```txt
ask appName
detect supported AI tools
create aipm.package.json
```

Tool detection examples:

```txt
.cursor/
.claude/
```

---

## aipm install

Primary command used after cloning a repository.

Suggested lifecycle:

```txt
read aipm.package.json
read aipm-lock.json if present
resolve packages
verify registry/security metadata
download packages
verify hashes/signatures
run adapters
write namespaced files
update lockfile
```

If `aipm-lock.json` exists:

```txt
install exact locked versions
```

---

## aipm add <package>

Adds package dependency into `aipm.package.json`.

Example:

```bash
aipm add @company/react-reviewer
```

Suggested lifecycle:

```txt
resolve latest version
add package to correct section
install package
update lockfile
```

Suggested flags:

```bash
--type skill
--type rule
--type mcp
--target cursor
```

---

## aipm remove <package>

Removes package and generated outputs.

Suggested lifecycle:

```txt
remove package from aipm.package.json
remove generated files
update lockfile
run cleanup
```

AIPM should never remove unrelated user-created files.

---

## aipm update

Updates installed packages using semver rules.

Suggested lifecycle:

```txt
compare installed vs latest compatible
show version changes
show permission/security diffs
request approval if needed
install updates
update lockfile
```

Rules:

- new permissions require explicit approval
- security downgrade should trigger warning/block

---

## aipm list

Displays installed packages grouped by category.

Example output:

```txt
skills
- @company/react-reviewer@1.2.7

rules
- @company/frontend-rules@2.0.1

mcp
- @company/jira-mcp@1.0.0
```

---

## aipm verify

Verifies install integrity.

Checks:

- lockfile hashes
- generated file hashes
- package integrity
- signature validity
- missing generated files
- manual modification/tampering

Useful for CI and enterprise verification.

---

## aipm clean

Removes stale AIPM-generated files.

Only removes:

- files tracked in lockfile
- files clearly marked/generated by AIPM

---

## aipm login

Authentication should use a token generated from the AIPM website.

Suggested lifecycle:

```txt
user logs into website
user generates token
user runs aipm login
CLI stores token securely
```

Examples:

```bash
aipm login
aipm login --token <token>
```

---

## aipm logout

Removes stored auth token and local session.

---

## aipm whoami

Displays currently authenticated user and available scopes.

---

## aipm publish

Publishes current package to registry.

Suggested lifecycle:

```txt
validate aipm.manifest.json
run local security scan
create tarball
verify login token
upload package
server validates publishing rights
server runs security scan
package receives secure/warning/blocked status
```

---

## aipm scan

Runs local package security scan.

Checks may include:

- prompt injection patterns
- secret-like strings
- unsafe MCP config
- forbidden files
- invalid manifest
- missing permissions

---

## aipm pack

Creates package tarball locally without publishing.

Useful for:

- local testing
- CI pipelines
- offline validation

---

# Install Failure Handling

If install fails midway:

```txt
rollback generated files
do not update lockfile
show failure reason
```

If only some targets fail:

Example:

```txt
Cursor install succeeded
Claude install failed
```

Recommended v0 behavior:

```txt
fail entire install unless --partial is used
```

---

# Deterministic v0 Rule

For v0:

```txt
install/update/remove/verify/publish should not require AI models
```

AI-assisted operations may be introduced later.

Security scanning should initially remain deterministic/rules-based.

---

# Final v0 CLI Decision

Build these commands first:

```txt
init
install
add
remove
update
list
verify
clean
login
logout
whoami
scan
pack
publish
```

The CLI should remain:

- deterministic
- reproducible
- security-first
- predictable
- easy to debug

---

# Install / Update / Remove Lifecycle — v0

## Core Philosophy

The install engine is the operational core of AIPM.

AIPM modifies:

```txt
.cursor/
.claude/
.aipm/
aipm-lock.json
```

So installs must be:

- deterministic
- reversible
- auditable
- lockfile-driven
- transactional

Core principle:

```txt
Either the entire install succeeds or the system rolls back safely.
```

---

# Internal Lifecycle Model

Recommended internal flow:

```txt
plan
validate
prepare
apply
verify
commit
cleanup
```

This should be the internal install engine model.

---

# aipm install Lifecycle

Suggested lifecycle:

```txt
1. read aipm.package.json
2. read existing aipm-lock.json if present
3. detect target tools
4. resolve packages and dependencies
5. validate security status
6. download package tarballs
7. verify hash/signature
8. unpack into temporary cache
9. run built-in adapters
10. generate outputs in temporary location
11. check conflicts
12. write final generated files
13. write/update aipm-lock.json
14. cleanup temporary files
```

Critical rule:

```txt
Lockfile should update only after successful install.
```

---

# aipm update Lifecycle

Suggested lifecycle:

```txt
1. read aipm.package.json
2. read aipm-lock.json
3. resolve latest compatible versions
4. compare old vs new versions
5. show version/security/permission diffs
6. request approval if required
7. download packages
8. verify hash/signature
9. regenerate outputs
10. replace generated files
11. update lockfile
12. cleanup stale outputs
```

Critical rules:

```txt
new permission → explicit approval
security downgrade → warning/block
```

---

# aipm remove Lifecycle

Suggested lifecycle:

```txt
1. read aipm.package.json
2. read aipm-lock.json
3. remove package from manifest
4. identify installed/generated files from lockfile
5. remove only AIPM-owned/generated files
6. remove unused dependencies if no longer needed
7. update lockfile
8. cleanup empty generated folders
```

Critical rule:

```txt
Never remove files not tracked by AIPM.
```

---

# AIPM-Owned Files

AIPM should only manage files inside:

```txt
.cursor/aipm/
.claude/aipm/
.aipm/
```

Generated aggregator files should contain:

```txt
Generated by AIPM. Do not edit manually.
```

---

# Rollback Behavior

Before modifying files:

```txt
create install transaction snapshot
```

If install/update/remove fails:

```txt
restore previous generated files
restore previous lockfile
remove temporary files
show failure reason
```

---

# Partial Failure Rule

Recommended v0 behavior:

```txt
fail entire install/update/remove operation
```

Example:

```txt
Cursor install succeeded
Claude install failed
```

AIPM should rollback Cursor changes too.

Possible future support:

```bash
aipm install --partial
```

---

# Dependency Handling

Dependency install order:

```txt
install dependencies first
then install dependent package
```

If dependency conflict exists:

```txt
fail before writing any generated files
```

---

# Stale File Cleanup

If older generated outputs are no longer needed:

```txt
aipm update
```

should remove stale generated files tracked in the lockfile.

---

# Dry Run Mode

Support:

```bash
aipm install --dry-run
```

Should show:

- packages to install
- files to create/update/remove
- permissions requested
- target tools affected
- security status

No files should be written.

---

# Install Plan File

Before applying changes, AIPM should internally generate an install plan.

Suggested temporary file:

```txt
.aipm/tmp/install-plan.json
```

Benefits:

- easier rollback
- debugging
- install auditing
- reproducibility checks

---

# Package Cache Strategy

Downloaded packages should be cached locally.

Suggested cache location:

```txt
~/.aipm/cache/
```

Benefits:

- faster reinstall
- offline reinstall from lockfile
- fewer registry calls

---

# CI Mode

Support:

```bash
aipm install --ci
```

Recommended behavior:

- no interactive prompts
- fail on warnings
- require lockfile
- verify exact package state

Important for enterprise CI/CD systems.

---

# Manual Modification Detection

If generated files are manually edited:

```txt
aipm verify
```

should detect hash mismatch.

Suggested install/update behavior:

- overwrite generated files
- or warn before overwrite

Generated files should remain machine-managed.

---

# Dependency Pruning

When removing a package:

```txt
remove unused dependencies only if no remaining package depends on them
```

Behavior should resemble dependency graph pruning.

---

# Lockfile Conflict Handling

If `aipm-lock.json` contains invalid/conflicting state:

```txt
aipm install
```

should:

- detect conflict/corruption
- fail safely
- suggest repair/reinstall flow

---

# Repair Command

Suggested command:

```bash
aipm repair
```

Purpose:

```txt
recreate generated files from lockfile state
```

This differs from install because it restores generated outputs without changing package resolution.

