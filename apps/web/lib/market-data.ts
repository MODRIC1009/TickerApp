import {
  createMarketDataService,
  type MarketDataService,
} from "@tickerapp/market-data";

let marketDataService:
  | MarketDataService
  | undefined;

function getEnvironmentProvider(): string {
  const configuredProvider =
    process.env.MARKET_DATA_PROVIDER?.trim();

  if (configuredProvider) {
    return configuredProvider;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "MARKET_DATA_PROVIDER must be configured in production.",
    );
  }

  return "demo";
}

export function getMarketDataService(): MarketDataService {
  if (!marketDataService) {
    const providerId =
      getEnvironmentProvider();

    if (
      providerId === "twelve-data" &&
      !process.env.TWELVE_DATA_API_KEY?.trim()
    ) {
      throw new Error(
        "TWELVE_DATA_API_KEY must be configured when MARKET_DATA_PROVIDER=twelve-data.",
      );
    }

    marketDataService =
      createMarketDataService({
        twelveDataApiKey:
          process.env.TWELVE_DATA_API_KEY,
        defaultProviderId: providerId,
        allowFallback: false,
      });
  }

  return marketDataService;
}