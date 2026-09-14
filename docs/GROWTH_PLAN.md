# AIPM Growth Plan

Updated: 14 September 2026

This plan focuses on useful adoption, not empty traffic. A good result is a person who finds a trusted skill, installs it, and returns or publishes one of their own.

## 1. Launch Channels Beyond LinkedIn

### AIPM team can prepare

- Keep one short description everywhere: "AIPM is a package manager and registry for reusable AI skills, prompts, rules, and tool files."
- Record a 60 to 90 second demo: search for a skill, inspect its source, copy the install command, install it, and run it.
- Prepare three screenshots: the skills directory, one detailed skill page, and the terminal after a successful install.
- Prepare one technical article using the new comparison and installation guides as the source.
- Use one launch URL with normal analytics. Do not add tracking parameters to canonical skill URLs.

### Founder must do

1. Finish and launch the Product Hunt page. Personal founder comments and replies should come from Abhishek.
2. Post a Show HN submission. Lead with the problem and working demo, not marketing language.
3. Publish a practical DEV Community or Hashnode article: "How I manage reusable Claude and Cursor skills like packages."
4. Share the demo in the Cursor Forum, OpenAI Developer Community, and relevant Claude or Agent Skills communities after reading each community's promotion rules.
5. Post a short X thread and a YouTube demo. Reuse the same real workflow, but write a platform-specific introduction.
6. Ask early users to share what they installed or published. Do not ask only for likes.

## 2. GitHub Growth Loop

The product already creates a version-specific "Install with AIPM" badge on every full skill page.

### Product loop

1. A publisher creates or claims a skill.
2. AIPM shows the README badge and Markdown on the package page.
3. The publisher adds the badge to the source repository README.
4. A GitHub reader opens the AIPM package page.
5. The reader checks the source and installs the exact version.
6. AIPM records the install and shows related skills from the same publisher or category.

### Next implementation steps

- [x] Add a "Copy README badge" event to analytics.
- [x] Show the badge immediately after a successful CLI publish.
- [x] Add a publisher profile page with all claimed packages.
- [x] Add related skills using publisher and category signals.
- [x] Prepare a small README badge pull-request template. Never open a PR without the publisher's permission.
- [x] Add GitHub topic recommendations to the publishing guide.

### Measures

- Package pages with a badge backlink
- Badge copies per week
- GitHub referral visits
- Install commands copied after a GitHub referral
- Publishers with two or more maintained skills

## 3. Trust Signals

### Verified publisher badge

Do not use one vague "Verified" label for every kind of trust.

Phase 1:

- "GitHub account connected": the publisher controls the linked GitHub account.
- "Organization owner": the account can publish in the reserved AIPM namespace.
- "Source linked": the package points to a public source repository.

Phase 2:

- "Domain verified": an approved work email matches the organization's domain.
- "Source repository verified": the publisher proves repository control with a file, GitHub App, or approved pull request.

The badge tooltip must explain exactly what was checked. Verification must never mean that AIPM guarantees the package is safe.

### Security scan status

Show "Automated checks passed" instead of "Safe".

First scan version:

- Reject archive path traversal, unsafe symlinks, oversized files, and unexpected binaries.
- Scan text for common secret formats and private keys.
- Validate the manifest and declared entry file.
- Record scan time, scanner version, and checks performed.
- Show warnings separately from blocking failures.
- Rescan when the scanner changes or a new package version is published.

Later:

- Add malware scanning for supported file types.
- Add dependency and script review if executable packages are ever allowed.
- Publish the scanning rules and limitations.
- Provide a report and appeal path for false positives.

### Last updated date

- On version pages, label the current date as "Version published" because versions do not change after publishing.
- On package lists, show "Latest version published" using the newest public version date.
- Show a separate "Source checked" date for imported GitHub skills.
- Never change sitemap `lastmod` unless the public page content or package version changed.

### Social copy: disclosure vs. hype (confirmed 2026-09-07, board sign-off on AIP-13)

