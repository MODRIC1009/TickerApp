import { NextResponse } from "next/server";

import {
  marketDataErrorResponse,
} from "@/lib/market-data-api";
import { getMarketDataService } from "@/lib/market-data";

export async function GET() {
  try {
    const marketDataService =
      getMarketDataService();

    const exchanges =
      await marketDataService.listExchanges();

    return NextResponse.json(
      {
        exchanges,
        count: exchanges.length,
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
      "Market exchanges request failed.",
    );
  }
}
