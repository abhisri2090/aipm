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
          "Yes, if the package includes files for each supported target. AIPM can install target-specific files.",
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
          "A useful prompt package should say when to use it, what input it needs, what output it should create, and which AI tools it supports.",
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
          "A team may need server names, config notes, environment variables, usage rules, and safety notes. These details are easy to miss when they are copied by hand.",
      },
      {
        title: "A package gives the setup a home",
        body:
          "A package can explain what the MCP server does, when to use it, what secrets are needed, and what files should be installed.",
      },
      {
        title: "AIPM can grow with target support",
        body:
          "AIPM already installs target-specific AI files. MCP bundles are a natural next step because they also need clear, repeatable setup.",
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
      "Put important prompts in project files, commit them to Git, and publish reusable prompts as versioned packages.",
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
      "Write the Claude workflow as a skill file, add examples, publish it with AIPM, and install it into projects that need the same workflow.",
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
] as const;

export function getSeoGuide(slug: string): SeoGuide | null {
  return SEO_GUIDES.find((guide) => guide.slug === slug) ?? null;
}
