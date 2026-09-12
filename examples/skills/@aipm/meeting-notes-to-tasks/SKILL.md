---
name: meeting-notes-to-tasks
description: Convert raw meeting notes or a transcript into structured, assignable action items and issue-ready descriptions.
---

# Meeting Notes to Tasks

Use this skill when the user pastes meeting notes, a call transcript, or a rough set of bullets and wants concrete, assignable follow-up items instead of a summary.

## Workflow

1. Read the full notes/transcript before extracting anything — decisions and commitments are often stated once, in passing, and referenced again later without repeating the detail.
2. Separate three categories, don't blend them:
   - **Decisions made** — things the group agreed on, stated as fact, not as a task.
   - **Action items** — someone specifically committed to doing something, or a clear next step was assigned even implicitly ("someone should look at X").
   - **Open questions** — things raised but not resolved, that need an owner just to get answered.
3. For each action item, extract or infer: owner, the concrete deliverable (not just a topic), and any stated deadline. If the owner or deadline is genuinely unstated, mark it `unassigned` / `no deadline` rather than guessing a name or date.
4. Write each action item so it could be pasted directly into an issue tracker: a title stating the outcome, not the topic ("Fix login redirect loop on Safari" not "Discuss login bug"), and a one-line description with enough context that someone who wasn't on the call understands what's being asked.
5. Do not include small talk, tangents, or restated agenda items as action items.

## Output Format

```markdown
## Decisions
- <decision, stated as fact>

## Action items
- [ ] **<outcome-stated title>** — owner: <name or "unassigned"> — due: <date or "none stated">
  <one-line description with enough context to act without re-reading the notes>

## Open questions
- <question> — owner: <name or "unassigned">
```

## Quality Bar

- Every action item title must describe an outcome, not a topic.
- Never assign an owner or deadline that wasn't stated or clearly implied — "unassigned" is more useful than a wrong guess.
- If the notes contain a decision that contradicts an earlier one in the same document, flag the conflict instead of silently picking one.
- Keep descriptions to one line unless the item genuinely needs more context to be actionable by someone who missed the meeting.

## What to Avoid

- Do not produce a generic "summary of the meeting" — that's a different task from action extraction.
- Do not merge multiple distinct action items into one bullet because they're related; a reviewer needs to check each one off independently.
