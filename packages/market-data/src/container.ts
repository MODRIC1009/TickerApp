import { DemoMarketDataProvider } from "./providers/demo-provider";
import { TwelveDataProvider } from "./providers/twelve-data-provider";
import { MarketDataProviderRegistry } from "./provider-registry";
import { MarketDataService } from "./market-data-service";

export interface MarketDataContainerOptions {
  twelveDataApiKey?: string;
}

export function createMarketDataService(
  options: MarketDataContainerOptions = {},
): MarketDataService {
  const registry = new MarketDataProviderRegistry();

  registry.register(new DemoMarketDataProvider());

  if (options.twelveDataApiKey?.trim()) {
    registry.register(
      new TwelveDataProvider({
        apiKey: options.twelveDataApiKey,
      }),
    );
  }

  return new MarketDataService(
    registry,
    options.twelveDataApiKey?.trim()
      ? "twelve-data"
      : "demo",
  );
}