"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api-client";
import { compressImage } from "../lib/compress-image";
import { PROMPT_LANGUAGES } from "../lib/languages";
import {
  PROMPT_CATEGORIES,
  PROMPT_INPUT_TYPES,
  PROMPT_OUTPUT_TYPES,
  displayPromptType,
  type PromptDetail,
  type PromptVariable,
} from "../lib/prompts";
import styles from "./prompt-submission-form.module.css";
import { PromptPreparationTools } from "./prompt-preparation-tools";
import { SearchableLanguageSelect } from "./searchable-language-select";
import type { PromptFormAutofill } from "../lib/prompt-preparation";
import shell from "../app/page-shell.module.css";

type Me = {
  id: string;
  username: string;
  name: string | null;
};

type Org = {
  slug: string;
  name: string;
  role: "owner" | "admin" | "member" | "viewer";
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function extractVariableNames(prompt: string): string[] {
  return [...prompt.matchAll(/{{\s*([a-z][a-z0-9_]*)\s*}}/gi)]
    .map((match) => match[1] ?? "")
    .filter(
      (name, index, names) =>
        Boolean(name) &&
        names.findIndex((item) => item.toLowerCase() === name.toLowerCase()) === index,
    );
}

function ChoiceGroup({
  label,
  values,
  selected,
  onChange,
}: {
  label: string;
  values: readonly string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset className={styles.choiceGroup}>
      <legend>{label}</legend>
      <div className={styles.choices}>
        {values.map((value) => (
          <label key={value}>
            <input
              type="checkbox"
              checked={selected.includes(value)}
              onChange={(event) =>
                onChange(
                  event.target.checked
                    ? [...selected, value]
                    : selected.filter((item) => item !== value),
                )
              }
            />
            <span>{displayPromptType(value)}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function PromptSubmissionForm() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [accountState, setAccountState] = useState<"loading" | "ready" | "login">(
    "loading",
  );
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [summary, setSummary] = useState("");
  const [promptText, setPromptText] = useState("");
  const [category, setCategory] = useState("Productivity");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [inputTypes, setInputTypes] = useState<string[]>(["text"]);
  const [outputTypes, setOutputTypes] = useState<string[]>(["text"]);
  const [testedModels, setTestedModels] = useState("");
  const [effort, setEffort] = useState("quick");
  const [publisher, setPublisher] = useState("personal");
  const [variables, setVariables] = useState<PromptVariable[]>([]);
  const [exampleInput, setExampleInput] = useState("");
  const [exampleOutput, setExampleOutput] = useState("");
  const [usageNotes, setUsageNotes] = useState("");
  const [language, setLanguage] = useState("English");
  const [license, setLicense] = useState("CC BY 4.0");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sampleImage, setSampleImage] = useState<File | null>(null);
  const [sampleImageAlt, setSampleImageAlt] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    Promise.all([
      api<Me>("/v1/me", undefined, { silent: true }),
      api<{ orgs: Org[] }>("/v1/orgs", undefined, { silent: true }),
    ])
      .then(([user, orgData]) => {
        setMe(user);
        setOrgs(orgData.orgs.filter((org) => org.role !== "viewer"));
        setAccountState("ready");
      })
      .catch(() => setAccountState("login"));
  }, []);

  useEffect(() => {
    const names = extractVariableNames(promptText);
    setVariables((current) =>
      names.map(
        (name) =>
          current.find(
            (variable) => variable.name.toLowerCase() === name.toLowerCase(),
          ) ?? {
            name,
            description: "",
            example: "",
            required: true,
          },
      ),
    );
  }, [promptText]);

  const imageOutput = outputTypes.includes("image");
  const publisherLabel = useMemo(() => {
    if (publisher === "personal") return me ? `@${me.username}` : "Personal profile";
    return `@${publisher}`;
  }, [me, publisher]);

  function applyFormDetails(details: PromptFormAutofill, preparedPrompt: string) {
    setPromptText(preparedPrompt);
    if (details.title !== undefined) {
      setTitle(details.title);
    }
    if (details.slug !== undefined) {
      const normalizedSlug = slugify(details.slug);
      if (normalizedSlug) {
        setSlug(normalizedSlug);
        setSlugEdited(true);
      } else if (!slugEdited && details.title !== undefined) {
        setSlug(slugify(details.title));
      }
    } else if (!slugEdited && details.title !== undefined) {
      setSlug(slugify(details.title));
    }
    if (details.summary !== undefined) setSummary(details.summary);
    if (details.category !== undefined) setCategory(details.category);
    if (details.tags !== undefined) setTags(details.tags.slice(0, 10));
    if (details.inputTypes !== undefined) setInputTypes(details.inputTypes);
    if (details.outputTypes !== undefined) setOutputTypes(details.outputTypes);
    if (details.testedModels !== undefined) setTestedModels(details.testedModels.join(", "));
    if (details.effort !== undefined) setEffort(details.effort);
    if (details.variables !== undefined) setVariables(details.variables);
    if (details.exampleInput !== undefined) setExampleInput(details.exampleInput);
    if (details.exampleOutput !== undefined) setExampleOutput(details.exampleOutput);
    if (details.usageNotes !== undefined) setUsageNotes(details.usageNotes);
    if (details.language !== undefined) setLanguage(details.language);
    if (details.license !== undefined) setLicense(details.license);
    if (details.sourceUrl !== undefined) setSourceUrl(details.sourceUrl);
  }

  if (accountState === "loading") {
    return (
      <main>
        <div className={shell.empty}>Loading publisher details…</div>
      </main>
    );
  }

  if (accountState === "login") {
    return (
      <main>
        <section className={shell.pageHeader}>
          <p className={shell.eyebrow}>Prompt publishing</p>
          <h1>Sign in to list a prompt.</h1>
          <p className={shell.lede}>
            Every prompt is connected to a publisher profile so readers know who created
            it.
          </p>
          <div className={shell.actions}>
            <Link className={shell.button} href="/login">
              Sign in
            </Link>
            <Link className={shell.textLink} href="/prompts">
              Back to prompts
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <p className={shell.eyebrow}>Prompt publishing</p>
          <h1>List a prompt.</h1>
          <p className={shell.lede}>
            Share the exact prompt, document what it needs, and show people what a good
            result looks like.
          </p>
        </div>
        <div className={styles.publisherSummary}>
          <span>Publishing as</span>
          <strong>{publisherLabel}</strong>
          <small>Publisher details will appear on the prompt page.</small>
        </div>
      </section>

      <form
        className={styles.formLayout}
        onSubmit={async (event) => {
          event.preventDefault();
          setStatus("");
          if (imageOutput && !sampleImage) {
            setStatus("Add a sample image before publishing an image-output prompt.");
            return;
          }
          if (tags.length === 0) {
            setStatus("Add at least one tag.");
            return;
          }
          if (
            variables.some(
              (variable) => !variable.description.trim() || !variable.example.trim(),
            )
          ) {
            setStatus("Add a description and example for every prompt variable.");
            return;
          }
          setSubmitting(true);
          setStatus(sampleImage ? "Optimizing sample image…" : "");
          try {
            const uploadImage = sampleImage ? await compressImage(sampleImage) : null;
            const data = {
              title,
              slug,
              summary,
              promptText,
              category,
              tags,
              inputTypes,
              outputTypes,
              testedModels: testedModels
                .split(",")
                .map((model) => model.trim())
                .filter(Boolean),
              effort,
              variables,
              exampleInput,
              exampleOutput,
              usageNotes,
              language,
              license,
              sourceUrl,
              sampleImageAlt,
              orgSlug: publisher === "personal" ? "" : publisher,
            };
            const body = new FormData();
            body.append("data", JSON.stringify(data));
            if (uploadImage) body.append("sampleImage", uploadImage);
            const created = await api<PromptDetail>(
              "/v1/prompts",
              { method: "POST", body },
              { timeoutMs: 20_000 },
            );
            router.push(created.path);
          } catch (error) {
            setStatus(
              error instanceof Error ? error.message : "Could not publish the prompt",
            );
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <div className={styles.formColumn}>
          <section className={styles.formSection}>
            <p className={shell.eyebrow}>1 · Basics</p>
            <h2>Name and describe the prompt</h2>
            <div className={styles.twoColumns}>
              <div>
                <label htmlFor="prompt-title">Title</label>
                <input
                  id="prompt-title"
                  maxLength={100}
                  required
                  value={title}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    if (!slugEdited) setSlug(slugify(event.target.value));
                  }}
                  placeholder="Build my weekly priority plan"
                />
              </div>
              <div>
                <label htmlFor="prompt-slug">URL slug</label>
                <input
                  id="prompt-slug"
                  maxLength={80}
                  pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                  required
                  value={slug}
                  onChange={(event) => {
                    setSlug(slugify(event.target.value));
                    setSlugEdited(true);
                  }}
                  placeholder="weekly-priority-plan"
                />
              </div>
            </div>
            <label htmlFor="prompt-summary">Short description</label>
            <textarea
              id="prompt-summary"
              maxLength={240}
              required
              rows={3}
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="Explain what this prompt helps someone accomplish."
            />
            <div className={styles.threeColumns}>
              <div>
                <label htmlFor="prompt-category">Category</label>
                <select
                  id="prompt-category"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {PROMPT_CATEGORIES.filter((item) => item !== "All").map((item) => (
                    <option key={item}>{item}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="prompt-effort">Effort</label>
                <select
                  id="prompt-effort"
                  value={effort}
                  onChange={(event) => setEffort(event.target.value)}
                >
                  <option value="quick">Quick</option>
                  <option value="guided">Guided</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div>
                <label htmlFor="prompt-language">Language</label>
                <SearchableLanguageSelect
                  id="prompt-language"
                  options={PROMPT_LANGUAGES}
                  value={language}
                  onChange={setLanguage}
                />
              </div>
            </div>
            <label htmlFor="prompt-tags">Tags</label>
            <div className={styles.tagEditor}>
              {tags.map((tag) => (
                <span className={styles.tagChip} key={tag}>
                  {tag}
                  <button
                    aria-label={`Remove ${tag} tag`}
                    type="button"
                    onClick={() => setTags((current) => current.filter((item) => item !== tag))}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                id="prompt-tags"
                value={tagInput}
                onChange={(event) => setTagInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === ",") {
                    event.preventDefault();
                    const nextTags = tagInput
                      .split(",")
                      .map((tag) => tag.trim())
                      .filter(Boolean);
                    setTags((current) => {
                      const existing = new Set(current.map((tag) => tag.toLowerCase()));
                      return [
                        ...current,
                        ...nextTags
                          .filter((tag) => {
                            const key = tag.toLowerCase();
                            if (existing.has(key)) return false;
                            existing.add(key);
                            return true;
                          })
                          .slice(0, Math.max(0, 10 - current.length)),
                      ];
                    });
                    setTagInput("");
                  } else if (event.key === "Backspace" && !tagInput && tags.length > 0) {
                    setTags((current) => current.slice(0, -1));
                  }
                }}
                placeholder={tags.length ? "Add another tag" : "productivity"}
              />
            </div>
            <p className={styles.help}>Press Enter after each tag. Add up to ten tags.</p>
          </section>

          <section className={styles.formSection}>
            <p className={shell.eyebrow}>2 · Prompt</p>
            <h2>Add the prompt people will copy</h2>
            <label htmlFor="prompt-text">Prompt text</label>
            <textarea
              className={styles.promptEditor}
              id="prompt-text"
              maxLength={20_000}
              required
              rows={14}
              value={promptText}
              onChange={(event) => setPromptText(event.target.value)}
              placeholder="Act as a… Use {{topic}} for customizable values."
            />
            <p className={styles.help}>
              Use double braces such as {"{{topic}}"} for values readers should replace.
            </p>
            {variables.length ? (
              <div className={styles.variableEditor}>
                <h3>Detected variables</h3>
                {variables.map((variable, index) => (
                  <article key={variable.name}>
                    <strong>{`{{${variable.name}}}`}</strong>
                    <input
                      aria-label={`Description for ${variable.name}`}
                      required
                      value={variable.description}
                      onChange={(event) =>
                        setVariables((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, description: event.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder="What should the reader provide?"
                    />
                    <input
                      aria-label={`Example for ${variable.name}`}
                      required
                      value={variable.example}
                      onChange={(event) =>
                        setVariables((current) =>
                          current.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, example: event.target.value }
                              : item,
                          ),
                        )
                      }
                      placeholder="Example value"
                    />
                    <label className={styles.requiredToggle}>
                      <input
                        type="checkbox"
                        checked={variable.required}
                        onChange={(event) =>
                          setVariables((current) =>
                            current.map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, required: event.target.checked }
                                : item,
                            ),
                          )
                        }
                      />
                      Required
                    </label>
                  </article>
                ))}
              </div>
            ) : null}
          </section>

          <section className={styles.formSection}>
            <p className={shell.eyebrow}>3 · Inputs and results</p>
            <h2>Set expectations</h2>
            <ChoiceGroup
              label="What does someone provide?"
              values={PROMPT_INPUT_TYPES}
              selected={inputTypes}
              onChange={setInputTypes}
            />
            <ChoiceGroup
              label="What does the prompt produce?"
              values={PROMPT_OUTPUT_TYPES}
              selected={outputTypes}
              onChange={setOutputTypes}
            />
            <label htmlFor="tested-models">Models you tested (optional)</label>
            <input
              id="tested-models"
              value={testedModels}
              onChange={(event) => setTestedModels(event.target.value)}
              placeholder="GPT-5, Claude Sonnet 4.5, Gemini 2.5 Pro"
            />
            <p className={styles.help}>
              Optional. This appears only on the prompt detail page.
            </p>

            {imageOutput ? (
              <div className={styles.imageRequirement}>
                <strong>Image output requires a sample</strong>
                <p>
                  Upload a real result created with this prompt. JPEG, PNG, or WebP;
                  maximum 5 MB.
                </p>
                <label htmlFor="sample-image">Sample image</label>
                <input
                  accept="image/jpeg,image/png,image/webp"
                  id="sample-image"
                  required
                  type="file"
                  onChange={(event) => setSampleImage(event.target.files?.[0] ?? null)}
                />
                <label htmlFor="sample-image-alt">Describe the sample image</label>
                <input
                  id="sample-image-alt"
                  maxLength={240}
                  required
                  value={sampleImageAlt}
                  onChange={(event) => setSampleImageAlt(event.target.value)}
                  placeholder="Vintage travel poster of Kyoto in spring"
                />
              </div>
            ) : null}

            <label htmlFor="example-input">Example input (optional)</label>
            <textarea
              id="example-input"
              maxLength={5000}
              rows={4}
              value={exampleInput}
              onChange={(event) => setExampleInput(event.target.value)}
            />
            <label htmlFor="example-output">Example output or caption (optional)</label>
            <textarea
              id="example-output"
              maxLength={5000}
              rows={4}
              value={exampleOutput}
              onChange={(event) => setExampleOutput(event.target.value)}
            />
          </section>

          <section className={styles.formSection}>
            <p className={shell.eyebrow}>4 · Publisher and reuse</p>
            <h2>Choose who publishes it</h2>
            <label htmlFor="prompt-publisher">Publisher</label>
            <select
              id="prompt-publisher"
              value={publisher}
              onChange={(event) => setPublisher(event.target.value)}
            >
              <option value="personal">Personal · @{me?.username}</option>
              {orgs.map((org) => (
                <option key={org.slug} value={org.slug}>
                  {org.name} · @{org.slug}
                </option>
              ))}
            </select>
            <div className={styles.twoColumns}>
              <div>
                <label htmlFor="prompt-license">Reuse terms</label>
                <select
                  id="prompt-license"
                  value={license}
                  onChange={(event) => setLicense(event.target.value)}
                >
                  <option>CC BY 4.0</option>
                  <option>CC BY-SA 4.0</option>
                  <option>CC0 1.0</option>
                  <option>All rights reserved</option>
                </select>
              </div>
              <div>
                <label htmlFor="prompt-source">Source URL</label>
                <input
                  id="prompt-source"
                  type="url"
                  value={sourceUrl}
                  onChange={(event) => setSourceUrl(event.target.value)}
                  placeholder="https://…"
                />
              </div>
            </div>
            <label htmlFor="usage-notes">Tips, limitations, or safety notes</label>
            <textarea
              id="usage-notes"
              maxLength={3000}
              rows={5}
              value={usageNotes}
              onChange={(event) => setUsageNotes(event.target.value)}
            />
            <button
              className={styles.defaultsButton}
              type="button"
              onClick={() => {
                setPublisher("personal");
                setLicense("CC BY 4.0");
                setSourceUrl("");
                setUsageNotes("");
              }}
            >
              Use defaults
            </button>
          </section>

          {status ? <p className={shell.notice}>{status}</p> : null}
          <div className={styles.submitRow}>
            <button disabled={submitting} type="submit">
              {submitting ? "Publishing…" : "Publish prompt"}
            </button>
            <Link href="/prompts">Cancel</Link>
          </div>
        </div>

        <div className={styles.previewColumn}>
          <PromptPreparationTools
            onApplyFormDetails={applyFormDetails}
            promptText={promptText}
          />
          <aside className={styles.preview}>
            <p className={shell.eyebrow}>Live preview</p>
            <span>
              {category} ·{" "}
              {outputTypes.map(displayPromptType).join(", ") || "Choose an output"}
            </span>
            <h2>{title || "Your prompt title"}</h2>
            <p>{summary || "Your short description will appear here."}</p>
            <pre>
              {promptText || "Your prompt text will appear here as people will copy it."}
            </pre>
            <small>Published by {publisherLabel}</small>
          </aside>
        </div>
      </form>
    </main>
  );
}
