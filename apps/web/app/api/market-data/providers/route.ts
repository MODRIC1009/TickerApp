import { NextResponse } from "next/server";

import { getMarketDataService } from "@/lib/market-data";

export async function GET() {
  try {
    const marketDataService = getMarketDataService();
    const defaultProvider =
      marketDataService.getDefaultProvider();

    const providers =
      marketDataService.getProviderSummaries();

    const providerDetails = await Promise.all(
      providers.map(async (provider) => {
        const health =
          await marketDataService.getProviderHealth(
            provider.id,
          );

        return {
          ...provider,
          health,
        };
      }),
    );

    return NextResponse.json({
      defaultProviderId: defaultProvider.id,
      providers: providerDetails,
    });
  } catch (error) {
    console.error(
      "Market data providers request failed:",
      error,
    );

    return NextResponse.json(
      { error: "Market data providers request failed." },
      { status: 502 },
    );
  }
}