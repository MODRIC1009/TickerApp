import { NextResponse } from "next/server";

import {
  getMarketSession,
} from "@tickerapp/market-data";
import { getMarketDataService } from "@/lib/market-data";
import {
  marketDataErrorResponse,
} from "@/lib/market-data-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const exchangeId = searchParams
    .get("exchange")
    ?.trim();

  const providerId =
    searchParams.get("provider")?.trim() || undefined;

  if (!exchangeId) {
    return NextResponse.json(
      {
        error:
          "Missing required query parameter: exchange",
      },
      { status: 400 },
    );
  }

  try {
    const exchanges =
      await getMarketDataService().listExchanges(
        providerId,
      );

    const exchange = exchanges.find(
      (item) => item.id === exchangeId,
    );

    if (!exchange) {
      return NextResponse.json(
        { error: `Unknown exchange "${exchangeId}".` },
        { status: 404 },
      );
    }

    const session = getMarketSession(exchange);

    return NextResponse.json({
      exchange: {
        id: exchange.id,
        name: exchange.name,
        timezone: exchange.timezone,
      },
      session,
    });
  } catch (error) {
    console.error(
      "Market session request failed:",
      error,
    );

    return marketDataErrorResponse(
      error,
      "Market session request failed.",
    );
  }
}