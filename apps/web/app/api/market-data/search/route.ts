import { NextRequest, NextResponse } from "next/server";

import {
  marketDataErrorResponse,
} from "@/lib/market-data-api";
import { getMarketDataService } from "@/lib/market-data";

const MAX_RESULTS = 12;

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

    const searchResults =
      await marketDataService.searchInstruments(
        query,
      );

    const uniqueBySymbol =
      new Map<
        string,
        (typeof searchResults)[number]
      >();

    for (const result of searchResults) {
      const symbol =
        result.instrument.symbol
          .trim()
          .toUpperCase();

      if (!symbol) {
        continue;
      }

      const existing =
        uniqueBySymbol.get(symbol);

      if (
        !existing ||
        (result.score ?? 0) >
          (existing.score ?? 0)
      ) {
        uniqueBySymbol.set(
          symbol,
          result,
        );
      }

      if (
        uniqueBySymbol.size >=
        MAX_RESULTS
      ) {
        break;
      }
    }

    const results = Array.from(
      uniqueBySymbol.values(),
    ).map(
      ({ instrument }) => instrument,
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
