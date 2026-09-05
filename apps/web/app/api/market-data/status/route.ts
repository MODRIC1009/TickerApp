import { NextResponse } from "next/server";

import { getMarketDataService } from "@/lib/market-data";

export async function GET() {
  try {
    const status = getMarketDataService().getProviderStatus();

    return NextResponse.json({
      status: "online",
      ...status,
    });
  } catch (error) {
    console.error("Market data status request failed:", error);

    return NextResponse.json(
      {
        status: "offline",
        providerId: null,
        providerName: null,
        capabilities: null,
      },
      { status: 503 },
    );
  }
}