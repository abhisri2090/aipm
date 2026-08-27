export type SeoGuide = {
  slug: string;
  title: string;
  h1: string;
  description: string;
  answer: string;
  keywords: string[];
  sections: Array<{
    title: string;
    body: string;
  }>;
  steps: string[];
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  sources?: Array<{
    label: string;
    href: string;
  }>;
};

export const SEO_GUIDES: SeoGuide[] = [
  {
    slug: "ai-package-manager",
    title: "What Is an AI Package Manager?",
    h1: "What is an AI package manager?",
    description:
      "Learn what an AI package manager does, why teams need one, and how AIPM installs reusable AI skills.",
    answer:
      "An AI package manager helps teams install, update, and share AI setup files. These files can include prompts, skills, rules, MCP setup, and tool instructions.",
    keywords: ["AI package manager", "AIPM", "AI skills", "prompt packages", "agent package manager"],
    sections: [
      {
        title: "The simple idea",
        body:
          "Normal software teams use package managers to install code. AI teams also need reusable files, but the files are different. They are prompts, rules, skill files, examples, and setup notes. An AI package manager gives those files a clear install flow.",
      },
      {
        title: "Why it matters",
        body:
          "Without a package manager, people copy prompts from chat, paste rules by hand, and forget which version is current. That works for one person, but it breaks when a team grows.",
      },
      {
        title: "How AIPM fits",
        body:
          "AIPM gives you a registry and a CLI. You find a skill, run an install command, and AIPM writes the right files into the project.",
      },
    ],
    steps: [
      "Find a skill in the AIPM registry.",
      "Install the AIPM CLI.",
      "Run aipm init in your project.",
      "Run aipm add @scope/name@version.",
      "Open your AI tool and use the installed skill.",
    ],
    faqs: [
      {
        question: "Is an AI package manager the same as npm?",
        answer:
          "No. npm installs code packages. AIPM installs AI skill files, prompts, rules, and tool setup files.",
      },
      {
        question: "Who should use an AI package manager?",
        answer:
          "Developers and teams who use AI tools in more than one project should use one. It helps keep setup repeatable.",
      },
    ],
  },
  {
    slug: "agent-package-manager",
    title: "Agent Package Manager for AI Workflows",
    h1: "What is an agent package manager?",
    description:
      "Understand agent package managers in plain English and see how they help AI agents reuse project workflows.",
    answer:
      "An agent package manager stores reusable instructions for AI agents. It helps an agent find the right workflow, install it, and use it inside a project.",
    keywords: ["agent package manager", "AI agents", "AIPM", "agent skills", "AI workflows"],
    sections: [
      {
        title: "Agents need instructions",
        body:
          "An AI agent can write code, read files, and call tools. But it still needs clear instructions. A package can tell the agent how your team reviews code, writes tests, or handles releases.",
      },
      {
        title: "Packages make workflows repeatable",
        body:
          "If every project has a different hidden prompt, the agent behaves differently each time. A package gives the workflow a name and a version.",
      },
      {
        title: "AIPM keeps it project-local",
        body:
          "AIPM installs files into the project. That means the workflow can live near the code and can be reviewed like other project changes.",
      },
    ],
    steps: [
      "Write one clear agent workflow.",
      "Put the workflow in a skill file.",
      "Publish it as an AIPM package.",
      "Install it into each project that needs it.",
      "Update the package when the workflow changes.",
    ],
    faqs: [
      {
        question: "Does an agent package manager run the agent?",
        answer:
          "No. It manages the files and instructions that the agent uses. Your AI tool still runs the agent.",
      },
      {
        question: "Can one package work for many agents?",
        answer:
          "Yes. The package can include a different file for each AI tool that it supports. AIPM installs the right file for each tool.",
      },
    ],
  },
  {
    slug: "prompt-package-manager",
    title: "Prompt Package Manager for Teams",
    h1: "How do teams manage prompts like packages?",
    description:
      "Learn how to stop copying prompts by hand and manage reusable prompts with names, versions, and install commands.",
    answer:
      "A prompt package manager lets a team save useful prompts as packages. Each package has a name, a version, and clear install steps.",
    keywords: ["prompt package manager", "prompt packages", "AI prompt versioning", "AIPM prompts"],
    sections: [
      {
        title: "Copy-paste does not scale",
        body:
          "A prompt in a chat window is easy to lose. A prompt in a package can be found, reviewed, installed, and updated.",
      },
      {
        title: "Good prompt packages explain the task",
        body:
          "A useful prompt package should answer four questions. When should I use it? What information does it need? What should it create? Which AI tools can use it?",
      },
      {
        title: "Versions prevent confusion",
        body:
          "When a prompt changes, publish a new version. That way users can see what changed and choose when to update.",
      },
    ],
    steps: [
      "Choose one repeated prompt your team uses often.",
      "Write a short README or SKILL.md for it.",
      "Add examples of good input and output.",
      "Publish it as an AIPM package.",
      "Install it in projects that need the prompt.",
    ],
    faqs: [
      {
        question: "Should every prompt become a package?",
        answer:
          "No. Package prompts that are reused, important, or shared across a team.",
      },
      {
        question: "Can a prompt package include examples?",
        answer:
          "Yes. Examples are useful because they show the assistant what good output looks like.",
      },
    ],
  },
  {
    slug: "mcp-package-manager",
    title: "MCP Package Manager for AI Tool Setup",
    h1: "How can teams package MCP setup?",
    description:
      "Learn how MCP setup can be documented, shared, and installed as part of reusable AI tool packages.",
    answer:
      "MCP setup often needs instructions, config, and examples. A package manager can keep that setup together so teams do not rebuild it by hand.",
    keywords: ["MCP package manager", "MCP setup", "AI tool setup", "AIPM MCP"],
    sections: [
      {
        title: "MCP setup has many small parts",
        body:
          "A team may need server names, settings, private values, use instructions, and safety notes. People can easily miss these details when copying them by hand.",
      },
      {
        title: "A package gives the setup a home",
        body:
          "A package can explain what the MCP server does and when to use it. It can also list the private values and files that users need.",
      },
      {
        title: "AIPM can grow with target support",
        body:
          "AIPM can install the right files for each AI tool. MCP setup also needs clear steps that people can use again.",
      },
    ],
    steps: [
      "Write down what the MCP server is for.",
      "List the safe config files and private values separately.",
      "Add usage examples for the assistant.",
      "Package the public setup notes.",
      "Keep secrets out of the package.",
    ],
    faqs: [
      {
        question: "Should MCP secrets go into a package?",
        answer:
          "No. A package can explain which secrets are needed, but the secret values should stay private.",
      },
      {
        question: "Why package MCP setup?",
        answer:
          "It helps every project use the same setup rules instead of rebuilding them from memory.",
      },
    ],
  },
  {
    slug: "version-ai-prompts",
    title: "How to Version AI Prompts in a Repo",
    h1: "How do you version AI prompts in a repo?",
    description:
      "A simple guide for keeping AI prompts, rules, and skills in Git so teams can review changes.",
    answer:
      "Save important prompts in project files and record their changes with Git. Put shared prompts in packages with clear version numbers.",
    keywords: ["version AI prompts", "prompts in Git", "AI prompt versioning", "AIPM"],
    sections: [
      {
        title: "Move prompts out of chat",
        body:
          "Chat history is not a good source of truth. If a prompt matters, save it as a file in the project.",
      },
      {
        title: "Review prompt changes like code",
        body:
          "A small prompt change can change AI output. Use pull requests so teammates can read the change before it spreads.",
      },
      {
        title: "Use packages for shared prompts",
        body:
          "If many projects need the same prompt, publish it as an AIPM package. Then each project can install a clear version.",
      },
    ],
    steps: [
      "Create a folder for AI files in the repo.",
      "Add the prompt, its purpose, and examples.",
      "Commit the file to Git.",
      "Review changes before merging.",
      "Publish shared prompts as AIPM packages.",
    ],
    faqs: [
      {
        question: "Why not keep prompts only in a shared document?",
        answer:
          "A shared document is easy to read, but it may not match the project. Git keeps the prompt near the code that uses it.",
      },
      {
        question: "When should I publish a prompt package?",
        answer:
          "Publish it when the prompt is useful in more than one project or for more than one teammate.",
      },
    ],
  },
  {
    slug: "share-cursor-rules",
    title: "How to Share Cursor Rules Across a Team",
    h1: "How do you share Cursor rules across a team?",
    description:
      "Learn a simple way to package Cursor rules so every project can install the same AI workflow.",
    answer:
      "Save Cursor rules as project files, package the reusable ones, and install them with AIPM when another project needs the same workflow.",
    keywords: ["share Cursor rules", "Cursor rules", "Cursor skills", "AIPM Cursor"],
    sections: [
      {
        title: "Cursor rules should be visible",
        body:
          "If a rule changes how Cursor works, the team should be able to read it. Keep rules in files, not only in a private note.",
      },
      {
        title: "Reusable rules should have a name",
        body:
          "A rule for code review, test writing, or release notes can become a package. A name makes it easier to find and install.",
      },
      {
        title: "AIPM installs into the project",
        body:
          "AIPM can install skill files into Cursor-friendly project folders. The rule then travels with the project.",
      },
    ],
    steps: [
      "Pick a Cursor rule the team uses often.",
      "Write what the rule does in simple words.",
      "Add a small example.",
      "Publish the rule as a skill package.",
      "Install it in other projects with AIPM.",
    ],
    faqs: [
      {
        question: "Can Cursor rules be different per project?",
        answer:
          "Yes. Keep project-specific rules in that project. Package only the rules that are useful in many projects.",
      },
      {
        question: "Does AIPM replace Cursor?",
        answer:
          "No. AIPM helps install the files that Cursor can use.",
      },
    ],
  },
  {
    slug: "reusable-claude-skills",
    title: "How to Publish Reusable Claude Skills",
    h1: "How do you publish reusable Claude skills?",
    description:
      "Learn how to turn a repeated Claude workflow into a simple skill package that teams can install.",
    answer:
      "Save the steps in a skill file and add an example. Publish the skill with AIPM. Then install it in each project that needs it.",
    keywords: ["Claude skills", "Claude Code skills", "publish Claude skills", "AIPM Claude"],
    sections: [
      {
        title: "Start with one repeated job",
        body:
          "Good Claude skills are small. Pick one job, such as summarizing an issue, reviewing code, writing release notes, or explaining a module.",
      },
      {
        title: "Make the expected output clear",
        body:
          "Tell Claude what format to use. A checklist, table, or short report is easier to reuse than a vague instruction.",
      },
      {
        title: "Publish only safe files",
        body:
          "Do not include private prompts, customer data, logs, or secrets. Run a preview before publishing.",
      },
    ],
    steps: [
      "Create a skill folder.",
      "Write the skill goal and limits.",
      "Add one or two examples.",
      "Run aipm publish preview.",
      "Publish and install the package where needed.",
    ],
    faqs: [
      {
        question: "Can one Claude skill work in many repos?",
        answer:
          "Yes, if the skill is written for a common task and does not depend on private project details.",
      },
      {
        question: "What should a beginner include first?",
        answer:
          "Start with the goal, when to use the skill, what input is needed, and what output Claude should return.",
      },
    ],
  },
  {
    slug: "ai-agent-instructions-git",
    title: "How to Manage AI Agent Instructions in Git",
    h1: "How do you manage AI agent instructions in Git?",
    description:
      "A beginner-friendly guide to keeping AI agent instructions in Git so teams can review, reuse, and update them.",
    answer:
      "Keep important AI agent instructions as files in the repo. Review them in pull requests and package shared instructions with AIPM.",
    keywords: ["AI agent instructions", "AI instructions in Git", "agent skills", "AIPM"],
    sections: [
      {
        title: "Instructions are part of the project",
        body:
          "AI tools affect how work gets done. Their instructions should be visible to the team, just like tests, docs, and config files.",
      },
      {
        title: "Git gives you history",
        body:
          "When an instruction changes, Git shows who changed it and why. That makes it easier to fix mistakes later.",
      },
      {
        title: "Packages help across projects",
        body:
          "If the same instruction is useful in many repos, package it. Then the team can install it instead of copying it again and again.",
      },
    ],
    steps: [
      "Create a clear folder for AI instructions.",
      "Use simple file names.",
      "Explain what each instruction is for.",
      "Review changes in pull requests.",
      "Package shared instructions with AIPM.",
    ],
    faqs: [
      {
        question: "Should all AI instructions be public?",
        answer:
          "No. Keep private business details and secrets out of public packages.",
      },
      {
        question: "Why put AI instructions in Git?",
        answer:
          "Git makes the instructions easy to review, update, and roll back.",
      },
    ],
  },
  {
    slug: "share-ai-prompts-team",
    title: "How to Share AI Prompts With a Team",
    h1: "How do you share AI prompts with a team?",
    description:
      "A simple guide for sharing useful AI prompts with teammates without losing context or copying old versions.",
    answer:
      "Put important prompts in shared project files, explain when to use them, and publish reusable prompts as AIPM packages.",
    keywords: ["share AI prompts", "team prompts", "prompt management", "AIPM prompts"],
    sections: [
      {
        title: "A shared prompt needs context",
        body:
          "A prompt is not just text. It should also explain when to use it, what input it needs, and what good output looks like.",
      },
      {
        title: "Files are better than chat history",
        body:
          "A prompt is hard to reuse when it is hidden in an old chat. A shared file gives the team one clear place to find it.",
      },
      {
        title: "Packages help across projects",
        body:
          "If the same prompt helps more than one project, make it an AIPM package. Then each project can install the same version.",
      },
    ],
    steps: [
      "Pick one prompt the team uses often.",
      "Write the prompt in a project file.",
      "Add a short note that explains when to use it.",
      "Add one example input and output.",
      "Publish it as an AIPM package if more projects need it.",
    ],
    faqs: [
      {
        question: "Should team prompts be public?",
        answer:
          "Only publish prompts that are safe to share. Keep private business details, customer data, and secrets out of public packages.",
      },
      {
        question: "Why not paste prompts in Slack?",
        answer:
          "Slack is useful for discussion, but a project file is easier to review, update, and install.",
      },
    ],
  },
  {
    slug: "manage-cursor-rules-git",
    title: "How to Manage Cursor Rules in Git",
    h1: "How do you manage Cursor rules in Git?",
    description:
      "Learn how to keep Cursor rules in Git so a team can review, update, and reuse them safely.",
    answer:
      "Save Cursor rules as project files, commit them to Git, and package reusable rules with AIPM when other projects need them.",
    keywords: ["Cursor rules Git", "manage Cursor rules", "Cursor AI rules", "AIPM Cursor"],
    sections: [
      {
        title: "Rules should be reviewable",
        body:
          "Cursor rules can change how AI suggestions behave. A team should be able to read and review those rules before they spread.",
      },
      {
        title: "Git shows what changed",
        body:
          "Git shows the team every change to a rule. People can discuss the change and undo it if the AI starts giving poor answers.",
      },
      {
        title: "Reusable rules can become packages",
        body:
          "Some rules are useful in many projects. A team can publish one rule with AIPM and then install it in each project.",
      },
    ],
    steps: [
      "Create a clear folder for Cursor rules.",
      "Use names that explain the task.",
      "Commit the rules to Git.",
      "Review rule changes in pull requests.",
      "Package rules that are useful in many projects.",
    ],
    faqs: [
      {
        question: "Should every Cursor rule be shared?",
        answer:
          "No. Keep project-only rules in that project. Share rules that help many repos.",
      },
      {
        question: "Can AIPM install Cursor rules?",
        answer:
          "AIPM can install files made for Cursor. The package shows which files it contains.",
      },
    ],
  },
  {
    slug: "reuse-claude-code-workflows",
    title: "How to Reuse Claude Code Workflows",
    h1: "How do you reuse Claude Code workflows?",
    description:
      "A beginner-friendly guide to turning repeated Claude Code tasks into reusable skill packages.",
    answer:
      "Save the repeated steps as a small skill and add an example. Use AIPM to install it in each project that needs it.",
    keywords: ["Claude Code workflows", "reuse Claude workflows", "Claude skills", "AIPM Claude"],
    sections: [
      {
        title: "Start with one job",
        body:
          "A reusable workflow should do one clear job. Good examples are code review, bug triage, release notes, test planning, and docs updates.",
      },
      {
        title: "Make the output predictable",
        body:
          "Claude works better when the skill says what format to use. Ask for a checklist, short report, or clear sections.",
      },
      {
        title: "Install the same workflow everywhere",
        body:
          "After a workflow is packaged, AIPM can install it into each project. The team no longer has to copy the same prompt by hand.",
      },
    ],
    steps: [
      "Choose one Claude Code task your team repeats.",
      "Write the goal, input, and output format.",
      "Add examples and safety limits.",
      "Publish the workflow as an AIPM package.",
      "Install it into projects that need the same task.",
    ],
    faqs: [
      {
        question: "What makes a good Claude Code workflow?",
        answer:
          "A good workflow is small, clear, and tested on real work. It tells Claude what to do and what not to do.",
      },
      {
        question: "Can different projects use different versions?",
        answer:
          "Yes. AIPM packages have versions, so projects can update when they are ready.",
      },
    ],
  },
  {
    slug: "package-mcp-server-setup",
    title: "How to Package MCP Server Setup",
    h1: "How do you package MCP server setup?",
    description:
      "Learn how to document MCP server setup so teams can install the same AI tool workflow without sharing secrets.",
    answer:
      "Package the public MCP setup notes, usage rules, and examples. Keep private tokens and secret values outside the package.",
    keywords: ["package MCP server setup", "MCP server setup", "MCP config", "AIPM MCP"],
    sections: [
      {
        title: "Separate public setup from secrets",
        body:
          "A package can explain which MCP server to use and how the assistant should use it. It should not include real secret values.",
      },
      {
        title: "Explain when to use the server",
        body:
          "Tell the assistant what the MCP server is for. Also say when not to use it, especially if it can access private systems.",
      },
      {
        title: "Give users a safe checklist",
        body:
          "A good MCP package gives users a short checklist. It says what to install, which settings to add, and how to test the connection.",
      },
    ],
    steps: [
      "Write what the MCP server does.",
      "List config files that are safe to share.",
      "List private values without including the values.",
      "Add a simple test command or check.",
      "Publish the safe setup notes as a package.",
    ],
    faqs: [
      {
        question: "Can I publish MCP tokens in a package?",
        answer:
          "No. Publish instructions, not secret values. Users should add their own tokens locally.",
      },
      {
        question: "Why package MCP setup at all?",
        answer:
          "It keeps the setup consistent, so every project does not need to rebuild the same notes from scratch.",
      },
    ],
  },
  {
    slug: "aipm-vs-copying-prompts",
    title: "AIPM vs Copying Prompts Manually",
    h1: "Why use AIPM instead of copying prompts manually?",
    description:
      "Compare AIPM with manual prompt copying and learn when a package manager is worth using.",
    answer:
      "Manual copying is fine for one quick prompt. AIPM is better when prompts, skills, rules, or setup files need to be reused, reviewed, and updated.",
    keywords: ["AIPM vs prompts", "copy prompts manually", "AI prompt management", "AI package manager"],
    sections: [
      {
        title: "Manual copying is fast at first",
        body:
          "Copying a prompt is easy when one person needs it once. The problem starts when many people copy different versions.",
      },
      {
        title: "AIPM gives the workflow a version",
        body:
          "A package has a name and version. That makes it easier to know which workflow a project uses.",
      },
      {
        title: "Teams need review and updates",
        body:
          "When a shared AI workflow changes, teammates should be able to review it. A package makes that change visible.",
      },
    ],
    steps: [
      "Use manual copying for a one-time experiment.",
      "Use project files when the prompt matters to one repo.",
      "Use AIPM when the workflow is reused across projects.",
      "Publish a new package version when the workflow changes.",
      "Update projects when the team is ready.",
    ],
    faqs: [
      {
        question: "Is AIPM always needed?",
        answer:
          "No. AIPM is useful when the workflow is shared, repeated, or important enough to review.",
      },
      {
        question: "What is the main benefit over copy-paste?",
        answer:
          "AIPM gives reusable AI setup a name, version, install command, and review path.",
      },
    ],
  },
  {
    slug: "ai-agent-configuration-files",
    title: "AI Agent Configuration Files Explained",
    h1: "What are AI agent configuration files?",
    description:
      "A practical guide to AGENTS.md, CLAUDE.md, Cursor rules, MCP config, skills, and other files used by AI coding agents.",
    answer:
      "AI agent configuration files are project files that tell coding agents how to work in a repo. They can define rules, workflows, tools, memory, skills, and MCP server setup.",
    keywords: [
      "AI agent configuration files",
      "coding agent configuration",
      "AGENTS.md",
      "CLAUDE.md",
      "Cursor rules",
      "MCP config",
    ],
    sections: [
      {
        title: "The problem developers hit",
        body:
          "AI coding tools use many setup files. A project may use AGENTS.md, CLAUDE.md, Cursor rules, MCP files, skill folders, and special commands. Without one clear system, the files may stop matching each other.",
      },
      {
        title: "The files have different jobs",
        body:
          "Context files explain the repo. Rules guide behavior. Skills package repeatable workflows. MCP config connects the agent to tools. A package manager helps install the right files in the right places.",
      },
      {
        title: "Why AIPM helps",
        body:
          "AIPM lets teams package these files with a name and version. That makes AI agent setup easier to review, reuse, and update across repos.",
      },
    ],
    steps: [
      "List the AI tools your repo supports.",
      "Find the config files each tool reads.",
      "Move shared instructions into one reviewed source.",
      "Keep tool-specific files small and clear.",
      "Package reusable setup with AIPM.",
    ],
    faqs: [
      {
        question: "Are AI agent configuration files code?",
        answer:
          "They are not normal app code, but they affect how work is done. Treat them like project config and review them in Git.",
      },
      {
        question: "Which file should a team start with?",
        answer:
          "Start with one shared instruction file for the repo, then add tool-specific files only when needed.",
      },
    ],
  },
  {
    slug: "agents-md-vs-claude-md-vs-cursor-rules",
    title: "AGENTS.md vs CLAUDE.md vs Cursor Rules",
    h1: "What is the difference between AGENTS.md, CLAUDE.md, and Cursor rules?",
    description:
      "Compare AGENTS.md, CLAUDE.md, and Cursor rules so developers can choose the right instruction files for AI coding agents.",
    answer:
      "AGENTS.md is a shared instruction file for coding agents. CLAUDE.md is mainly for Claude Code. Cursor rules are mainly for Cursor. Teams often use one shared source plus small tool-specific files.",
    keywords: [
      "AGENTS.md vs CLAUDE.md",
      "CLAUDE.md vs Cursor rules",
      "AGENTS.md Cursor",
      "AI coding agent instructions",
    ],
    sections: [
      {
        title: "AGENTS.md is the shared layer",
        body:
          "AGENTS.md gives coding agents a predictable place to read repo instructions. It is useful when a team wants one common file for agent behavior.",
      },
      {
        title: "CLAUDE.md is for Claude Code",
        body:
          "CLAUDE.md is useful when a repo has Claude Code-specific setup. It can include commands, project notes, and expectations that matter for Claude workflows.",
      },
      {
        title: "Cursor rules are for Cursor",
        body:
          "Cursor rules guide Cursor inside the editor. They are useful for file patterns, coding style, review behavior, and project-specific rules.",
      },
    ],
    steps: [
      "Put shared repo rules in one main instruction file.",
      "Add CLAUDE.md only for Claude-specific behavior.",
      "Add Cursor rules only for Cursor-specific behavior.",
      "Keep duplicated text short.",
      "Package reusable rules with AIPM when several repos need them.",
    ],
    faqs: [
      {
        question: "Should I copy the same rules into every file?",
        answer:
          "No. The copies may stop matching each other. Keep one main file and add short notes only when a specific AI tool needs them.",
      },
      {
        question: "Can AIPM install these files?",
        answer:
          "Yes. An AIPM package can include a different file for each AI tool. AIPM puts each file in the right project folder.",
      },
    ],
  },
  {
    slug: "cursor-rules-best-practices",
    title: "Cursor Rules Best Practices for Teams",
    h1: "What are the best practices for Cursor rules?",
    description:
      "A developer guide to writing Cursor rules that are clear, reviewable, and reusable across projects.",
    answer:
      "Good Cursor rules are short and clear. Keep them in Git so the team can review them. Package a rule when several projects need it.",
    keywords: ["Cursor rules best practices", "Cursor rules", ".cursor rules", "Cursor AI rules", "AIPM Cursor"],
    sections: [
      {
        title: "Keep rules small",
        body:
          "A rule should explain one behavior. Large rule files are harder to review and easier for an AI assistant to misunderstand.",
      },
      {
        title: "Use Git review",
        body:
          "Cursor rules can change generated code. Review rule changes like you review lint rules, tests, or build config.",
      },
      {
        title: "Package rules that repeat",
        body:
          "A rule may be useful in many projects. Package it with AIPM so people do not need to copy it by hand.",
      },
    ],
    steps: [
      "Write one rule per job.",
      "Name files by task or code area.",
      "Avoid secrets and private customer data.",
      "Review changes in pull requests.",
      "Publish shared rules as AIPM packages.",
    ],
    faqs: [
      {
        question: "Should Cursor rules live in Git?",
        answer:
          "Yes. If a rule affects project work, the team should be able to review and change it in Git.",
      },
      {
        question: "When should I package a Cursor rule?",
        answer:
          "Package it when the same rule is useful in more than one repo or team.",
      },
    ],
  },
  {
    slug: "claude-code-skills-guide",
    title: "Claude Code Skills Guide for Developers",
    h1: "How do Claude Code skills work?",
    description:
      "Learn what Claude Code skills are, when to use them, and how AIPM can help teams share reusable skills.",
    answer:
      "Claude Code skills are reusable instruction packages for Claude workflows. They help Claude do a specific job, such as review code, write tests, or update docs.",
    keywords: ["Claude Code skills", "Claude skills", "Claude Code skill package", "AIPM Claude Code"],
    sections: [
      {
        title: "Skills are for repeatable work",
        body:
          "Use a skill when the same task happens often. Good examples are code review, issue triage, release notes, test writing, and migration steps.",
      },
      {
        title: "A skill should be focused",
        body:
          "A small skill is easier to trust. It should say what input it needs, what output to produce, and what limits to follow.",
      },
      {
        title: "AIPM helps distribute skills",
        body:
          "AIPM gives each skill a name and version number. This helps a team install the same skill in many projects.",
      },
    ],
    steps: [
      "Pick one repeated Claude Code task.",
      "Write the instructions and expected output.",
      "Add examples from real project work.",
      "Test the skill in one repo.",
      "Publish and install it with AIPM when it is ready.",
    ],
    faqs: [
      {
        question: "Is a Claude Code skill just a prompt?",
        answer:
          "It can include prompt-like instructions, but it is packaged as a reusable workflow instead of a one-time chat message.",
      },
      {
        question: "Should every workflow become a skill?",
        answer:
          "No. Start with tasks that repeat and have a clear output format.",
      },
    ],
  },
  {
    slug: "mcp-json-guide-cursor-claude",
    title: "mcp.json Guide for Cursor and Claude Code",
    h1: "How should teams manage mcp.json for Cursor and Claude Code?",
    description:
      "A practical guide to managing MCP config files safely across Cursor, Claude Code, and team repos.",
    answer:
      "Teams should keep safe MCP config and setup notes in Git, keep secret values local, and package reusable MCP instructions with AIPM.",
    keywords: ["mcp.json", "MCP config", "Cursor MCP", "Claude Code MCP", "MCP server setup"],
    sections: [
      {
        title: "MCP config connects agents to tools",
        body:
          "MCP lets AI coding agents use external tools and data sources. That makes setup powerful, but it also means config needs review.",
      },
      {
        title: "Do not commit secrets",
        body:
          "A safe package can explain which server to use and which environment variables are needed. It should not include real tokens, passwords, or private values.",
      },
      {
        title: "Use packages for repeated setup",
        body:
          "Several projects may need the same MCP setup. Put the safe settings and notes in an AIPM package. Each project can add its own private values.",
      },
    ],
    steps: [
      "Write what the MCP server does.",
      "List the safe config files.",
      "List required environment variables without values.",
      "Add a test step so users can confirm setup.",
      "Package reusable setup with AIPM.",
    ],
    faqs: [
      {
        question: "Can mcp.json be shared in Git?",
        answer:
          "Yes, if it does not include secrets. Keep private values in local environment variables or ignored files.",
      },
      {
        question: "Why use AIPM for MCP setup?",
        answer:
          "AIPM helps teams install the same safe setup notes and instructions across many repos without copying them by hand.",
      },
    ],
  },
  {
    slug: "cursor-rules-vs-agents-md",
    title: "Cursor Rules vs AGENTS.md: Which Should You Use?",
    h1: "Should you use Cursor rules or AGENTS.md?",
    description:
      "Learn the simple difference between Cursor project rules and AGENTS.md. See when a team should use one or both.",
    answer:
      "Use AGENTS.md for simple instructions that different AI coding tools can read. Use Cursor project rules for instructions meant only for Cursor or only for certain files. A team can use both without copying every rule twice.",
    keywords: ["Cursor rules vs AGENTS.md", "AGENTS.md Cursor", "Cursor project rules", ".cursor rules"],
    sections: [
      {
        title: "AGENTS.md is the simple shared option",
        body:
          "AGENTS.md is a normal text file. It can list commands, writing rules, and test steps for the whole project. People and different AI coding tools can read it.",
      },
      {
        title: "Cursor rules give you more control",
        body:
          "Cursor project rules live in a folder named .cursor/rules. You can make a separate rule for each task or type of file. For example, website files and database files can follow different rules.",
      },
      {
        title: "Use both with one clear owner",
        body:
          "Keep shared repo facts in AGENTS.md. Put only Cursor-specific behavior in Cursor rules. If the same setup is used in many repos, package the files with AIPM so each repo gets the same reviewed version.",
      },
    ],
    steps: [
      "Write the instructions that every coding agent needs.",
      "Put those shared instructions in AGENTS.md.",
      "Add Cursor project rules only for Cursor or for certain types of files.",
      "Review both files in Git and remove repeated text.",
      "Package the reusable setup with AIPM for other repos.",
    ],
    faqs: [
      {
        question: "Does Cursor read AGENTS.md?",
        answer:
          "Yes. Cursor supports a root-level AGENTS.md file as a simple alternative to project rules.",
      },
      {
        question: "Are .cursorrules files still recommended?",
        answer:
          "No. Cursor marks .cursorrules as legacy. New projects should use project rules in .cursor/rules or a simple AGENTS.md file.",
      },
    ],
    sources: [
      { label: "Cursor documentation: Rules", href: "https://docs.cursor.com/context/rules-for-ai" },
    ],
  },
  {
    slug: "claude-code-skills-vs-slash-commands",
    title: "Claude Code Skills vs Slash Commands",
    h1: "What is the difference between Claude Code skills and slash commands?",
    description:
      "Learn how Claude Code skills and slash commands work together. See which one to use for a new task.",
    answer:
      "Claude Code now treats a custom slash command as a skill. Old command files still work. For a new reusable task, create a SKILL.md file in the .claude/skills folder. You can start a skill with a slash command, or Claude can choose it when it matches your task.",
    keywords: [
      "Claude Code skills vs slash commands",
      "Claude Code custom commands",
      "Claude Code SKILL.md",
      ".claude skills",
    ],
    sections: [
      {
        title: "The old formats now work together",
        body:
          "A command file and a skill can both create a slash command. You do not need to change old command files now. Use the skill format for new tasks.",
      },
      {
        title: "Skills can hold more than one file",
        body:
          "A skill starts with a SKILL.md file. It can also include examples, small programs, and helpful documents. Claude reads these files only when it needs the skill.",
      },
      {
        title: "Package skills when teams reuse them",
        body:
          "Keep a one-repo skill in that repo. When several repos need it, use AIPM to give it a name, version, and repeatable install command.",
      },
    ],
    steps: [
      "Keep working custom command files if they still do the job.",
      "Create new workflows in .claude/skills with a SKILL.md file.",
      "Write a clear name and description so Claude knows when to use the skill.",
      "Test both direct slash use and automatic use.",
      "Publish shared skills with AIPM.",
    ],
    faqs: [
      {
        question: "Do old Claude Code custom commands still work?",
        answer:
          "Yes. Files in .claude/commands still work. Claude Code has merged custom commands into the Skills model.",
      },
      {
        question: "Can a skill be called with a slash command?",
        answer:
          "Yes. A skill can be called directly with its slash name, and Claude can also choose it when the task matches.",
      },
    ],
    sources: [
      {
        label: "Claude Code documentation: Extend Claude with skills",
        href: "https://code.claude.com/docs/en/slash-commands",
      },
    ],
  },
  {
    slug: "share-ai-coding-agent-instructions",
    title: "How to Share AI Coding Agent Instructions Across Repos",
    h1: "How do you share AI coding agent instructions across repos?",
    description:
      "Learn how to share AI instructions across projects without keeping many different copies.",
    answer:
      "Put shared instructions in one AIPM package. Install that package in each project. Keep details that belong to only one project in that project. This gives every project the same basic rules without manual copying.",
    keywords: [
      "share AI coding agent instructions",
      "share AGENTS.md across repos",
      "reuse CLAUDE.md",
      "sync Cursor rules",
    ],
    sections: [
      {
        title: "Copied files soon become different",
        body:
          "A copied instruction does not get later updates. After some time, each project may have different rules even when the team expects them to match.",
      },
      {
        title: "Split shared and local instructions",
        body:
          "Shared instructions should cover common review, testing, security, and documentation work. Repo-specific files should cover local commands, architecture, and limits.",
      },
      {
        title: "Install a reviewed version",
        body:
          "An AIPM package can include files for Cursor and Claude targets. Each repo installs a named version, so updates are visible and can be reviewed before they spread.",
      },
    ],
    steps: [
      "List the instructions repeated in several repos.",
      "Remove private and repo-specific details.",
      "Create target files for the AI tools your team uses.",
      "Publish the shared files as an AIPM package.",
      "Install and update the package through normal Git review.",
    ],
    faqs: [
      {
        question: "Should every repo use exactly the same instructions?",
        answer:
          "No. Share the common base and keep local commands, architecture, and product rules in each repo.",
      },
      {
        question: "How do teams keep instructions the same?",
        answer:
          "Keep the shared instructions in one package with a version number. Update each project from that package instead of copying files by hand.",
      },
    ],
    sources: [
      { label: "Cursor documentation: Rules", href: "https://docs.cursor.com/context/rules-for-ai" },
      {
        label: "Claude Code documentation: Memory files",
        href: "https://code.claude.com/docs/en/memory",
      },
    ],
  },
  {
    slug: "manage-ai-prompts-in-git",
    title: "How to Manage AI Prompts in Git",
    h1: "What is the best way to manage AI prompts in Git?",
    description:
      "Learn how to save, check, test, and share important AI prompts in a project folder.",
    answer:
      "Store important prompts as named files, explain their input and output, review changes in pull requests, and give shared prompts a version. Package prompts that are used in several repos instead of copying them.",
    keywords: ["manage AI prompts in Git", "prompt version control", "AI prompts GitHub", "version prompts"],
    sections: [
      {
        title: "Treat important prompts like project settings",
        body:
          "A prompt can change generated code, tests, or documents. Put important prompts near the project, use clear file names, and let the team review changes.",
      },
      {
        title: "Record what good output means",
        body:
          "A prompt file should say when to use it and what information it needs. It should also describe the result. Add a small example when possible.",
      },
      {
        title: "Use packages across repositories",
        body:
          "Git handles history inside one repo. AIPM adds a package name, version, and install command when the same prompt workflow is needed in several repos.",
      },
    ],
    steps: [
      "Move repeated prompts out of chat history.",
      "Give each prompt one clear job and file name.",
      "Add expected input, output, and a small example.",
      "Review prompt changes in pull requests.",
      "Package prompts that need to stay aligned across repos.",
    ],
    faqs: [
      {
        question: "Can Git version AI prompts?",
        answer:
          "Yes. Git records prompt changes, authors, review comments, and earlier versions just like other text files.",
      },
      {
        question: "When is a prompt package useful?",
        answer:
          "Use a package when a prompt is important, reused by a team, or installed in more than one repo.",
      },
    ],
  },
  {
    slug: "mcp-server-config-best-practices",
    title: "MCP Server Configuration Best Practices",
    h1: "What are the best practices for MCP server configuration?",
    description:
      "A simple checklist for setting up an MCP server safely and using the same setup in more than one project.",
    answer:
      "Do not put passwords or private tokens in MCP settings files. Give each server only the access it needs. Write down the private settings people must add, test the connection, and review shared files in Git. Package only files that are safe to share.",
    keywords: [
      "MCP server configuration best practices",
      "MCP config security",
      "mcp.json best practices",
      "MCP server setup",
    ],
    sections: [
      {
        title: "Keep secret values local",
        body:
          "Config can name the environment variables a server needs, but it should not contain real tokens or passwords. Use local environment settings or a secret manager for values.",
      },
      {
        title: "Limit access and explain the purpose",
        body:
          "Add only the servers a project needs. Explain what each server can see and when the AI should use it. Also explain which actions need approval from a person.",
      },
      {
        title: "Make setup repeatable",
        body:
          "Store safe config and test steps in Git. If many repos need the same server, package the public setup with AIPM while each user supplies private values locally.",
      },
    ],
    steps: [
      "Choose the smallest server access that completes the job.",
      "Move tokens and passwords into environment variables.",
      "Document the server purpose and required variables.",
      "Test a safe read action before allowing write actions.",
      "Package only public config and setup instructions.",
    ],
    faqs: [
      {
        question: "Should mcp.json contain API keys?",
        answer:
          "No. Refer to environment variable names and keep the real values outside files that can be committed or published.",
      },
      {
        question: "Can MCP configuration be shared across repos?",
        answer:
          "Yes. Share safe server definitions, setup notes, and tests. Keep secrets and repo-specific access choices local.",
      },
    ],
    sources: [
      {
        label: "Model Context Protocol documentation: Connect to local MCP servers",
        href: "https://modelcontextprotocol.io/docs/develop/connect-local-servers",
      },
      { label: "Cursor documentation: Model Context Protocol", href: "https://docs.cursor.com/context/model-context-protocol" },
    ],
  },
] as const;

export function getSeoGuide(slug: string): SeoGuide | null {
  return SEO_GUIDES.find((guide) => guide.slug === slug) ?? null;
}
