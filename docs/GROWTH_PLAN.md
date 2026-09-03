# AIPM Growth Plan

Updated: 4 September 2026

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
