import { NextResponse } from "next/server";

import { getMarketDataService } from "@/lib/market-data";
import {
  marketDataErrorResponse,
} from "@/lib/market-data-api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const query = searchParams.get("q")?.trim();
  const providerId =
    searchParams.get("provider")?.trim() || undefined;

  if (!query) {
    return NextResponse.json(
      { error: "Missing required query parameter: q" },
      { status: 400 },
    );
  }

  try {
    const results =
      await getMarketDataService().searchInstruments(
        query,
        providerId,
      );

    return NextResponse.json({
      results,
    });
  } catch (error) {
    console.error(
      "Market instrument search failed:",
      error,
    );

    return marketDataErrorResponse(
      error,
      "Market instrument search failed.",
    );
  }
}