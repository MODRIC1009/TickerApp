import { NextResponse } from "next/server";

import { getMarketDataService } from "@/lib/market-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json(
      {
        error: "Missing required query parameter: q",
      },
      { status: 400 },
    );
  }

  try {
    const results =
      await getMarketDataService().searchInstruments(query);

    return NextResponse.json({
      results,
    });
  } catch (error) {
    console.error("Market data search request failed:", error);

    return NextResponse.json(
      {
        error: "Market data provider search failed.",
      },
      { status: 502 },
    );
  }
}