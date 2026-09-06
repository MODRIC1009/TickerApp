import {
  aiContainer,
} from "../../../../lib/ai-container";

import {
  aiErrorResponse,
} from "../../../../lib/ai-api";

export async function GET() {
  try {
    const health =
      await aiContainer.researchEngine.getHealth();

    return Response.json({
      data: health,
    });
  } catch (error) {
    return aiErrorResponse(
      error,
      "AI status check failed.",
    );
  }
}