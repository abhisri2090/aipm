"use client";

import { useState } from "react";
import { PromptCopyButton } from "./prompt-copy-button";
import { buildFinalPrompt, missingRequiredVariables } from "../lib/prompt-runner";
import type { PromptVariable } from "../lib/prompts";
import styles from "./prompt-runner.module.css";
import shell from "../app/page-shell.module.css";

type PromptRunnerProps = {
  promptText: string;
  trackingPath: string;
  variables: PromptVariable[];
};

export function PromptRunner({
  promptText,
  trackingPath,
  variables,
}: PromptRunnerProps) {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(variables.map((variable) => [variable.name, ""])),
  );
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [error, setError] = useState("");

  function updateValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
    setGeneratedPrompt(null);
    setError("");
  }

  function generatePrompt() {
    const missing = missingRequiredVariables(variables, values);
    if (missing.length) {
      setError(
        `Add values for ${missing.map((name) => `{{${name}}}`).join(", ")} before generating.`,
      );
      setGeneratedPrompt(null);
      return;
    }

    setError("");
    setGeneratedPrompt(buildFinalPrompt(promptText, variables, values));
  }

  return (
    <section className={styles.runner} aria-labelledby="create-final-prompt-title">
      <div className={styles.header}>
        <p className={shell.eyebrow}>Create your final prompt</p>
        <h2 id="create-final-prompt-title">Add your context and generate</h2>
        <p>
          Fill in the required variables below. Optional variables can be left blank and
          will remain as placeholders.
        </p>
      </div>

      {variables.length ? (
        <div className={styles.fields}>
          {variables.map((variable) => (
            <div className={styles.field} key={variable.name}>
              <label htmlFor={`prompt-variable-${variable.name}`}>
                <span>{`{{${variable.name}}}`}</span>
                {variable.required ? <strong>Required</strong> : <em>Optional</em>}
              </label>
              <textarea
                id={`prompt-variable-${variable.name}`}
                placeholder={variable.example ? `Example: ${variable.example}` : undefined}
                required={variable.required}
                rows={1}
                value={values[variable.name] ?? ""}
                onChange={(event) => updateValue(variable.name, event.target.value)}
              />
              {variable.description ? <small>{variable.description}</small> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.noVariables}>This prompt is ready to generate as written.</p>
      )}

      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}

      <button className={styles.generateButton} type="button" onClick={generatePrompt}>
        Generate final prompt
      </button>

      {generatedPrompt !== null ? (
        <div className={styles.result}>
          <div className={styles.resultHeader}>
            <h3>Final prompt</h3>
            <PromptCopyButton
              label="Copy final prompt"
              trackingPath={trackingPath}
              value={generatedPrompt}
            />
          </div>
          <pre>{generatedPrompt}</pre>
        </div>
      ) : null}
    </section>
  );
}
