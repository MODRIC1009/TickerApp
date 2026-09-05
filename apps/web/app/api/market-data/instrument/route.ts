import { NextResponse } from "next/server";

import { validateSymbol } from "@tickerapp/market-data";
import { getMarketDataService } from "@/lib/market-data";
import {
  marketDataErrorResponse,
} from "@/lib/market-data-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawSymbol = searchParams.get("symbol");
  const providerId =
    searchParams.get("provider")?.trim() || undefined;

  if (!rawSymbol) {
    return NextResponse.json(
      { error: "Missing required query parameter: symbol" },
      { status: 400 },
    );
  }

  try {
    const symbol = validateSymbol(rawSymbol);
    const marketDataService =
      getMarketDataService();

    const instrument =
      await marketDataService.getInstrument(
        symbol,
        providerId,
      );

    if (!instrument) {
      return NextResponse.json(
        { error: `Instrument "${symbol}" not found.` },
        { status: 404 },
      );
    }

    return NextResponse.json({
      instrument,
      identity:
        marketDataService.getInstrumentIdentity(
          instrument,
        ),
    });
  } catch (error) {
    console.error(
      "Market instrument lookup failed:",
      error,
    );

    return marketDataErrorResponse(
      error,
      "Market instrument lookup failed.",
    );
  }
}