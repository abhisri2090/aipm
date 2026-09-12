---
name: prompt-critique
description: Critique and iteratively improve an LLM prompt against a clarity/constraints/examples/failure-mode rubric, producing a revised prompt and a rationale for each change.
---

# Prompt Critique

Use this skill when the user has a prompt (system prompt, reusable template, or one-off instruction) and wants it made more reliable — not just "better written," but less likely to produce the wrong output on real inputs.

## Rubric

Evaluate the prompt against each dimension. For each, note Strong / Weak / Missing and why:

1. **Task clarity** — is the actual task stated as an instruction, not just implied by context or examples?
2. **Constraints** — are output format, length, tone, and scope boundaries stated explicitly, or left for the model to guess?
3. **Examples** — if the task is ambiguous without one, is there a worked example? Does the example actually match the stated constraints (a common failure: the example contradicts the instructions)?
4. **Failure modes** — does the prompt anticipate the ways a model commonly gets this wrong (e.g. answering when it should say "I don't know," inventing facts, ignoring one of several instructions when the list is long) and guard against them?
5. **Ambiguity under variation** — would this prompt behave consistently across a range of realistic inputs, or does it only work for the one example the user has in mind?

## Workflow

1. Ask for or infer real example inputs the prompt needs to handle — a critique against one hypothetical case is weak; test against 2-3 realistic variations, including an edge case.
2. Score each rubric dimension against the prompt as written.
3. For each weakness, propose a specific, minimal edit — not a full rewrite unless the prompt is fundamentally unclear about its task.
4. Produce the revised prompt in full, then a change log mapping each edit back to the rubric dimension it addresses.
5. If the prompt is for a specific tool/model with known quirks (e.g. strict JSON mode, a small context window, a particular refusal pattern), account for that instead of giving generic advice.

## Output Format

```markdown
## Rubric scores
- Task clarity: <Strong/Weak/Missing> — <why>
- Constraints: <Strong/Weak/Missing> — <why>
- Examples: <Strong/Weak/Missing> — <why>
- Failure modes: <Strong/Weak/Missing> — <why>
- Ambiguity under variation: <Strong/Weak/Missing> — <why>

## Revised prompt
<full revised prompt, ready to paste>

## Change log
- <edit> — addresses <rubric dimension> — <what failure this prevents>
```

## Quality Bar

- Every proposed edit must name the concrete failure it prevents ("without this, the model will X on input Y"), not a vague improvement claim.
- Do not add instructions the user's use case doesn't need — a longer prompt is not automatically a better one; unnecessary constraints add places for the model to fail.
- If the original prompt's examples contradict its stated rules, flag that as the highest-priority fix — models tend to follow examples over rules when the two conflict.
- Preserve the user's intended voice/persona for the prompt's output; don't neutralize a deliberately stylized prompt into generic phrasing.