- Default register is optimistic, forward-looking, and enthusiastic about what's actually shipped — a team excited about its own product, not one hedging or apologizing. Cut hedging language ("we think", "hopefully", "we're trying to") for direct, confident statements about what the product does today.
- When a constraint blocks the obvious execution path (e.g. no animation/video tool authorized), default to shipping the best available workaround (e.g. a written animation brief) rather than leading with the blocker. Still flag the constraint, but after delivering the workaround, not instead of it.
- This personality sits on top of, not instead of, the rules below: enthusiasm comes from confident framing of real product facts, not from inventing ones.
- Frame the security scan as a positive, concrete claim, not a hedge: "every package — this one included — goes through automated checks (path traversal, leaked secrets, oversized files, manifest validation) before it's live." Lead with this rather than a generic "we care about security" line.
- For skill/prompt-spotlight posts on imported/unverified/unclaimed packages: drop the boxed "Disclosure:" label and dry tone, but keep the unclaimed/unverified fact — fold it into a natural, hook-first sentence instead of hiding it.
- Do not state popularity/virality ("very popular", "used by many on social media") for a specific package without real data (install counts, a specific viral post, GitHub stars). If real numbers exist, use them — they're more persuasive than a vague claim anyway. Fabricating one is a specific, checkable claim that conflicts with the "verification never means AIPM guarantees safety" rule above and the copywriting skill's "honest over sensational" rule, and undercuts AIPM's trust-first pitch.
- LinkedIn voice: hook-first opener (contrarian claim or provocative question), short-long sentence rhythm, minimal-to-moderate emoji as section markers not decoration, action-specific CTAs ("Type /command", not "Learn more"). Reference styles: linkedin.com/in/ruben-hassid (bold hooks, numbered frameworks, emoji dividers) and linkedin.com/in/vedikabhaia (narrative arc, soft/no explicit CTA, minimal emoji).

## 4. Initial Publisher Outreach

Start with people whose public work is already relevant to Agent Skills. Ask them to review or claim listings; do not imply endorsement.

### First group

| Candidate | Why the fit is strong | Public contact starting point | Ask |
| --- | --- | --- | --- |
| Orchestra Research | A research skill is already imported into AIPM | https://github.com/Orchestra-Research/AI-Research-SKILLs | Review and claim the imported package; suggest missing research skills |
| Matt Pocock | Several public engineering and productivity skills are already imported | https://github.com/mattpocock/skills | Review the listings, claim ownership, and test the install flow |
| Murat Can Koylan | Maintains a focused context-engineering skill collection | https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering | Permit a small import test or publish one skill directly |
| Morgan Van Horn | Maintains a popular single-purpose research skill | https://github.com/mvanhorn/last30days-skill | Publish or claim the skill and add the README badge if useful |
| Philip Bankier | Maintains a relevant Agent Skills directory | https://github.com/philipbankier/awesome-agent-skills | Review AIPM's listing and give directory/discovery feedback |
| Addy Osmani | Maintains production engineering skills | https://github.com/addyosmani/agent-skills | Review AIPM's package model and try one representative skill |
| Jesse Vincent / obra | Maintains the Superpowers skill framework | https://github.com/obra/superpowers | Give compatibility feedback; consider one opt-in package listing |

### Later organization outreach

- Vercel Labs: https://github.com/vercel-labs/agent-skills
- Anthropic skills: https://github.com/anthropics/skills
- Microsoft Azure skills: https://github.com/microsoft/azure-skills

These organizations need a stronger launch, clear provenance controls, and evidence of real users before outreach.

### Founder message template

> Hi [name], I am building AIPM, an open registry and package-manager workflow for reusable Agent Skills. I found your public work on [skill/repo]. I would like your feedback on the package page and install flow: [URL]. If you are comfortable with it, you can claim or publish the skill under your own account. I will not imply that you endorse AIPM. Would you be open to a short review?

Send a personal message for each person. Mention one real skill and one reason it is useful. Do not send the same bulk message to everyone.

## 5. Backlink Plan

### Highest-value links

1. Publisher source READMEs using the version-specific AIPM badge.
2. Links from original skill repositories to claimed AIPM pages.
3. Technical tutorials that link to the exact guide and exact example package used.
4. Relevant curated GitHub lists and Agent Skills directories.
5. Product and alternative directories with a complete demo and screenshots.

### Existing or started placements to monitor

- AlternativeTo AIPM listing
- Product Hunt launch draft
- Libraries.io discovery
- DeepYard submission
- Awesome AI Coding Tools pull request
- Awesome Open AI Developer Tools pull request
- AI Coding Assistants Playbook pull request
- Awesome Agent Skills pull request
- QAInsights Awesome AI Tools issue

