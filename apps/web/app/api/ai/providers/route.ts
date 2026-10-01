import {
  aiContainer,
} from "../../../../lib/ai-container";

export async function GET() {
  return Response.json({
    data:
      aiContainer.researchEngine
        .getProviderSummaries(),
  });
}