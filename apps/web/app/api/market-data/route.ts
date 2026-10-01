import { NextRequest, NextResponse } from "next/server";

import {
  marketDataErrorResponse,
} from "@/lib/market-data-api";
import { getMarketDataService } from "@/lib/market-data";

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

    const providerId =
      searchParams.get("provider") ??
      undefined;

    const marketDataService =
      getMarketDataService();

    if (!symbol) {
      const health =
        await marketDataService.getHealth();

      return NextResponse.json(
        {
          service: "market-data",
          health,
        },
        {
          headers: {
            "Cache-Control":
              "no-store, max-age=0",
          },
        },
      );
    }

    const quote =
      await marketDataService.getQuote(
        symbol,
        providerId,
      );

    return NextResponse.json(
      {
        quote,
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
      "Market-data request failed.",
    );
  }
}