
import { NextRequest } from "next/server";

import {
  validateResearchRequest,
  type ResearchResult,
} from "@tickerapp/ai";

import { aiContainer } from "../../../../lib/ai-container";
import { aiErrorResponse } from "../../../../lib/ai-api";

function buildResearchAnswer(result: ResearchResult): string {
  const sections = [
    `## Research Thesis\n${result.thesis}`,
    `## Bull Case\n${result.bullCase.map((point) => `- ${point}`).join("\n")}`,
    `## Bear Case\n${result.bearCase.map((point) => `- ${point}`).join("\n")}`,
    `## Catalysts\n${result.catalysts.map((point) => `- ${point}`).join("\n")}`,
    `## Key Risks\n${result.risks.map((point) => `- ${point}`).join("\n")}`,
    ...result.sections.map(
      (section) =>
        `## ${section.title}\n${section.summary}\n${section.keyPoints.map((point) => `- ${point}`).join("\n")}`,
    ),
    `## Confidence\n${result.confidence}`,
  ];

  if (result.limitations.length > 0) {
    sections.push(
      `## Limitations\n${result.limitations.map((item) => `- ${item}`).join("\n")}`,
    );
  }

  return sections.join("\n\n");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const researchInput = validateResearchRequest(body);

    const result: ResearchResult =
      await aiContainer.researchEngine.research(researchInput);

    return Response.json({
      data: result,
      answer: buildResearchAnswer(result),
      summary: result.thesis,
      sources: result.evidence.map((item) => ({
        title: item.source,
      })),
    });
  } catch (error) {
    return aiErrorResponse(error, "AI research failed.");
  }
}