### New outreach targets

- Skills and AI-agent newsletters that accept tool submissions
- DEV Community and Hashnode articles with original examples
- Cursor Forum and developer community resource threads
- GitHub repository topics and Discussions posts where self-promotion is allowed
- Maintainer READMEs after the maintainer has reviewed and approved the AIPM listing
- Researchers studying Agent Skills who may use the open registry dataset
- DevPages and The Rundown Supertools, which currently accept tool submissions

### Rules

- Prefer one strong, relevant link over many unrelated directory links.
- Link to the page that answers the reader's question, not always the homepage.
- Do not buy links, exchange bulk links, or post repetitive comments.
- Track submitted, accepted, rejected, and live placements in one sheet.
- Recheck Search Console links monthly; new links can take weeks to appear.

## 6. Weekly Execution Order

Week 1:

- Finish the demo and Product Hunt assets.
- Contact Orchestra Research, Matt Pocock, and Murat Can Koylan.
- Publish one practical technical article.

Week 2:

- Launch Product Hunt and Show HN on different days.
- Contact Morgan Van Horn, Philip Bankier, and Addy Osmani.
- Ask claimed publishers to review the README badge.

Week 3:

- Publish the Claude/Cursor installation demo.
- Follow up once with people who showed interest.
- Submit only to relevant communities whose rules allow it.

Week 4:

- Review Search Console queries, referrals, installs, badge copies, and publisher claims.
- Improve pages that receive impressions but few clicks.
- Stop channels that create visits without installs or publisher interest.

## 7. Founder-Only Checklist

- [ ] Record and approve the demo video.
- [ ] Finish the Product Hunt launch and founder comment.
- [ ] Submit Show HN and personally answer comments.
- [ ] Publish the DEV/Hashnode article under your name.
- [ ] Contact the first six publisher candidates with personal messages.
- [ ] Ask permission before opening README badge pull requests.
- [ ] Follow community self-promotion rules before posting.
- [ ] Decide the legal and evidence requirements for each verification badge.
- [ ] Choose who reviews security-scan false positives and abuse reports.
- [ ] Maintain the backlink and outreach tracking sheet.

## 8. Grow the Skill Catalog to 10,000

### Goal and counting rule

Target 10,000 **distinct, searchable skill records**, not 10,000 automatically mirrored packages. Show a separate count for packages that have passed licensing, validation, and security checks and are installable from AIPM. Count a source skill by canonical GitHub repository and directory; do not inflate the total with forks, duplicate copies, or versions.

### Discovery sources and initial candidates

Use skills.sh's leaderboard as a demand signal and discovery feed, then resolve and fetch content from the canonical GitHub repository. The skills.sh public API requires Vercel OIDC authentication; do not build a crawler that evades its access controls or rate limits. Supplement it with GitHub repository discovery, publisher submissions, and opt-in publisher GitHub App installations. Verify current license and skill-directory counts before any batch import. The numbers below are **appearances among the first 600 skills.sh leaderboard entries observed on 3 September 2026**, not complete repository inventories.

| Source repository | Leaderboard appearances | License observed on 3 Sep | Candidate categories |
| --- | ---: | --- | --- |
| https://github.com/coreyhaines31/marketingskills | 61 | MIT | SEO, copywriting, content strategy |
| https://github.com/heygen-com/hyperframes | 38 | Apache-2.0 | Video, animation, captions |
| https://github.com/prime-skills/runcomfy-agent-skills | 30 | MIT | Image, video, music generation |
| https://github.com/larksuite/cli | 27 | MIT | Documents, sheets, calendar, messaging |
| https://github.com/pbakaus/impeccable | 22 | Apache-2.0 | UI critique and polish |
| https://github.com/googleworkspace/cli | 15 | Apache-2.0 | Gmail, Drive, Docs, Sheets |
| https://github.com/obra/superpowers | 14 | MIT | Debugging, planning, code review |
| https://github.com/firebase/agent-skills | 14 | Apache-2.0 | Auth, Firestore, hosting |
| https://github.com/cloudflare/skills | 10 | Apache-2.0 | Workers, Wrangler, performance |
| https://github.com/prisma/skills | 9 | MIT | Database setup and upgrades |
| https://github.com/expo/skills | 8 | MIT | React Native and deployment |
| https://github.com/google/agents-cli | 7 | Apache-2.0 | Agent scaffolding and evaluation |

