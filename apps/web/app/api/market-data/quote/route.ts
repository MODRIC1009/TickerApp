import { NextRequest, NextResponse } from "next/server";

import {
  marketDataErrorResponse,
} from "@/lib/market-data-api";
import { getMarketDataService } from "@/lib/market-data";

export async function GET(
  request: NextRequest,
) {
  try {
    const symbol =
      request.nextUrl.searchParams
        .get("symbol")
        ?.trim()
        .toUpperCase();

    if (!symbol) {
      return NextResponse.json(
        {
          error:
            "A ticker symbol is required.",
          code: "invalid_request",
        },
        { status: 400 },
      );
    }

    const providerId =
      request.nextUrl.searchParams.get(
        "provider",
      ) ?? undefined;

    const marketDataService =
      getMarketDataService();

    const quote =
      await marketDataService.getQuote(
        symbol,
        providerId,
      );

    return NextResponse.json(
      { quote },
      {
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    return marketDataErrorResponse(
      error,
      "Market quote request failed.",
    );
  }
}