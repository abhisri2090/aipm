# Database Migrations

This folder contains SQL migrations for the AIPM registry database.

## Running Migrations

Migrations are not automatically applied. They must be reviewed and run manually against the production database by an authorized operator.

### Prerequisites

1. Access to the production PostgreSQL database
2. Appropriate permissions to execute UPDATE statements
3. A backup of the prompts table before running

### How to Run

1. Connect to the production database
2. Review the migration script and the preview queries
3. Run the preview query to see affected rows
4. Execute the migration in a transaction
5. Verify the results before committing

## Migrations

### 001_remove_seed_keyword_focus.sql

**Purpose:** Remove "Seed keyword focus: <keyword>" lines from prompt content.

**Target:** Table `prompts`, column `prompt_text` (schema defined in `apps/registry-api/src/prompt-routes.ts:ensurePromptSchema`)

**Background:** Generated prompts included a "Seed keyword focus" line that should not be visible to users. This line was part of the prompt generation metadata but was mistakenly included in the stored prompt content.

**Scope:** Affects prompts that contain the pattern "Seed keyword focus:" in the `prompt_text` column (approximately 680 prompts).

**Verification:**
1. Run the preview query first to count affected rows
2. After the update, verify no prompts contain the pattern
3. Spot-check a few prompts to ensure other content is preserved

**Idempotent:** Yes - running multiple times is safe.

**Reversibility:** No automatic rollback. Restore from backup if needed.
