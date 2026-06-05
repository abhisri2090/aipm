#!/usr/bin/env node
/* global console */
import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const webRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const appRoot = join(webRoot, "app");

const orderedReplacements = [
  ['className="page-header compact-page-header"', "className={cn(shell.pageHeader, shell.compactPageHeader)}"],
  ['className="page-header"', "className={shell.pageHeader}"],
  ['className="button secondary"', "className={cn(shell.button, shell.secondary)}"],
  ['className="button"', "className={shell.button}"],
  ['className="text-link"', "className={shell.textLink}"],
  ['className="doc wide-doc"', "className={cn(docs.doc, docs.wideDoc)}"],
  ['className="panel step-card publisher-panel"', "className={cn(shell.panel, cards.stepCard, shell.publisherPanel)}"],
  ['className="panel step-card"', "className={cn(shell.panel, cards.stepCard)}"],
  ['className="avatar avatar-large"', "className={cn(dash.avatar, dash.avatarLarge)}"],
  ['className="hero"', "className={home.hero}"],
  ['className="eyebrow"', "className={shell.eyebrow}"],
  ['className="lede"', "className={shell.lede}"],
  ['className="actions"', "className={shell.actions}"],
  ['className="panel-section"', "className={shell.panelSection}"],
  ['className="section-heading"', "className={shell.sectionHeading}"],
  ['className="detail-grid"', "className={shell.detailGrid}"],
  ['className="publisher-panel"', "className={shell.publisherPanel}"],
  ['className="muted"', "className={shell.muted}"],
  ['className="notice"', "className={shell.notice}"],
  ['className="panel"', "className={shell.panel}"],
  ['className="guide-grid"', "className={cards.guideGrid}"],
  ['className="guide-card"', "className={cards.guideCard}"],
  ['className="doc"', "className={docs.doc}"],
  ['className="check-list"', "className={docs.checkList}"],
  ['className="flow-list"', "className={docs.flowList}"],
  ['className="definition-list"', "className={docs.definitionList}"],
  ['className="steps"', "className={cards.steps}"],
  ['className="step-card"', "className={cards.stepCard}"],
  ['className="step-number"', "className={cards.stepNumber}"],
  ['className="example-grid"', "className={cards.exampleGrid}"],
  ['className="example-card"', "className={cards.exampleCard}"],
  ['className="example-list"', "className={cards.exampleList}"],
  ['className="target-grid"', "className={cards.targetGrid}"],
  ['className="target-card"', "className={cards.targetCard}"],
  ['className="practice-grid"', "className={cards.practiceGrid}"],
  ['className="practice-card"', "className={cards.practiceCard}"],
  ['className="thanks-list"', "className={cards.thanksList}"],
  ['className="thanks-card"', "className={cards.thanksCard}"],
  ['className="thanks-card-link"', "className={cn(cards.thanksCardLink, shell.textLink)}"],
  ['className="source-list"', "className={cards.sourceList}"],
  ['className="source-card"', "className={cards.sourceCard}"],
  ['className="roadmap-list"', "className={cards.roadmapList}"],
  ['className="roadmap-card"', "className={cards.roadmapCard}"],
  ['className="changelog-list"', "className={cards.changelogList}"],
  ['className="changelog-card"', "className={cards.changelogCard}"],
  ['className="glossary-list"', "className={cards.glossaryList}"],
  ['className="glossary-card"', "className={cards.glossaryCard}"],
  ['className="template-grid"', "className={cards.templateGrid}"],
  ['className="template-card"', "className={cards.templateCard}"],
  ['className="faq-list"', "className={cards.faqList}"],
];

function importPath(file) {
  const rel = relative(dirname(file), join(webRoot, "lib", "page-styles.ts")).replace(/\\/g, "/");
  return rel.startsWith(".") ? rel.replace(/\.ts$/, "") : `./${rel.replace(/\.ts$/, "")}`;
}

const importRegex = /from ["'].*page-styles["'];/;

for (const file of globSync("**/*.tsx", { cwd: appRoot }).map((p) => join(appRoot, p))) {
  let source = readFileSync(file, "utf8");
  if (!source.includes('className="') && !source.includes("className={'")) continue;

  for (const [from, to] of orderedReplacements) {
    source = source.split(from).join(to);
  }

  if (source.includes("shell.") || source.includes("cards.") || source.includes("docs.") || source.includes("home.") || source.includes("dash.")) {
    if (!importRegex.test(source)) {
      const firstImport = source.indexOf("import ");
      const importStatement = `import { cards, cn, dash, docs, home, shell } from "${importPath(file)}";\n`;
      source =
        firstImport >= 0
          ? `${source.slice(0, firstImport)}${importStatement}${source.slice(firstImport)}`
          : `${importStatement}${source}`;
    }
  }

  writeFileSync(file, source);
}

console.log("Migrated app page class names.");
