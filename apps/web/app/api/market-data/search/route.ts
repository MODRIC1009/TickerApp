import { NextRequest, NextResponse } from "next/server";

import {
  marketDataErrorResponse,
} from "@/lib/market-data-api";
import { getMarketDataService } from "@/lib/market-data";

const SEARCH_CACHE_TTL_MS = 30_000;
const MAX_RESULTS = 20;

const searchCache = new Map<
  string,
  {
    expiresAt: number;
    results: Awaited<
      ReturnType<
        ReturnType<typeof getMarketDataService>["searchInstruments"]
      >
    >;
  }
>();

const inFlightSearches = new Map<
  string,
  ReturnType<
    ReturnType<typeof getMarketDataService>["searchInstruments"]
  >
>();

function trimSearchResults<T extends { instrument: { symbol: string; exchangeId: string; countryCode: string; currency: string; assetClass: string } }>(
  results: T[],
): T[] {
  const seen = new Set<string>();

  return results.filter((result) => {
    const instrument = result.instrument;
    const key = [
      instrument.symbol,
      instrument.exchangeId,
      instrument.countryCode,
      instrument.currency,
      instrument.assetClass,
    ].join("|");

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  }).slice(0, MAX_RESULTS);
}

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
              "public, max-age=5, stale-while-revalidate=30",
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

    const cacheKey = query.toUpperCase();
    const cached = searchCache.get(cacheKey);

    if (
      cached &&
      cached.expiresAt > Date.now()
    ) {
      return NextResponse.json(
        { results: cached.results },
        {
          headers: {
            "Cache-Control":
              "public, max-age=30, stale-while-revalidate=60",
          },
        },
      );
    }

    const existingRequest =
      inFlightSearches.get(cacheKey);

    const searchRequest =
      existingRequest ??
      getMarketDataService().searchInstruments(
        query,
      );

    if (!existingRequest) {
      inFlightSearches.set(
        cacheKey,
        searchRequest,
      );
    }

    try {
      const rawResults =
        await searchRequest;
      const results = trimSearchResults(
        rawResults,
      );

      searchCache.set(cacheKey, {
        results,
        expiresAt:
          Date.now() + SEARCH_CACHE_TTL_MS,
      });

      return NextResponse.json(
        { results },
        {
          headers: {
            "Cache-Control":
              "public, max-age=30, stale-while-revalidate=60",
          },
        },
      );
    } finally {
      if (!existingRequest) {
        inFlightSearches.delete(cacheKey);
      }
    }
  } catch (error) {
    return marketDataErrorResponse(
      error,
      "Market instrument search failed.",
    );
  }
}
