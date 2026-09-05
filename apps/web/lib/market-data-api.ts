import { NextResponse } from "next/server";

import {
  MarketDataError,
} from "@tickerapp/market-data";

export function getMarketDataErrorStatus(
  error: unknown,
): number {
  if (!(error instanceof MarketDataError)) {
    return 502;
  }

  switch (error.code) {
    case "invalid_request":
      return 400;

    case "not_found":
      return 404;

    case "rate_limited":
      return 429;

    case "unsupported_capability":
      return 501;

    case "provider_unavailable":
    case "provider_error":
    default:
      return 502;
  }
}

export function marketDataErrorResponse(
  error: unknown,
  fallbackMessage: string,
): NextResponse {
  const status = getMarketDataErrorStatus(error);

  if (error instanceof MarketDataError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        providerId: error.providerId ?? null,
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