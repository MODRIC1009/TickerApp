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

    const marketDataService =
      getMarketDataService();

    const instrument =
      await marketDataService.getInstrument(
        symbol,
      );

    if (!instrument) {
      return NextResponse.json(
        {
          error: `Instrument "${symbol}" was not found.`,
          code: "not_found",
        },
        { status: 404 },
      );
    }

    const identity =
      marketDataService.getInstrumentIdentity(
        instrument,
      );

    return NextResponse.json(
      {
        instrument,
        identity,
      },
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
      "Market instrument lookup failed.",
    );
  }
}