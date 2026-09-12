---
name: pr-description-writer
description: Turn a code diff, ticket, and test notes into a clear, reviewer-ready pull request description with summary, rationale, risk, and test plan.
---

# PR Description Writer

Use this skill when the user has a diff, staged changes, or a branch ready for review and needs a pull request description a reviewer can act on without re-reading the whole diff.

## Inputs to Gather

Before writing, confirm you have (ask only for what's missing and can't be inferred):

1. The diff or list of changed files (`git diff`, `git diff main...HEAD`, or a pasted diff).
2. The originating ticket/issue, if any, and what problem it describes.
3. Whether this is a fix, feature, refactor, or chore — infer from the diff if not stated.
4. How it was tested (commands run, manual steps, screenshots) — ask if not evident from the diff.
5. Any deliberate scope exclusions ("not fixing X in this PR") the author wants called out.

Do not invent testing steps, metrics, or reviewer instructions that weren't provided or evidenced in the diff.

## Workflow

1. Read the diff file-by-file. Group changes by intent (e.g. "core fix", "test updates", "docs"), not by file order.
2. Identify the *why*, not just the *what* — the description should explain the problem being solved, since the diff already shows the mechanics.
3. Flag anything risky: behavior changes on hot paths, schema/migration changes, removed error handling, new external calls, or anything that changes default behavior.
4. Draft using the Output Template below. Keep prose tight — reviewers skim.
5. If the diff includes unrelated changes (formatting drift, unrelated file touches), call them out explicitly so the reviewer doesn't have to guess if they're intentional.

## Output Template

```markdown
## Summary
<1-3 bullets: what changed and why, in plain language>

## Changes
<grouped by intent, not by file — e.g. "Core fix", "Tests", "Docs">

## Test plan
<commands run / manual steps taken / what a reviewer should verify>

## Risk notes
<omit this section entirely if there is nothing risky — do not pad it>
```

## Quality Bar

- The summary must be understandable by someone who has not read the diff.
- Every claim in "Test plan" must map to something actually run or observed — never fabricate coverage.
- Risk notes should name the specific failure mode ("if X is null, Y throws"), not generic hedges ("this could have edge cases").
- Prefer short declarative sentences over hedged, passive-voice summaries.

## What to Avoid

- Do not restate the diff line-by-line — that's what "Files changed" is for.
- Do not add a "Checklist" of generic boilerplate (linted, tested, reviewed) unless the repo's own PR template requires it.
- Do not claim a fix "resolves" an issue if the diff only partially addresses it — say so explicitly.
