import { NextResponse } from "next/server";

import { validateSymbol } from "@tickerapp/market-data";
import { getMarketDataService } from "@/lib/market-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const countryCode =
    searchParams.get("country")?.trim();
  const exchangeId =
    searchParams.get("exchange")?.trim();
  const rawSymbol =
    searchParams.get("symbol");

  if (!countryCode || !exchangeId || !rawSymbol) {
    return NextResponse.json(
      {
        error:
          "Required query parameters: country, exchange, symbol.",
      },
      { status: 400 },
    );
  }

  try {
    const symbol = validateSymbol(rawSymbol);
    const marketDataService =
      getMarketDataService();

    const instrument =
      marketDataService.getCachedInstrument(
        countryCode,
        exchangeId,
        symbol,
      );

    if (!instrument) {
      return NextResponse.json(
        {
          error:
            `Instrument "${symbol}" is not cached for ` +
            `${countryCode.toUpperCase()}:${exchangeId.toLowerCase()}.`,
        },
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
    const message =
      error instanceof Error
        ? error.message
        : "Instrument identity lookup failed.";

    return NextResponse.json(
      { error: message },
      { status: 400 },
    );
  }
}