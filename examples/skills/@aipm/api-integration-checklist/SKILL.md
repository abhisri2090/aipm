---
name: api-integration-checklist
description: Walk through a structured checklist covering auth, error handling, retries, rate limits, secrets, and tests before shipping a new third-party API integration.
---

# API Integration Checklist

Use this skill when the user is adding, or has just written, code that calls a third-party/external API, and wants to make sure it's production-ready rather than just "works on the happy path."

## Workflow

1. Identify the integration: which API, which endpoints, sync or async, and what triggers the call (user action, background job, webhook).
2. Walk the checklist below against the actual code — don't just ask the user if they've handled something, read the implementation.
3. For each unchecked item, give a specific fix, not a generic reminder (e.g. "the retry loop on line 42 retries on 4xx errors too — it should only retry on 5xx/429/network errors" not "make sure retries are correct").
4. Prioritize findings: things that will cause data loss, duplicate side effects, or silent failures rank above style/robustness nits.

## Checklist

**Auth & secrets**
- Credentials come from environment/secret storage, never hardcoded or logged.
- Token refresh/expiry is handled, if the API uses short-lived tokens.

**Error handling**
- Non-2xx responses are checked explicitly, not assumed absent because the call didn't throw.
- Error responses are parsed for a machine-readable code/message where the API provides one, not just surfaced as raw text.
- Failures are distinguished by type: client error (4xx, don't retry), rate limit (429, backoff), server error (5xx, retry with backoff), network/timeout (retry with backoff).

**Retries & idempotency**
- Retries use backoff (not a tight loop) and a retry cap.
- Retries on non-idempotent calls (POST that creates a resource) either use an idempotency key the API supports, or are avoided — a retried create-call can duplicate side effects.

**Rate limits**
- The integration respects documented rate limits or a `Retry-After` header, rather than hitting a wall under load and failing unpredictably.

**Timeouts**
- Every call has an explicit timeout; nothing can hang indefinitely on a slow or dead upstream.

**Secrets hygiene**
- Request/response logging never includes tokens, API keys, or full request bodies containing user data.

**Tests**
- At least one test covers a non-2xx/error response path, not only the happy path.
- If retries or backoff are implemented, a test verifies they actually stop at the cap.

## Output Format

```markdown
## Integration: <name/endpoint>

### Blocking issues
- <issue> — <specific fix, referencing the actual code>

### Should fix before merge
- <issue> — <specific fix>

### Notes / already handled
- <item> — confirmed present in code at <location>
```

## Quality Bar

- Every finding must reference the actual code (line, function, or file), not a generic checklist reminder disconnected from what's in front of you.
- Distinguish "will cause an incident" from "good practice but not urgent" — don't flatten severity.
- If the API's own docs specify a rate limit, retry, or idempotency mechanism, cite what it actually requires rather than giving generic HTTP advice.
