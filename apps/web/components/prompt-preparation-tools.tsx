"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useRef, useState } from "react";
import { PromptCopyButton } from "./prompt-copy-button";
import {
  buildFormDetailsPrompt,
  buildGenericPrompt,
  parseFormDetailsResponse,
  type PromptFormAutofill,
} from "../lib/prompt-preparation";
import styles from "./prompt-preparation-tools.module.css";

type PromptPreparationToolsProps = {
  promptText: string;
  onApplyFormDetails: (details: PromptFormAutofill, promptText: string) => void;
};

type Tool = "generic" | "details";
type Results = Record<Tool, string | null>;
type Errors = Record<Tool, string>;

export function PromptPreparationTools({
  promptText,
  onApplyFormDetails,
}: PromptPreparationToolsProps) {
  const [toolPrompt, setToolPrompt] = useState(promptText);
  const [genericAlready, setGenericAlready] = useState(false);
  const [genericPromptOutput, setGenericPromptOutput] = useState("");
  const [formDetailsResponse, setFormDetailsResponse] = useState("");
  const [formDetailsError, setFormDetailsError] = useState("");
  const [formDetailsApplied, setFormDetailsApplied] = useState(false);
  const appliedPromptRef = useRef<string | null>(null);
  const [results, setResults] = useState<Results>({
    generic: null,
    details: null,
  });
  const [errors, setErrors] = useState<Errors>({
    generic: "",
    details: "",
  });

  useEffect(() => {
    const promptWasApplied = appliedPromptRef.current === promptText;
    setToolPrompt(promptText);
    if (!promptWasApplied) {
      setGenericAlready(false);
      setGenericPromptOutput("");
      setFormDetailsResponse("");
      setFormDetailsError("");
      setFormDetailsApplied(false);
      setResults({ generic: null, details: null });
      setErrors({ generic: "", details: "" });
    }
    appliedPromptRef.current = null;
  }, [promptText]);

  function promptForNextStep() {
    return genericAlready || !genericPromptOutput.trim()
      ? toolPrompt
      : genericPromptOutput.trim();
  }

  function resetFormDetailsState() {
    setResults((current) => ({ ...current, details: null }));
    setErrors((current) => ({ ...current, details: "" }));
    setFormDetailsResponse("");
    setFormDetailsError("");
    setFormDetailsApplied(false);
  }

  function generate(tool: Tool) {
    try {
      const result =
        tool === "generic"
          ? buildGenericPrompt(toolPrompt)
          : buildFormDetailsPrompt(promptForNextStep());
      setResults((current) => ({ ...current, [tool]: result }));
      setErrors((current) => ({ ...current, [tool]: "" }));
    } catch (error) {
      setResults((current) => ({ ...current, [tool]: null }));
      setErrors((current) => ({
        ...current,
        [tool]: error instanceof Error ? error.message : "Enter a prompt first",
      }));
    }
  }

  function applyFormDetails() {
    try {
      const details = parseFormDetailsResponse(formDetailsResponse);
      const preparedPrompt = promptForNextStep();
      appliedPromptRef.current = preparedPrompt;
      onApplyFormDetails(details, preparedPrompt);
      setFormDetailsError("");
      setFormDetailsApplied(true);
    } catch (error) {
      setFormDetailsApplied(false);
      setFormDetailsError(
        error instanceof Error ? error.message : "Could not read the JSON response.",
      );
    }
  }

  function renderTool(tool: Tool) {
    const generic = tool === "generic";
    const result = results[tool];
    const error = errors[tool];

    return (
      <section
        aria-labelledby={`${tool}-prompt-title`}
        className={`${styles.modalTool} ${
          generic && genericAlready ? styles.modalToolCollapsed : ""
        }`}
        key={tool}
      >
        <div className={styles.toolHeader}>
          <p className={styles.eyebrow}>{generic ? "Step 1" : "Step 2"}</p>
          <h3 id={`${tool}-prompt-title`}>
            {generic ? "Making your prompt generic, if not already" : "Get form details"}
          </h3>
          {!genericAlready || !generic ? (
            <p>
              {generic
                ? "Make your prompt reusable by replacing user-specific details with clear placeholders."
                : "Ask your preferred AI tool to suggest the publishing details needed for this AIPM form."}
            </p>
          ) : null}
        </div>
        {generic ? (
          <label className={styles.alreadyGeneric}>
            <input
              checked={genericAlready}
              type="checkbox"
              onChange={(event) => {
                setGenericAlready(event.target.checked);
                resetFormDetailsState();
              }}
            />
            <span>
              <strong>OR</strong> It is already generic. Use it as-is and continue.
            </span>
          </label>
        ) : null}
        {!generic || !genericAlready ? (
          <>
            {error ? (
              <p className={styles.error} role="alert">
                {error}
              </p>
            ) : null}
            <button className={styles.action} type="button" onClick={() => generate(tool)}>
              {generic ? "Make prompt generic" : "Generate form-details prompt"}
            </button>
            {result ? (
              <div className={styles.result}>
                <div className={styles.resultHeader}>
                  <h4>Ready to copy</h4>
                  <PromptCopyButton
                    label={generic ? "Copy generic prompt" : "Copy form-details prompt"}
                    value={result}
                  />
                </div>
                <pre>{result}</pre>
              </div>
            ) : null}
            {generic && result ? (
              <div className={styles.genericPromptImport}>
                <label htmlFor="generic-prompt-output">
                  Paste the generic prompt returned by your AI tool
                </label>
                <textarea
                  id="generic-prompt-output"
                  value={genericPromptOutput}
                  onChange={(event) => {
                    setGenericPromptOutput(event.target.value);
                    resetFormDetailsState();
                  }}
                  placeholder="Paste the reusable prompt here…"
                  rows={7}
                />
                <p>
                  This version will be used in Step 2 and when filling the form from
                  JSON.
                </p>
              </div>
            ) : null}
            {!generic && result ? (
              <div className={styles.formDetailsImport}>
                <label htmlFor="form-details-response">Paste the AI's JSON response</label>
                <textarea
                  id="form-details-response"
                  value={formDetailsResponse}
                  onChange={(event) => {
                    setFormDetailsResponse(event.target.value);
                    setFormDetailsError("");
                    setFormDetailsApplied(false);
                  }}
                  placeholder='{"title":"...","summary":"..."}'
                  rows={7}
                />
                <button className={styles.action} type="button" onClick={applyFormDetails}>
                  Fill form from JSON
                </button>
                {formDetailsError ? (
                  <p className={styles.error} role="alert">
                    {formDetailsError}
                  </p>
                ) : null}
                {formDetailsApplied ? (
                  <p className={styles.success} role="status">
                    Form fields filled from the JSON response.
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </section>
    );
  }

  return (
    <DialogPrimitive.Root>
      <section className={styles.tool} aria-labelledby="ai-form-helper-title">
        <div className={styles.toolHeader}>
          <p className={styles.eyebrow}>AI assistance</p>
          <h2 id="ai-form-helper-title">Fill the form with AI</h2>
          <p>
            Prepare your prompt for AI tools and get suggestions for the AIPM publishing
            form.
          </p>
        </div>
        <DialogPrimitive.Trigger asChild>
          <button className={styles.action} type="button">
            Open AI form helper
          </button>
        </DialogPrimitive.Trigger>
      </section>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className={styles.dialogOverlay} />
        <DialogPrimitive.Content className={styles.dialogContent}>
          <div className={styles.dialogHeader}>
            <div>
              <DialogPrimitive.Title className={styles.dialogTitle}>
                Fill up the form via your AI assistent
              </DialogPrimitive.Title>
              <DialogPrimitive.Description className={styles.dialogDescription}>
                Generate an instruction, paste the AI response below it, and apply the
                results to this form.
              </DialogPrimitive.Description>
            </div>
            <DialogPrimitive.Close asChild>
              <button aria-label="Close AI form helper" className={styles.close} type="button">
                ×
              </button>
            </DialogPrimitive.Close>
          </div>
          <div className={styles.promptInput}>
            <label htmlFor="ai-helper-prompt">Prompt to prepare</label>
            <textarea
              id="ai-helper-prompt"
              placeholder="Paste or write the prompt you want to prepare…"
              rows={6}
              value={toolPrompt}
              onChange={(event) => {
                setToolPrompt(event.target.value);
                setGenericAlready(false);
                setGenericPromptOutput("");
                setResults({ generic: null, details: null });
                setErrors({ generic: "", details: "" });
                setFormDetailsError("");
                setFormDetailsApplied(false);
              }}
            />
            <p>The original prompt in the form will not be changed.</p>
          </div>
          <div className={styles.modalTools}>
            {renderTool("generic")}
            {renderTool("details")}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
