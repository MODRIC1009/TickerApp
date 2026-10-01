import { NextRequest, NextResponse } from "next/server";

import {
  GLOBAL_INSTRUMENTS,
} from "@tickerapp/market-data";
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

function searchGlobalCatalog(
  query: string,
) {
  const normalizedQuery =
    query.trim().toLowerCase();

  if (!normalizedQuery) {
    return [];
  }

  return GLOBAL_INSTRUMENTS
    .filter((instrument) =>
      instrument.symbol
        .toLowerCase()
        .includes(normalizedQuery) ||
      instrument.name
        .toLowerCase()
        .includes(normalizedQuery),
    )
    .map((instrument) => ({
      instrument,
      score:
        instrument.symbol.toLowerCase() ===
        normalizedQuery
          ? 1
          : instrument.symbol
              .toLowerCase()
              .startsWith(normalizedQuery)
            ? 0.9
            : 0.5,
    }));
}

function trimSearchResults<T extends { instrument: { symbol: string; exchangeId: string; countryCode: string; currency: string; assetClass: string } }>(
  results: T[],
): T[] {
  const seen = new Set<string>();

  return results
    .filter((result) => {
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
    })
    .slice(0, MAX_RESULTS);
}

function mergeSearchResults<
  T extends {
    instrument: {
      symbol: string;
      exchangeId: string;
      countryCode: string;
      currency: string;
      assetClass: string;
    };
  },
>(
  providerResults: T[],
  catalogResults: T[],
): T[] {
  return trimSearchResults([
    ...providerResults,
    ...catalogResults,
  ]);
}

function cacheAndRespond(
  cacheKey: string,
  results: Awaited<
    ReturnType<
      ReturnType<typeof getMarketDataService>["searchInstruments"]
    >
  >,
  extraHeaders: Record<string, string> = {},
) {
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
        ...extraHeaders,
      },
    },
  );
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

    // The canonical catalog is local, deterministic, and does not consume
    // provider quota. Return known instruments immediately instead of waiting
    // for a remote provider search that may be slow or rate-limited.
    const catalogResults = trimSearchResults(
      searchGlobalCatalog(query),
    );

    if (catalogResults.length > 0) {
      return cacheAndRespond(
        cacheKey,
        catalogResults,
        {
          "X-TickerApp-Search-Source":
            "catalog",
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

      // Provider discovery is used for symbols that are not present in the
      // canonical catalog. Catalog metadata is still merged in so newly added
      // catalog entries remain first-class search results.
      const results = mergeSearchResults(
        rawResults,
        catalogResults,
      );

      return cacheAndRespond(
        cacheKey,
        results,
        {
          "X-TickerApp-Search-Source":
            "provider",
        },
      );
    } catch (error) {
      // A provider failure must not turn a known catalog query into an error.
      // This branch is primarily for symbols outside the local catalog.
      if (catalogResults.length > 0) {
        return cacheAndRespond(
          cacheKey,
          catalogResults,
          {
            "X-TickerApp-Search-Source":
              "catalog-fallback",
          },
        );
      }

      throw error;
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
