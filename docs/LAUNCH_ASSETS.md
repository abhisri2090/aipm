# AIPM Launch Assets

Updated: 3 September 2026

Use these drafts as the source for launch posts. Keep the final posts honest and answer questions in your own words.

## One-line Description

AIPM is an open-source package manager and registry for reusable AI skills, prompts, rules, and tool files.

## Product Hunt

### Name

AIPM

### Tagline

Install reusable AI skills like packages

### Short description

AIPM helps you find, review, install, and share reusable instructions for AI coding tools. It works with tools such as Claude Code and Cursor. You can inspect every public skill before adding it to a project.

### First maker comment

Hi Product Hunt,

I built AIPM because useful AI instructions were spread across repositories, files, and chat messages. It was hard to find the right version, review the source, and share the same setup with a team.

AIPM gives these files a package name and version. You can search the public registry, read the source, copy one install command, and use the same skill in a supported AI tool.

AIPM is open source. I would value feedback on the install flow, the package pages, and which AI tools you want us to support next.

### Gallery order

1. Skills directory with search and filters.
2. A complete skill page with source, publisher, and install command.
3. Terminal showing a successful install.
4. Prompt directory and one prompt page.
5. Short product demo video.

## Show HN

### Title

Show HN: AIPM, an open-source package manager for reusable AI agent skills

### Post

I built AIPM to make reusable AI instructions easier to find, review, version, and install.

Many useful skills live as Markdown files in separate repositories. Copying them by hand makes version changes and team setup difficult. AIPM gives each skill a package name and version, keeps a link to its source, and installs it with one command.

It currently supports Claude Code and Cursor project folders. The registry and all application code are open source.

Website: https://www.aipm-registry.com

GitHub: https://github.com/abhisri2090/aipm

I would especially like feedback on the package format, source checks, and support for more AI tools.

## DEV or Hashnode Article

### Title

How to manage Claude Code and Cursor skills like packages

### Summary

AI coding tools become more useful when they have clear instructions for repeated work. These instructions are often called skills, rules, or agent files. This guide shows how to install and share them without copying files by hand.

### Article outline

1. Explain an AI skill in one short paragraph.
2. Show the problem with copying instruction files by hand.
3. Install the AIPM CLI.
4. Find one public skill and inspect its source.
5. Install it for Claude Code.
6. Install it for Cursor.
7. Explain versions, publisher details, and integrity values.
8. Show how a maintainer can publish a skill and add the README badge.
9. Link to the full install and creation guides.

### Commands

```bash
npm install -g @aipm-registry/cli
aipm init --target claude
aipm add @anthropics/frontend-design@1.0.0
```

Useful links:

- https://www.aipm-registry.com/guides/how-to-install-claude-code-skills
- https://www.aipm-registry.com/guides/how-to-install-cursor-skills
- https://www.aipm-registry.com/guides/how-to-create-agent-skill

## X Thread

1. I built AIPM, an open-source package manager for reusable AI skills. It helps you find, review, version, and install skill files instead of copying them by hand.
2. A skill is a small set of instructions that helps an AI tool do one job in a repeatable way. AIPM currently supports Claude Code and Cursor project folders.
3. Every public package page shows the source, publisher details, version, integrity value, and exact install command.
4. Install the CLI, initialize a project, and add a skill: `npm install -g @aipm-registry/cli`, `aipm init --target claude`, then `aipm add @scope/name@version`.
5. The full project is open source: https://github.com/abhisri2090/aipm. Browse the registry: https://www.aipm-registry.com/skills

## Community Post

I am building AIPM, an open-source registry and package manager for reusable AI skills. It lets people inspect a skill and its source, then install a fixed version into a Claude Code or Cursor project.

I am looking for practical feedback, not promotion. Does the package page show enough information before installation? Which file format or tool should be supported next?

Website: https://www.aipm-registry.com

Source: https://github.com/abhisri2090/aipm

## Publisher Outreach

### Orchestra Research

Hi Orchestra Research team, I am building AIPM, an open registry and package manager for reusable Agent Skills. I added an imported listing for your public AI research skill because it gives researchers a clear, repeatable workflow. Would you be open to reviewing the listing and install flow? You can claim it under your own account if it is useful. I will not imply that you endorse AIPM.

### Matt Pocock

Hi Matt, I am building AIPM, an open registry and package manager for reusable Agent Skills. Several public skills from your repository are listed because they turn practical engineering work into small, reusable instructions. Would you be open to checking one package page and the install flow? You can claim the listings if they are useful. I will not imply endorsement.

### Murat Can Koylan

Hi Murat, I am building AIPM, an open registry and package manager for reusable Agent Skills. Your context-engineering collection is a strong example of skills that people may want to install and update as versions. Would you be open to reviewing AIPM's package format or allowing one small import test? I will link to the original source and will not imply endorsement.

## Reply Guide

- Answer technical questions directly.
- Say when a feature is planned but not built.
- Never call an imported publisher verified until they claim the account.
- Ask for one concrete example when someone reports a problem.
- Thank people for useful criticism without arguing about votes or rankings.
