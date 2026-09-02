import { noIndexPageMetadata } from "../../../../../lib/seo";
import { PromptEditClient } from "./prompt-edit-client";

type EditPromptPageProps = {
  params: Promise<{ publisher: string; slug: string }>;
};

export const metadata = noIndexPageMetadata({
  title: "Edit Prompt",
  description: "Update a prompt you published in the AIPM prompt directory.",
  path: "/prompts/edit",
});

export default async function EditPromptPage({ params }: EditPromptPageProps) {
  const { publisher, slug } = await params;
  return <PromptEditClient publisher={publisher} slug={slug} />;
}
