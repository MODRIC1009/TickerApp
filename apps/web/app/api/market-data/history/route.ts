import { NextRequest, NextResponse } from "next/server";

import {
  marketDataErrorResponse,
} from "@/lib/market-data-api";
import { getMarketDataService } from "@/lib/market-data";

type HistoricalInterval =
  | "1d"
  | "1h"
  | "15m"
  | "5m";

const allowedIntervals =
  new Set<HistoricalInterval>([
    "1d",
    "1h",
    "15m",
    "5m",
  ]);

function parseInterval(
  value: string | null,
): HistoricalInterval {
  const interval = value ?? "1d";

  if (
    !allowedIntervals.has(
      interval as HistoricalInterval,
    )
  ) {
    throw new Error(
      `Unsupported interval "${interval}". Supported intervals are 1d, 1h, 15m, and 5m.`,
    );
  }

  return interval as HistoricalInterval;
}

function getDate(
  value: string | null,
  fallback: string,
) {
  return value?.trim() || fallback;
}

function parsePositiveInteger(
  value: string | null,
) {
  if (value === null || value === "") {
    return undefined;
  }

  const parsed = Number(value);

  if (
    !Number.isInteger(parsed) ||
    parsed <= 0
  ) {
    throw new Error(
      "outputSize must be a positive integer.",
    );
  }

  return parsed;
}

function formatDate(
  date: Date,
) {
  return date.toISOString().slice(0, 10);
}

export async function GET(
  request: NextRequest,
) {
  try {
    const searchParams =
      request.nextUrl.searchParams;

    const symbol =
      searchParams
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

    const interval =
      parseInterval(
        searchParams.get("interval"),
      );

    const endDate = getDate(
      searchParams.get("endDate"),
      formatDate(new Date()),
    );

    const startDate = getDate(
      searchParams.get("startDate"),
      formatDate(
        new Date(
          Date.now() -
            365 *
              24 *
              60 *
              60 *
              1000,
        ),
      ),
    );

    const outputSize =
      parsePositiveInteger(
        searchParams.get(
          "outputSize",
        ),
      );

    const providerId =
      searchParams.get(
        "provider",
      ) ?? undefined;

    const marketDataService =
      getMarketDataService();

    const data =
      await marketDataService.getHistoricalPrices(
        {
          symbol,
          interval,
          startDate,
          endDate,
          ...(outputSize !== undefined
            ? { outputSize }
            : {}),
        },
        providerId,
      );

    return NextResponse.json(
      { data },
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
      "Historical price request failed.",
    );
  }
}