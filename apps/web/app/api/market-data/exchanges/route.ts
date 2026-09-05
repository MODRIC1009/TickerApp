import { NextResponse } from "next/server";

import { ExchangeRegistry } from "@tickerapp/market-data";
import { getMarketDataService } from "@/lib/market-data";
import {
  marketDataErrorResponse,
} from "@/lib/market-data-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const country = searchParams.get("country")?.trim();
  const region = searchParams.get("region")?.trim();
  const providerId =
    searchParams.get("provider")?.trim() || undefined;

  try {
    const exchanges =
      await getMarketDataService().listExchanges(
        providerId,
      );

    const registry = new ExchangeRegistry(exchanges);

    let filteredExchanges = registry.list();

    if (country) {
      filteredExchanges =
        registry.findByCountry(country);
    }

    if (region) {
      filteredExchanges = filteredExchanges.filter(
        (exchange) => exchange.region === region,
      );
    }

    return NextResponse.json({
      exchanges: filteredExchanges,
      count: filteredExchanges.length,
    });
  } catch (error) {
    console.error(
      "Market exchanges request failed:",
      error,
    );

    return marketDataErrorResponse(
      error,
      "Market exchanges request failed.",
    );
  }
}