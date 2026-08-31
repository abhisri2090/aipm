import { PromptSubmissionForm } from "../../../components/prompt-submission-form";
import { noIndexPageMetadata } from "../../../lib/seo";

export const metadata = noIndexPageMetadata({
  title: "List a Prompt",
  description: "Publish a reusable prompt in the AIPM prompt directory.",
  path: "/prompts/new",
});

export default function NewPromptPage() {
  return <PromptSubmissionForm />;
}
