-- Migration: Remove "Seed keyword focus" line from prompt_text
-- 
-- Target: Table `prompts`, column `prompt_text`
-- Schema: apps/registry-api/src/prompt-routes.ts:ensurePromptSchema
--
-- This line was added during prompt generation but should be removed.
-- The line appears as: "Seed keyword focus: <keyword>"
-- It should be removed from the prompt_text field without altering other content.
--
-- IMPORTANT: Run this in a transaction and verify results before committing.
-- This is idempotent - running it multiple times will not cause issues.

BEGIN;

-- Preview affected prompts (run this first to verify)
-- SELECT id, slug, 
--        regexp_match(prompt_text, 'Seed keyword focus:[^\n]*\n?', 'i') as match
-- FROM prompts 
-- WHERE prompt_text ~* 'Seed keyword focus:';

-- Remove the "Seed keyword focus" line from prompt_text
-- This matches: "Seed keyword focus: anything" followed by optional newline
UPDATE prompts
SET prompt_text = regexp_replace(
    prompt_text,
    E'(^|\\n)Seed keyword focus:[^\\n]*\\n?',
    E'\\1',
    'gi'
),
updated_at = NOW()
WHERE prompt_text ~* 'Seed keyword focus:';

-- Verify the update (check count and sample)
-- SELECT COUNT(*) as affected FROM prompts WHERE updated_at = (SELECT MAX(updated_at) FROM prompts);

COMMIT;
