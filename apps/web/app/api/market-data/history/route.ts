import { NextResponse } from "next/server";

import {
  validateDateRange,
  validateHistoricalInterval,
  validateSymbol,
} from "@tickerapp/market-data";
import { getMarketDataService } from "@/lib/market-data";
import {
  marketDataErrorResponse,
} from "@/lib/market-data-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const rawSymbol = searchParams.get("symbol");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const interval = searchParams.get("interval");
  const providerId =
    searchParams.get("provider")?.trim() || undefined;

  if (!rawSymbol || !startDate || !endDate || !interval) {
    return NextResponse.json(
      {
        error:
          "Required query parameters: symbol, startDate, endDate, interval.",
      },
      { status: 400 },
    );
  }

  try {
    const symbol = validateSymbol(rawSymbol);
    const dates = validateDateRange(
      startDate,
      endDate,
    );
    const validatedInterval =
      validateHistoricalInterval(interval);

    const bars =
      await getMarketDataService().getHistoricalPrices(
        {
          symbol,
          startDate: dates.startDate,
          endDate: dates.endDate,
          interval: validatedInterval,
        },
        providerId,
      );

    return NextResponse.json({
      symbol,
      interval: validatedInterval,
      startDate: dates.startDate,
      endDate: dates.endDate,
      bars,
    });
  } catch (error) {
    console.error(
      "Historical price request failed:",
      error,
    );

    return marketDataErrorResponse(
      error,
      "Historical price request failed.",
    );
  }
}