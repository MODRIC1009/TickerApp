import type {
  ResearchInput,
  ResearchResult,
} from "@tickerapp/ai";

interface ResearchApiResponse {
  data?: ResearchResult;
  error?: string;
  code?: string;
  providerId?: string | null;
}

export class AIResearchClientError extends Error {
  readonly code?: string;
  readonly providerId?: string | null;
  readonly status: number;

  constructor(
    message: string,
    status: number,
    options?: {
      code?: string;
      providerId?: string | null;
    },
  ) {
    super(message);

    this.name =
      "AIResearchClientError";
    this.status = status;
    this.code = options?.code;
    this.providerId =
      options?.providerId;
  }
}

export async function runAIResearch(
  input: ResearchInput,
): Promise<ResearchResult> {
  const response =
    await fetch(
      "/api/ai/research",
      {
        method: "POST",
        headers: {
          "content-type":
            "application/json",
        },
        body: JSON.stringify(input),
      },
    );

  let payload:
    | ResearchApiResponse
    | undefined;

  try {
    payload =
      (await response.json()) as ResearchApiResponse;
  } catch {
    throw new AIResearchClientError(
      "The AI research service returned an invalid response.",
      response.status,
    );
  }

  if (
    !response.ok ||
    !payload.data
  ) {
    throw new AIResearchClientError(
      payload.error ??
        "AI research failed.",
      response.status,
      {
        code: payload.code,
        providerId:
          payload.providerId,
      },
    );
  }

  return payload.data;
}