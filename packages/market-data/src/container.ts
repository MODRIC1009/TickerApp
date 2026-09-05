import { DemoMarketDataProvider } from "./providers/demo-provider";
import { MarketDataProviderRegistry } from "./provider-registry";
import { MarketDataService } from "./market-data-service";

export function createMarketDataService(): MarketDataService {
  const registry = new MarketDataProviderRegistry();

  registry.register(new DemoMarketDataProvider());

  return new MarketDataService(registry, "demo");
}