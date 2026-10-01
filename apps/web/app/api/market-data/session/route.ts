import { NextRequest, NextResponse } from "next/server";

import {
  marketDataErrorResponse,
} from "@/lib/market-data-api";
import { getMarketDataService } from "@/lib/market-data";

export async function GET(
  request: NextRequest,
) {
  try {
    const exchangeId =
      request.nextUrl.searchParams
        .get("exchange")
        ?.trim();

    if (!exchangeId) {
      return NextResponse.json(
        {
          error:
            "An exchange identifier is required.",
          code: "invalid_request",
        },
        { status: 400 },
      );
    }

    const marketDataService =
      getMarketDataService();

    const exchanges =
      await marketDataService.listExchanges();

    const exchange =
      exchanges.find(
        (item) =>
          item.id === exchangeId,
      );

    if (!exchange) {
      return NextResponse.json(
        {
          error: `Market exchange "${exchangeId}" was not found.`,
          code: "not_found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        exchange,
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
      "Market session request failed.",
    );
  }
}