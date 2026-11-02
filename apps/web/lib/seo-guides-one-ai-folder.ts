import type { SeoGuide } from "./seo-guides";

/**
 * Guide: /guides/one-ai-folder-for-every-ai-tool
 * Published from the approved post (2026-10-22). Facts checked that day against
 * Cursor, Claude Code and Codex docs, plus packages/engine/src/install-shared.ts.
 */
export const ONE_AI_FOLDER_GUIDES: SeoGuide[] = [
  {
    slug: "one-ai-folder-for-every-ai-tool",
    title: "One .ai Folder for Every AI Tool: Share Skills with Symlinks (2026)",
    h1: "Keep AI skills in one .ai folder and link them into every tool",
    description:
      "Store each AI skill once in .ai/skills and symlink it into .cursor/skills, .claude/skills and .agents/skills, so Cursor, Claude Code and Codex all load the same copy.",
    answer:
      "Keep one real copy of each skill under `.ai/skills/` and add a symlink from `.cursor/skills`, `.claude/skills` and `.agents/skills` to that copy. Cursor, Claude Code and Codex then all read the same file. `aipm add --shared` does this and records the real files and every link in the lockfile.",
    keywords: [
      "share skills between cursor and claude code",
      ".ai folder skills",
      "symlink claude skills",
      "agent skills single source of truth",
      "cursor claude codex same skills",
      "aipm add --shared",
    ],
    publishedAt: "2026-10-22",
    updatedAt: "2026-10-22",
    lastChecked: "2026-10-22",
    sections: [
      {
        title: "The problem: three folders, three copies",
        body:
          "Most teams I talk to don't use one AI coding tool. Someone lives in Cursor, someone else in Claude Code, and the person who joined last month uses Codex in the terminal. That's fine until you want all three to follow the same code review checklist, deploy steps, or migration playbook.",
        paragraphs: [
          "This post covers the layout AIPM uses for that: one real copy of each skill under `.ai/skills/`, plus a symlink (a shortcut) from each tool's folder to that copy. I'll show the manual version with `ln -s`, the AIPM version with real output, and the problems you'll run into.",
          "Each tool reads project skills from its own folder. From the official docs, checked 22 October 2026:",
          "Every tool uses the same format: a folder with a `SKILL.md` inside (the Agent Skills standard). The files don't differ. Only where they live does.",
          "So the obvious fix is to copy the folder three times. It works on day one. By week three someone has fixed a step in `.claude/skills/review/SKILL.md`, and the Cursor copy still has the old one. Nobody notices until two people get different review comments on the same PR. A diff between copies never shows up in code review because nobody thinks to look.",
        ],
        table: {
          caption: "Project skills folders from the official docs, checked 22 October 2026.",
          columns: ["Tool", "Project skills folder", "Notes from the docs"],
          rows: [
            [
              "Cursor",
              "`.cursor/skills/` or `.agents/skills/`",
              "Also reads `.claude/skills/` and `.codex/skills/` for compatibility",
            ],
            [
              "Claude Code",
              "`.claude/skills/<name>/SKILL.md`",
              "A skill folder \"can be a symlink to a directory elsewhere on disk\"; a target reached through several links loads once",
            ],
            [
              "Codex",
              "`.agents/skills/` in each folder from your working directory up to the repo root",
              "\"Codex supports symlinked skill folders and follows the symlink target\"",
            ],
          ],
        },
      },
      {
        title: "The pattern: one source, many links",
        body:
          "Keep one real copy and point each tool at it. You edit `.ai/skills/review-helper/SKILL.md`. Every tool reads the change, because there is nothing else for it to read. The tool folders hold only links.",
        paragraphs: [
          "Codex gets `.agents/skills/`, not `.codex/skills/`. That's the path the Codex docs list for repo skills, and it's where AIPM's Codex adapter writes.",
        ],
        code: [
          {
            label: "One real copy under `.ai/skills/`, plus a link from each tool folder",
            code: `my-project/
├── .ai/
│   └── skills/
│       └── review-helper/        ← the only real files
│           └── SKILL.md
├── .cursor/
│   └── skills/
│       └── review-helper -> ../../.ai/skills/review-helper
├── .claude/
│   └── skills/
│       └── review-helper -> ../../.ai/skills/review-helper
└── .agents/
    └── skills/
        └── review-helper -> ../../.ai/skills/review-helper`,
          },
        ],
      },
      {
        title: "The manual way",
        body: "You don't need any tooling for this. From the repo root:",
        paragraphs: [
          "Two details matter here.",
          "Use relative links. The link target is resolved relative to the folder the link sits in, so `../../.ai/skills/review-helper` from `.claude/skills/` goes back to the repo root. A relative link still works after a teammate clones into `~/code/whatever`. An absolute link like `/Users/abhishek/work/app/.ai/...` breaks on every other machine.",
          "Doing this by hand is fine for two skills. At twenty skills across three tools that's sixty links, and the hard part is removing them: delete a skill from `.ai/` and you leave dangling links in every tool folder.",
        ],
        code: [
          {
            code: `mkdir -p .ai/skills/review-helper
$EDITOR .ai/skills/review-helper/SKILL.md

mkdir -p .cursor/skills .claude/skills .agents/skills
ln -s ../../.ai/skills/review-helper .cursor/skills/review-helper
ln -s ../../.ai/skills/review-helper .claude/skills/review-helper
ln -s ../../.ai/skills/review-helper .agents/skills/review-helper`,
          },
          {
            label: "Check before you commit",
            code: `ls -l .claude/skills
# review-helper -> ../../.ai/skills/review-helper
cat .claude/skills/review-helper/SKILL.md   # should print the real file`,
          },
        ],
      },
      {
        title: "The AIPM way",
        body:
          "AIPM does the same thing, plus tracks it. `aipm add` takes a `--shared` flag (\"Install the skill in .ai/skills and shortcut every detected tool\"). Here is a real run with the published CLI (0.4.10), in an empty repo that has all three tool folders:",
        code: [
          {
            code: `mkdir .cursor .claude .codex
aipm init
# Created aipm.package.json (project, registry: https://api.aipm-registry.com)

aipm add @amplitude/review-agent-insights@1.0.0 --shared --ci
# Installed @amplitude/review-agent-insights@1.0.0 → cursor, claude, codex`,
          },
        ],
      },
      {
        title: "The resulting tree",
        body: "The resulting tree:",
        code: [
          {
            code: `.
├── .agents/skills/review-agent-insights -> ../../.ai/skills/review-agent-insights
├── .ai/skills/review-agent-insights/SKILL.md
├── .claude/skills/review-agent-insights -> ../../.ai/skills/review-agent-insights
├── .codex/
├── .cursor/skills/review-agent-insights -> ../../.ai/skills/review-agent-insights
├── aipm-lock.json
└── aipm.package.json`,
          },
        ],
      },
      {
        title: "How it decides what to link, from the source",
        body: "How it decides what to link, from the source:",
        bullets: [
          "Detection is by folder. AIPM looks for `.cursor`, `.claude` and `.codex` at the project root. Only tools the package lists in its `targets` (or `*`) get a link. With no tool folder at all, `--shared` stops with: `No AI tool folder found to link. Add .cursor, .claude, or .codex, or pass --target.`",
          "Codex is detected by `.codex/` but linked at `.agents/skills/`, which is the folder Codex reads.",
          "Links are relative (`relative(dirname(linkPath), canonicalDir)` in `install-shared.ts`), the same as the manual version.",
          "It won't overwrite your files. If `.claude/skills/review-agent-insights` already exists as a real folder, AIPM stops and tells you to remove it or use `--target`. An existing link is replaced.",
          "`--shared` and `--target` can't be combined. `--target cursor|claude|codex|*` is the plain-copy install.",
          "No flag, two or more tool folders: an interactive run asks you to choose one tool or `.ai`. With `--ci` it fails instead of guessing: `Several AI tool folders found. Pass --target cursor|claude|codex or --shared.`",
        ],
      },
      {
        title: "The lockfile records both the real files and every link",
        body:
          "The lockfile records both the real files and every link, so update and remove know what to touch:",
        paragraphs: [
          "(0.4.10 writes absolute paths here. On `main`, which ships as 0.4.11, the CLI writes paths relative to the lockfile so the lockfile can be committed. The snippet shows that relative form.)",
        ],
        code: [
          {
            code: `"@amplitude/review-agent-insights": {
  "version": "1.0.0",
  "integrity": "sha256-bN1UVF8uTnWMQEh9jMpUDEIn5sG+V/bR3N71hTj30+k=",
  "resolvedTools": ["cursor", "claude", "codex"],
  "installed": {
    "cursor": [".cursor/skills/review-agent-insights"],
    "claude": [".claude/skills/review-agent-insights"],
    "codex": [".agents/skills/review-agent-insights"]
  },
  "shared": {
    "root": ".ai/skills/review-agent-insights",
    "files": [".ai/skills/review-agent-insights/SKILL.md"]
  }
}`,
          },
        ],
      },
      {
        title: "Removing is one command",
        body: "Removing is one command, and it cleans up the links too:",
        paragraphs: [
          "After that only `.codex/`, `aipm.package.json` and `aipm-lock.json` are left. You don't get dangling links. Notice that `.cursor/` and `.claude/` are gone too: they held nothing but that one skill, so they were removed once they were empty. More on that below.",
        ],
        code: [
          {
            code: `aipm remove @amplitude/review-agent-insights
# Deleted 4 tracked installed files.
# Removed @amplitude/review-agent-insights from AIPM project files.`,
          },
        ],
      },
      {
        title: "What this gets a team",
        body:
          "One review surface. A change to a skill is one diff in `.ai/skills/`. Reviewers see what changed once, not three times or (worse) once out of three.",
        bullets: [
          "Tool choice stops being a team decision. The skill doesn't belong to Cursor or Claude. If someone switches tools, or a new hire brings their own, they add that tool's folder and run `aipm install --shared` (the same flag exists on `install` and `update`). Nothing in `.ai/` changes.",
          "Onboarding is a clone. Commit `.ai/`, the links, `aipm.package.json` and `aipm-lock.json`. Git stores symlinks as links, not copies (in the demo, `git ls-files -s` shows mode `120000` for all three). A fresh clone on macOS or Linux works with no setup step.",
          "It scales by count, not by tools. Adding a skill is one folder plus N links that a tool creates for you. Adding a tool is N links. You never get N×M real files.",
        ],
      },
      {
        title: "Commit the links, or gitignore the tool folders. Pick one.",
        body:
          "If you commit the links, clones work as-is. If your team gitignores `.cursor/` or `.claude/` (some do, because those folders also hold personal settings), the links won't travel. Then each person runs `aipm install --shared` after cloning to recreate them from the lockfile. Both work. What breaks is a mix: `.ai/` committed, links ignored, and no install step in the README. If you ignore part of a tool folder, ignore narrowly (for example `.claude/settings.local.json`) and keep `skills/` tracked.",
      },
      {
        title: "Windows",
        body:
          "Creating directory symlinks on Windows needs extra permissions. AIPM catches the `EPERM` error and tells you: `On Windows, turn on Developer Mode or run an admin shell, then retry.` Git for Windows also only checks out symlinks as real links when `core.symlinks` is on. Otherwise you get small text files holding the target path, and the tools won't find a `SKILL.md`. I haven't tested AIPM's shared layout on Windows beyond reading that error path. If your team is mostly on Windows, try it on one machine before standardizing, or use `--target` copies there.",
      },
      {
        title: "Relative vs absolute",
        body:
          "Always relative, for the clone reason above. If you move `.ai/` or nest the project deeper, relative links still work as long as the whole tree moves together.",
      },
      {
        title: "Cursor reads more than one folder",
        body:
          "Cursor's docs say it loads `.cursor/skills/`, `.agents/skills/` and `.claude/skills/`. With all three linked, Cursor can reach the same skill three ways. Claude Code's docs say it loads a symlinked target once, but Cursor's docs don't say how it handles the same skill showing up in several folders. If you see duplicates in Cursor's skill list, that's why. It's the same file either way, so nothing drifts.",
      },
      {
        title: "Don't edit through the link and expect a copy",
        body:
          "Editing `.claude/skills/x/SKILL.md` edits `.ai/skills/x/SKILL.md`, because they're the same file. That's the point, but it surprises people who think they're making a Claude-only tweak. If one tool really needs different instructions, give it a separate skill. Don't fork it through the link.",
      },
      {
        title: "Removing the last skill can remove the tool folder",
        body:
          "In the demo above, removing the only shared skill also removed the empty `.cursor/` and `.claude/` folders. Since AIPM detects tools by those folders, the next `aipm add --shared` linked only Codex. In a real repo those folders usually hold other files (rules, settings), so this rarely happens. In a fresh repo, recreate the folder (`mkdir .cursor`) before you add again.",
      },
      {
        title: "Folder name = skill name",
        body:
          "Cursor requires the `name` in frontmatter to match the folder. Keep the link name identical to the `.ai/skills/` folder name. AIPM uses the package's short name for both.",
      },
      {
        title: "Try it",
        body:
          "If you already have skills in one tool folder, move them to `.ai/skills/` and link them back with the `ln -s` commands above. It's ten minutes and fully reversible.",
        paragraphs: [
          "If you'd rather install, update and remove them as versioned packages, with the links tracked in a lockfile:",
          "Browse packages and the full command reference at [aipm-registry.com](/). The exact per-tool folders are on the [targets page](/targets).",
        ],
        code: [
          {
            code: `npm i -g @aipm-registry/cli
aipm init
aipm add @scope/name@version --shared`,
          },
        ],
      },
    ],
    steps: [
      "Move existing skills to `.ai/skills/`, or create them there.",
      "Create `.cursor/skills`, `.claude/skills` and `.agents/skills`.",
      "Add a relative symlink from each tool folder: `ln -s ../../.ai/skills/<name> <tool>/skills/<name>`.",
      "Or install with AIPM: `aipm init`, then `aipm add @scope/name@version --shared`.",
      "Commit `.ai/`, the links, `aipm.package.json` and `aipm-lock.json` — or gitignore the tool folders and have each person run `aipm install --shared` after cloning.",
    ],
    faqs: [
      {
        question: "Why not copy the skill folder into each tool?",
        answer:
          "It works on day one. By week three someone has fixed a step in `.claude/skills/review/SKILL.md`, and the Cursor copy still has the old one. A diff between copies never shows up in code review because nobody thinks to look.",
      },
      {
        question: "Should symlink targets be relative or absolute?",
        answer:
          "Use relative links. The target is resolved from the folder the link sits in, so `../../.ai/skills/review-helper` from `.claude/skills/` still works after a teammate clones into `~/code/whatever`. An absolute link like `/Users/abhishek/work/app/.ai/...` breaks on every other machine.",
      },
      {
        question: "Where does Codex read project skills?",
        answer:
          "Codex gets `.agents/skills/`, not `.codex/skills/`. That's the path the Codex docs list for repo skills, and it's where AIPM's Codex adapter writes. AIPM detects Codex by `.codex/` but links at `.agents/skills/`.",
      },
      {
        question: "What if the team gitignores .cursor/ or .claude/?",
        answer:
          "The links won't travel. Each person then runs `aipm install --shared` after cloning to recreate them from the lockfile. Commit the links, or gitignore the tool folders. Pick one. A mix — `.ai/` committed, links ignored, and no install step in the README — is what breaks.",
      },
      {
        question: "Can I use --shared and --target together?",
        answer:
          "No. `--shared` and `--target` can't be combined. `--target cursor|claude|codex|*` is the plain-copy install.",
      },
    ],
    sources: [
      { label: "Cursor docs: Agent Skills", href: "https://cursor.com/docs/skills" },
      { label: "Claude Code docs: Extend Claude with skills", href: "https://code.claude.com/docs/en/skills" },
      { label: "Codex docs: Build skills", href: "https://developers.openai.com/codex/skills" },
      {
        label: "AIPM source: packages/engine/src/install-shared.ts",
        href: "https://github.com/abhisri2090/aipm/blob/main/packages/engine/src/install-shared.ts",
      },
    ],
    nextSteps: [
      {
        label: "Browse packages",
        href: "/skills",
        description: "Browse packages on AIPM.",
      },
      {
        label: "CLI commands",
        href: "/commands",
        description: "The full command reference.",
      },
      {
        label: "Supported targets",
        href: "/targets",
        description: "The exact per-tool folders.",
      },
    ],
  },
];
