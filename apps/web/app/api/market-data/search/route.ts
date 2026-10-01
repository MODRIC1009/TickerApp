import { NextRequest, NextResponse } from "next/server";

import {
  marketDataErrorResponse,
} from "@/lib/market-data-api";
import { getMarketDataService } from "@/lib/market-data";

export async function GET(
  request: NextRequest,
) {
  try {
    const query =
      request.nextUrl.searchParams
        .get("q")
        ?.trim();

    if (!query) {
      return NextResponse.json(
        {
          results: [],
        },
        {
          headers: {
            "Cache-Control":
              "no-store, max-age=0",
          },
        },
      );
    }

    if (query.length > 100) {
      return NextResponse.json(
        {
          error:
            "Search query must be 100 characters or fewer.",
          code: "invalid_request",
        },
        { status: 400 },
      );
    }

    const marketDataService =
      getMarketDataService();

    const results =
      marketDataService.searchInstruments(
        query,
      );

    return NextResponse.json(
      {
        results,
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
      "Market instrument search failed.",
    );
  }
}