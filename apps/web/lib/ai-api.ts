import { NextResponse } from "next/server";

import {
  AIError,
} from "@tickerapp/ai";

export function getAIErrorStatus(
  error: unknown,
): number {
  if (!(error instanceof AIError)) {
    return 502;
  }

  switch (error.code) {
    case "invalid_request":
      return 400;

    case "unsupported_capability":
      return 501;

    case "rate_limited":
      return 429;

    case "provider_unavailable":
    case "provider_error":
    default:
      return 502;
  }
}

export function aiErrorResponse(
  error: unknown,
  fallbackMessage: string,
): NextResponse {
  const status =
    getAIErrorStatus(error);

  if (error instanceof AIError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        providerId:
          error.providerId ?? null,
      },
      { status },
    );
  }

  return NextResponse.json(
    {
      error: fallbackMessage,
    },
    { status },
  );
}