Additional candidates to assess: https://github.com/mattpocock/skills, https://github.com/microsoft/azure-skills, https://github.com/anthropics/skills, https://github.com/remotion-dev/skills, https://github.com/firecrawl/cli, https://github.com/amd/skills, and https://github.com/JayRHa/AgentSkills. A missing or unclear GitHub SPDX result is **not** permission to redistribute; inspect the actual repository and directory licenses. Repository-level license observations are only screening signals and may not cover every file or subdirectory.

### Required ingestion architecture

1. **Discover without publishing.** Store source repository, directory, source type, discovery time, and any ranking signal in a candidate table. Deduplicate by canonical repository plus skill path, and flag identical content hashes and forks.
2. **Queue repository snapshots.** Resolve one default-branch commit SHA and download each repository archive once per commit. Recursively locate directories containing `SKILL.md`, including nested paths; do not treat every `README.md` as a skill. One repository can yield many candidates without repeated archive downloads.
3. **Validate and classify.** Parse skill frontmatter, cap archive/file sizes, reject traversal and unsafe symlinks, identify binaries/scripts/dependencies, and resolve the applicable license. Preserve license and notice files. Missing or unclear license means metadata-only or manual review, never an invented Apache-2.0 license.
4. **Scan and review.** Run structural and secret checks plus suspicious-instruction/script checks. Record scanner version, evidence, warnings, and blocking findings. Quarantine failures; use human review for ambiguous licenses, security findings, and high-visibility imports. Do not call automated checks a guarantee of safety.
5. **Publish idempotently.** Use a stable source identity (repository + path + commit SHA) and content hash. Skip unchanged content, preserve source URL and SHA, and generate immutable AIPM versions. Resolve package-name collisions explicitly rather than overwriting a publisher's reservation.
6. **Represent ownership truthfully.** Imported/unclaimed packages must not appear to have been published or endorsed by the upstream author. Keep upstream attribution distinct from an authenticated AIPM publisher account, and provide claim, correction, and takedown workflows.
7. **Keep sources fresh.** Poll default-branch SHAs at a bounded interval; use GitHub App push webhooks only for repositories where the app is installed. Re-fetch and rescan changed snapshots before releasing new versions. Honor API rate-limit headers, retry with backoff, and retain dead-letter jobs and per-skill failure reports.

Suggested states: `discovered → fetched → validated → scanned → approved → published`, with `metadata-only`, `manual-review`, `quarantined`, and `removed` side paths. Use a durable queue with per-host concurrency, resumable jobs, partial success, and an audit trail; the interactive admin import endpoint remains for small manual batches.

### Current importer gaps to address before mass ingestion

- `/v1/admin/import-from-url` is limited to 10 requests per minute; at that ceiling 10,000 individual requests require at least 16.7 hours before network time or failures.
- `importSkillFromGitHubUrl` downloads a repository archive for each skill. Bulk import lists immediate child folders and stops on the first failure; its default maximum is 50.
- `detectLicense` currently falls back to `Apache-2.0` when no license is detected. Remove this fallback and make redistribution eligibility an explicit gate.
- Admin import currently creates/upserts a GitHub-author user and org. A mass import must not imply the author signed up, published, or endorsed AIPM.
- Folder-name-based package names can collide across repositories; require stable source identity and collision policy.

### Rollout and measures

| Stage | Target | Exit criterion |
| --- | ---: | --- |
| Curated | 250 installable packages | Clear licenses, provenance, scan results, manual spot checks |
| Repository ingestion | 1,000 installable packages | One-fetch-per-commit worker, idempotency, retries, partial success |
| Broad discovery | 5,000 searchable records | Candidate deduplication, metadata-only states, source freshness |
| Scale | 10,000 searchable records | Stable queue operations, license/scan coverage, claim and takedown flow |

Track distinct candidates, approved/installable packages, license rejection rate, scan quarantine rate, duplicate rate, import success rate, cost per accepted skill, source freshness, install-to-activation rate, and author-claim rate. Do not optimize the 10,000 count at the expense of useful or trustworthy installs.

References: [skills.sh API](https://skills.sh/docs/api), [skills.sh terms](https://skills.sh/terms), [GitHub REST rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api), [GitHub App webhooks](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/using-webhooks-with-github-apps).
