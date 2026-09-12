---
name: readme-audit
description: Audit a project README against open-source best practices and produce a prioritized gap list plus rewritten sections.
---

# README Audit

Use this skill when the user wants to know whether their README is good enough for public/OSS use, or wants it rewritten to close specific gaps.

## Workflow

1. Read the current README in full, plus (if available) the repo's actual install/run/test commands from `package.json`, `Makefile`, CI config, or equivalent — the README must match reality, not just read well.
2. Score the README against the Checklist below. For each item, mark Present / Partial / Missing.
3. Produce a prioritized gap list: correctness issues first (README says something false or outdated), then missing-essentials, then polish.
4. Rewrite only the sections needed to close the highest-priority gaps, unless the user asks for a full rewrite. Preserve the project's existing voice and structure where it's already working.
5. Never invent project details (license, install steps, badges, contact info) that you can't verify from the repo — flag them as "needs input from maintainer" instead of guessing.

## Checklist

- **What it is**: one or two sentences, above the fold, answering "what does this do and for whom" — not just a tagline.
- **Install**: exact commands that work from a clean checkout, including prerequisites (runtime version, external services).
- **Quick start / usage**: the smallest example that produces visible output, before any advanced configuration.
- **Status/stability signal**: badges (build, version, license) or prose stating maturity, if relevant to adoption decisions.
- **Configuration**: where to find full config options, not necessarily inlined.
- **Contributing**: link to `CONTRIBUTING.md` or inline expectations, if the project accepts contributions.
- **License**: stated clearly, matching the actual `LICENSE` file.
- **Support/contact**: where to file issues or ask questions.
- **Accuracy**: every command and code sample in the README should actually run against the current codebase.

## Output Format

```markdown
## README Audit

### Score
<Present/Partial/Missing per checklist item, one line each>

### Priority gaps
1. <correctness issues — README claims something false/outdated>
2. <missing essentials — blocks a new user from succeeding>
3. <polish — nice to have, not blocking>

### Rewritten sections
<only the sections needed to close priority-1 and priority-2 gaps>
```

## Quality Bar

- Flag stale content explicitly (e.g. "install command references a script that no longer exists in `package.json`") rather than silently rewriting around it.
- Keep rewritten sections in the project's existing tone — don't impose a generic template that erases what made the original README distinctive.
- Do not add marketing language, unearned superlatives, or badges for services the project doesn't actually use.
