import { NextRequest } from "next/server";

import {
  validateResearchRequest,
} from "@tickerapp/ai";

import {
  aiContainer,
} from "../../../../lib/ai-container";

import {
  aiErrorResponse,
} from "../../../../lib/ai-api";

export async function POST(
  request: NextRequest,
) {
  try {
    const body =
      await request.json();

    const researchInput =
      validateResearchRequest(
        body,
      );

    const result =
      await aiContainer.researchEngine.research(
        researchInput,
      );

    return Response.json({
      data: result,
    });
  } catch (error) {
    return aiErrorResponse(
      error,
      "AI research failed.",
    );
  }
}