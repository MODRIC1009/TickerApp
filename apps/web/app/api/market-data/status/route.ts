import { NextResponse } from "next/server";

import { getMarketDataService } from "@/lib/market-data";

export async function GET() {
  try {
    const marketDataService = getMarketDataService();
    const status = marketDataService.getProviderStatus();
    const health = await marketDataService.getProviderHealth();

    const isOnline =
      health.status === "healthy" ||
      health.status === "degraded";

    return NextResponse.json({
      status: isOnline ? "online" : "offline",
      ...status,
      health,
    }, {
      status: isOnline ? 200 : 503,
    });
  } catch (error) {
    console.error(
      "Market data status request failed:",
      error,
    );

    return NextResponse.json(
      {
        status: "offline",
        providerId: null,
        providerName: null,
        capabilities: null,
        health: {
          status: "unavailable",
          checkedAt: new Date().toISOString(),
          message: "Market data provider health check failed.",
        },
      },
      { status: 503 },
    );
  }
}