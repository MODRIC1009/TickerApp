import { NextResponse } from "next/server";

import {
  marketDataErrorResponse,
} from "@/lib/market-data-api";
import { getMarketDataService } from "@/lib/market-data";

export async function GET() {
  try {
    const marketDataService =
      getMarketDataService();

    const health =
      await marketDataService.getHealth();

    return NextResponse.json(
      health,
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
      "Market-data status request failed.",
    );
  }
}