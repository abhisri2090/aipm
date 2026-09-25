import type { SeoGuide } from "./seo-guides";

/**
 * Batch-1 guide: /guides/share-claude-skills-with-team (SEO & AEO Desk brief, 2026-09-25).
 * Facts checked on 2026-09-25 against code.claude.com/docs/en/skills, /plugins/org, /plugins/loading,
 * /plugins/marketplace-reference and /discover-plugins (latest Claude Code release 2.1.282); Claude Help Center
 * articles 12512180 and 13119606; cursor.com/docs/plugins and /skills; learn.chatgpt.com/docs/build-skills and
 * /plugins; HN item 49589914 and vercel-labs/skills issues #11 and #283 (via their APIs).
 * AIPM team claims follow SEO_PRODUCT_ANSWERS_2026-09-25 (Q4): lockfile, install, update, remove, exact pins,
 * private org packages. No version ranges, no lockfile-driven or integrity-verified installs.
 */
export const SHARE_CLAUDE_SKILLS_TEAM_GUIDES: SeoGuide[] = [
  {
    slug: "share-claude-skills-with-team",
    title: "How to Share Claude Skills With Your Team (2026 Guide)",
    h1: "How to share Claude skills with your team: repo, plugin marketplace, Claude app, or a registry",
    description:
      "Four ways to share Claude skills with a team: commit .claude/skills, a plugin marketplace, Claude Team/Enterprise sharing, or a registry, plus how to pin versions.",
    answer:
      "To share Claude skills with a team, commit them to the repo's `.claude/skills/` folder so everyone who clones it gets them, package them as a Claude Code plugin in a team marketplace for use across repos, or, on Claude Team and Enterprise plans, share, publish or provision them in the Claude app so they also sync to Claude Code. To pin exact versions across many repos, and for Codex too, install them from a package registry such as AIPM.",
    answerTable: {
      caption: "Ways to share Claude skills, from the Claude Code docs and Claude Help Center (checked 25 September 2026).",
      columns: ["Option", "Works in", "Scope", "How updates reach people", "Version pinning", "Plan needed"],
      rows: [
        ["Commit `.claude/skills/`", "Claude Code, including cloud sessions; Cursor also reads the folder", "One repo", "`git pull`", "A Git commit or tag", "Any Claude Code setup"],
        ["Plugin in a team marketplace", "Claude Code (repo-declared plugins don't load in cloud sessions)", "Many repos", "`claude plugin update`, or auto-update if it's on for that marketplace", "Manifest `version`, or a source `ref` and `sha`", "Any Claude Code setup"],
        ["Claude app: share, publish or provision", "Claude app chat and Cowork; Claude Code v2.1.273+ signed in with the same account", "People, groups (Enterprise) or the whole org", "Shared: at next use. Published: when a new version is approved", "Published items stay on the approved version", "Team or Enterprise"],
        ["Managed settings", "Claude Code on every managed machine", "The whole fleet", "Admin changes the policy", "Admin-controlled", "Admin access to managed settings"],
        ["Package registry (AIPM)", "Claude Code (`--target claude`) and Codex (`--target codex`); Cursor reads both folders", "Many repos, public or private org packages", "`aipm update`, then commit", "Exact version, such as `@1.2.0`", "An AIPM org namespace for private packages"],
      ],
    },
    keywords: [
      "how to share claude skills",
      "can claude skills be shared with others",
      "how to share claude code skills",
      "claude skill sharing",
      "how to update claude code skills",
      "claude code plugins update",
      "claude code plugins versioning",
      "do claude code plugins auto update",
      "claude skill registry",
    ],
    publishedAt: "2026-09-25",
    updatedAt: "2026-09-25",
    lastChecked: "2026-09-25",
    sections: [
      {
        title: "Option 1: Commit skills to the repo (.claude/skills/)",
        body:
          "Save each skill as `.claude/skills/<name>/SKILL.md` in the repository and commit it. Everyone who clones the repo gets the skill, and Claude Code cloud sessions load the committed `.claude/skills/` too. Cursor also reads `.claude/skills/`, so the same folder serves teammates who use Cursor.",
        code: [
          {
            code: `mkdir -p .claude/skills/code-review
# write .claude/skills/code-review/SKILL.md, then:
git add .claude/skills/code-review
git commit -m "Add code-review skill"`,
          },
        ],
        bullets: [
          "Updates arrive with `git pull`, and Git history is your version record: review skill changes in pull requests like code.",
          "The catch is one copy per repo. Ten repos means ten copies that drift apart unless someone syncs them.",
          "Personal skills in `~/.claude/skills/` are not shared: they stay on your machine and don't load in Cowork or cloud sessions.",
        ],
      },
      {
        title: "Option 2: A Claude Code plugin in a team marketplace",
        body:
          "Put the skills in a plugin's `skills/` folder, list the plugin in a `.claude-plugin/marketplace.json` catalog, and host it in a Git repository. Teammates add the marketplace once with `/plugin marketplace add your-org/your-marketplace` and install from it. Plugin skills are namespaced, so they run as `/plugin-name:skill-name`. Background: [Claude Code plugins vs skills](/guides/claude-code-plugins-vs-skills) and [Claude skills marketplaces](/guides/claude-skills-marketplaces).",
        paragraphs: [
          "To have a repository ask its contributors for the plugin, commit `extraKnownMarketplaces` and `enabledPlugins` in the repo's `.claude/settings.json`:",
        ],
        code: [
          {
            label: ".claude/settings.json",
            code: `{
  "extraKnownMarketplaces": {
    "your-marketplace": {
      "source": { "source": "github", "repo": "your-org/your-marketplace" }
    }
  },
  "enabledPlugins": {
    "code-review@your-marketplace": true
  }
}`,
          },
          {
            label: "Each teammate, when the plugin's marketplace entry points at an external source",
            code: "claude plugin install code-review@your-marketplace --scope project",
          },
        ],
        bullets: [
          "The marketplace registers only after the contributor accepts the workspace trust dialog for the folder. In an untrusted folder the entries are ignored without a message.",
          "A plugin listed by a relative path inside the marketplace loads once those entries apply. A plugin whose entry points at an external source, such as its own GitHub repo, does not install from repo settings alone: each teammate sees `Plugin \"<name>\" is enabled in project settings but isn't installed` until they run the install command above.",
          "Install scopes: user (`~/.claude/settings.json`, every project on your machine), project (`.claude/settings.json`, everyone in the repo) and local (`.claude/settings.local.json`, just you in this repo).",
          "Private marketplace repos: each user needs Git read access, and the clone uses their stored Git credentials. On GitHub Actions, export a token with read access as `GH_TOKEN` and run `gh auth setup-git`.",
          "In `-p` and CI runs, plugins install in the background and can miss the first turn. Set `CLAUDE_CODE_SYNC_PLUGIN_INSTALL=1` to wait for them.",
          "Plugins declared in the repo's `.claude/settings.json`, or enabled only in user settings, don't load in cloud sessions. Commit the skills themselves if cloud sessions need them.",
        ],
      },
      {
        title: "Option 3: Share skills in the Claude app (Team and Enterprise)",
        body:
          "On Claude Team and Enterprise plans there are four ways to hand a skill to colleagues, all documented in the Claude Help Center. Menu labels can differ slightly between articles.",
        table: {
          caption: "Claude app skill distribution (Claude Help Center articles 12512180 and 13119606, checked 25 September 2026).",
          columns: ["Method", "Who can do it", "Where", "What recipients get", "Updates"],
          rows: [
            ["Share with people", "Any user, if Skill sharing is on", "Customize > Skills > … > Share", "View-only; greyed out until they enable it", "Automatically at next use"],
            ["Share with a group", "Any user on Enterprise, if Share with groups is on", "Same menu, choose a group", "Same as above", "Automatically at next use"],
            ["Publish to org", "Any user, if Publishing is on", "Customize > Skills > open the skill > Publish to org", "An item in the org library, offered as Available to install, Installed by default or Required", "Users stay on the approved version until the next one is approved"],
            ["Provision", "Owners", "Organization settings > Plugins & skills > Add > Upload a skill (ZIP with SKILL.md) or Create a skill", "Available to everyone at once, enabled by default; users can turn it off", "Managed by owners in Organization settings"],
          ],
        },
        bullets: [
          "Skill sharing is on by default for Team plans and for Enterprise plans that haven't set a skills preference. Share with organization and Share with groups are off by default.",
          "Publishing policy is Requires review, Open or Off. Team plans start Open (Off if Share with organization was already off); Enterprise starts Off (Open if Share with organization was already on). If no setting is chosen, it switches to Requires review on October 2, 2026.",
          "Shared access is removed automatically when a recipient leaves the organization. A published item stays in the library if its author leaves.",
          "Enterprise plans can target groups by bundling skills into a plugin and assigning it to a group.",
          "Skills need code execution. If an owner turns code execution off, skills are unavailable.",
          "On Enterprise plans with skill scanning on, Anthropic checks each uploaded or edited third-party skill before it can run; most scans finish in about one to two minutes.",
        ],
        paragraphs: [
          "Anthropic's Agent Skills platform overview still says claude.ai skills are individual-only and each team member must upload them. The Help Center articles above document sharing, publishing and provisioning, so use them as the reference.",
        ],
      },
      {
        title: "How Claude app skills reach Claude Code",
        body:
          "Skills enabled for your claude.ai account, including ones your organization provisions, load in Claude Code when you sign in with that account. Claude Code v2.1.273 or later downloads them to `~/.claude/skills/synced/` at session start and checks for changes about every 10 minutes.",
        bullets: [
          "No sync in sessions that use an API key (or `ANTHROPIC_AUTH_TOKEN`, `CLAUDE_CODE_OAUTH_TOKEN`, `apiKeyHelper`), on Amazon Bedrock, or with `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` set.",
          "Sync is download-only. Editing a file in `~/.claude/skills/synced/` doesn't change the skill on claude.ai, and the next sync can overwrite it.",
          "To stop syncing, set `syncClaudeAiSkills` to `false` in user settings, or in managed settings for the whole organization.",
          "Set `CLAUDE_CODE_SYNC_SKILLS=1` to make a non-interactive run wait for the skill list.",
        ],
      },
      {
        title: "Option 4: Push skills to every machine with managed settings",
        body:
          "Administrators can deploy skills to `.claude/skills/` inside the managed settings directory (for example `/etc/claude-code/.claude/skills/` on Linux), or force-enable plugins fleet-wide with the same `extraKnownMarketplaces` and `enabledPlugins` keys in managed settings.",
        bullets: [
          "Managed settings arrive through server-managed settings (Organization settings > Claude Code > Managed settings, Owner role), an MDM policy, or a `managed-settings.json` file.",
          "Managed settings beat every other scope, so a user disabling a managed plugin doesn't stop it loading.",
          "Set `autoUpdate` on a managed marketplace entry to decide auto-update for everyone, or set `DISABLE_AUTOUPDATER` in the managed `env` block to turn plugin auto-update off fleet-wide.",
        ],
      },
      {
        title: "Keep everyone on the same version: pin, update and lock skills",
        body:
          "A skill that changes silently changes what the agent does, so teams need to know which version everyone runs. It's a common pain point: \"Ask HN: How do you manage skills files?\" had 320 points and 299 comments when checked on 25 September 2026. The `npx skills` CLI documents `npx skills update` (\"Update installed skills to latest versions\"), and its versioning RFC (issue #11) and install-from-lock-file request (issue #283) are both still open.",
        table: {
          caption: "How each sharing method pins and updates skills.",
          columns: ["Method", "Pin a version", "Update", "Where the version is recorded"],
          rows: [
            ["Committed skills", "A commit or tag", "`git pull`, reviewed in pull requests", "Git history"],
            ["Claude Code plugins", "Manifest `version`, else marketplace entry `version`, else the 12-character commit SHA; or a source `ref` plus a 40-character `sha`", "`claude plugin update <plugin>@<marketplace>`, `/plugin`, or auto-update", "`installed_plugins.json` on each machine"],
            ["Claude app", "Published items stay on the approved version", "Shared: next use. Published: after approval", "Your Claude organization"],
            ["AIPM", "Exact version: `aipm add @scope/name@1.2.0`", "`aipm update` (latest), then commit", "`aipm.package.json` and `aipm-lock.json` in the repo"],
          ],
        },
        paragraphs: [
          "Plugin auto-update is on by default for Anthropic's official marketplaces and marketplaces added from claude.ai, and off for `knowledge-work-plugins`, `first-party-plugins` and every other marketplace. A plugin that pins `\"version\": \"1.0.0\"` in its manifest stays on the cached copy until the author changes that field, even after new commits. After an update, a running session keeps the old version and shows `Plugin updated: <name> · Run /reload-plugins to apply`.",
          "With AIPM, published versions can't be overwritten: publishing the same version again is rejected. `aipm install` installs every package at the version recorded in `aipm.package.json`, so committing that file and `aipm-lock.json` gives teammates and CI the same pinned versions. Version ranges aren't supported: pin exact versions.",
        ],
        code: [
          {
            label: "Pinned, private skills across repos with AIPM",
            code: `npm install -g @aipm-registry/cli
aipm init --target claude
aipm add @your-org/review-helper@1.2.0     # exact version
git add aipm.package.json aipm-lock.json   # commit both

# teammates: sign in once for private org packages, then install
aipm login
aipm install                               # versions from aipm.package.json

# CI: org install token, non-interactive
AIPM_TOKEN=<install-token> aipm install --ci --target claude

aipm update @your-org/review-helper        # move to the latest version
aipm list
aipm remove @your-org/review-helper`,
          },
        ],
      },
      {
        title: "Using Cursor or Codex too?",
        body:
          "Cursor reads skills from `.claude/skills/` and `.agents/skills/` in the repo, so committed Claude skills work there. For plugins, Cursor has team marketplaces on Teams (up to 1) and Enterprise (unlimited) plans, managed in Dashboard > Plugins & MCPs. See [how to share Cursor rules](/guides/share-cursor-rules) and [how to install Cursor skills](/guides/how-to-install-cursor-skills).",
        paragraphs: [
          "Codex reads repo skills from `.agents/skills`, not `.claude/skills`, and distributes skills through plugins. One AIPM package can be installed with `--target claude` and `--target codex`; both installs work in Cursor. Differences: [Claude Code skills vs Codex skills](/guides/claude-code-skills-vs-codex-skills).",
        ],
      },
      {
        title: "Which option should your team use?",
        body: "Pick by where your team works and how much control you need:",
        bullets: [
          "One repo: commit `.claude/skills/`.",
          "Many repos, all Claude Code: a plugin marketplace, or registry packages pinned to exact versions.",
          "Non-developers in the Claude app or Cowork: share, publish or provision in the Claude app.",
          "The whole fleet, enforced: managed settings.",
          "Claude Code and Codex together, with pinned versions and private packages: AIPM. See the [CLI commands](/commands) and [publishing guide](/publish/guide).",
        ],
        paragraphs: [
          "AIPM installs skills and AIPM prompts only. It doesn't install plugins, CLAUDE.md, AGENTS.md or Cursor rules; for always-on instruction files, see [how to share AI coding agent instructions](/guides/share-ai-coding-agent-instructions). Prompts are covered in [how to version AI prompts](/guides/version-ai-prompts), and the skills.sh comparison is in [AIPM vs Skills.sh](/guides/aipm-vs-skills-sh).",
        ],
      },
    ],
    steps: [
      "Decide the scope: one repo, many repos, the Claude app, or the whole fleet.",
      "For one repo, commit .claude/skills/<name>/SKILL.md.",
      "For many repos, publish a plugin marketplace or registry packages with exact versions.",
      "On Team or Enterprise, share, publish or provision the skill in the Claude app.",
      "Decide who approves updates, and pin versions so everyone runs the same one.",
    ],
    faqs: [
      {
        question: "Can Claude skills be shared with others?",
        answer:
          "Yes. Commit them to a repository, distribute them as a Claude Code plugin, or, on Team and Enterprise plans, share, publish or provision them in the Claude app.",
      },
      {
        question: "How do I share Claude Code skills with my team?",
        answer:
          "Commit them to the repo's .claude/skills/ folder, or put them in a plugin and declare its marketplace in the repo's .claude/settings.json with extraKnownMarketplaces and enabledPlugins.",
      },
      {
        question: "Do shared skills in the Claude app update automatically?",
        answer:
          "Skills shared with people or groups update at next use. Skills published to the organization update when an owner approves the new version.",
      },
      {
        question: "Do skills from the Claude app work in Claude Code?",
        answer:
          "Yes, in Claude Code v2.1.273 or later signed in with the same Claude account. They sync to ~/.claude/skills/synced/. They don't sync with an API key or on Amazon Bedrock.",
      },
      {
        question: "How do I update Claude Code skills or plugins?",
        answer:
          "Committed skills: git pull. Plugins: claude plugin update <plugin>@<marketplace>, /plugin, or auto-update. AIPM packages: aipm update, then commit aipm.package.json and aipm-lock.json.",
      },
      {
        question: "How do I pin a skill to a specific version?",
        answer:
          "Git: a commit or tag. Plugins: a manifest version, or a ref and sha on the marketplace source. AIPM: aipm add @scope/name@1.2.0. AIPM doesn't support version ranges.",
      },
      {
        question: "Can I share private skills only inside my company?",
        answer:
          "Yes: a private repository or marketplace, Claude org sharing or provisioning, or private AIPM org packages installed after aipm login or with an org install token (--token or AIPM_TOKEN).",
      },
    ],
    sources: [
      { label: "Claude Code docs: Skills (share skills, synced skills)", href: "https://code.claude.com/docs/en/skills" },
      { label: "Claude Code docs: Manage plugins for your organization", href: "https://code.claude.com/docs/en/plugins/org" },
      { label: "Claude Code docs: Plugin loading, versions and updates", href: "https://code.claude.com/docs/en/plugins/loading" },
      { label: "Claude Code docs: Marketplace reference (plugin sources)", href: "https://code.claude.com/docs/en/plugins/marketplace-reference" },
      { label: "Claude Code docs: Discover and install plugins", href: "https://code.claude.com/docs/en/discover-plugins" },
      { label: "Claude Help Center: Use skills in Claude", href: "https://support.claude.com/en/articles/12512180-use-skills-in-claude" },
      { label: "Claude Help Center: Provision and manage skills for your organization", href: "https://support.claude.com/en/articles/13119606-provision-and-manage-skills-for-your-organization" },
      { label: "Claude Platform docs: Agent Skills overview (sharing scope)", href: "https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview#sharing-scope" },
      { label: "Cursor docs: Plugins (team marketplaces)", href: "https://cursor.com/docs/plugins" },
      { label: "Cursor docs: Agent Skills", href: "https://cursor.com/docs/skills" },
      { label: "OpenAI Codex docs: Build skills", href: "https://learn.chatgpt.com/docs/build-skills" },
      { label: "OpenAI Codex docs: Plugins", href: "https://learn.chatgpt.com/docs/plugins" },
      { label: "Hacker News: Ask HN: How do you manage skills files?", href: "https://news.ycombinator.com/item?id=49589914" },
      { label: "vercel-labs/skills issue #11: [RFC] Versioning", href: "https://github.com/vercel-labs/skills/issues/11" },
      { label: "vercel-labs/skills issue #283: install from lock file", href: "https://github.com/vercel-labs/skills/issues/283" },
    ],
  },
];
