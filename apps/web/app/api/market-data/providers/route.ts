import { NextResponse } from "next/server";

import {
  marketDataErrorResponse,
} from "@/lib/market-data-api";
import { getMarketDataService } from "@/lib/market-data";

export async function GET() {
  try {
    const marketDataService =
      getMarketDataService();

    const providers =
      marketDataService.getProviderSummaries();

    return NextResponse.json(
      {
        providers,
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
      "Market-data providers request failed.",
    );
  }
}