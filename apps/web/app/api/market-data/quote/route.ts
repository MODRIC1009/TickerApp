import { NextResponse } from "next/server";

import { getMarketDataService } from "@/lib/market-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const symbol = searchParams.get("symbol")?.trim();

  if (!symbol) {
    return NextResponse.json(
      {
        error: "Missing required query parameter: symbol",
      },
      { status: 400 },
    );
  }

  try {
    const quote = await getMarketDataService().getQuote(symbol);

    if (!quote) {
      return NextResponse.json(
        {
          error: `No quote found for symbol "${symbol}".`,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Market data quote request failed:", error);

    return NextResponse.json(
      {
        error: "Market data provider request failed.",
      },
      { status: 502 },
    );
  }
}