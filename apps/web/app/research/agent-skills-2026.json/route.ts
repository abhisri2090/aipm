import { getAgentSkillsSnapshot } from "../../../lib/agent-skills-research";

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  try {
    const snapshot = await getAgentSkillsSnapshot();
    return Response.json(
      {
        name: "AIPM State of Agent Skills 2026 dataset",
        scope: "Public package versions returned by the AIPM Registry API",
        methodology: "One record per public package version returned by the paginated public packages endpoint.",
        ...snapshot,
      },
      {
        headers: {
          "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
          "content-disposition": 'inline; filename="aipm-agent-skills-2026.json"',
        },
      },
    );
  } catch {
    return Response.json({ error: "The public registry dataset is temporarily unavailable." }, { status: 503 });
  }
}
