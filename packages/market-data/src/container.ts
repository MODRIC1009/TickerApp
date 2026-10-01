import { DemoMarketDataProvider } from "./providers/demo-provider";
import { TwelveDataProvider } from "./providers/twelve-data-provider";
import { MarketDataProviderRegistry } from "./provider-registry";
import {
  MarketDataService,
  type MarketDataServiceOptions,
} from "./market-data-service";
import {
  createMarketDataConfig,
  type MarketDataConfig,
} from "./config";

export interface MarketDataContainerOptions
  extends MarketDataServiceOptions {
  twelveDataApiKey?: string;
  defaultProviderId?: string;
}

export function createMarketDataService(
  options: MarketDataContainerOptions = {},
): MarketDataService {
  const config: MarketDataConfig =
    createMarketDataConfig({
      twelveDataApiKey:
        options.twelveDataApiKey,
      defaultProviderId:
        options.defaultProviderId,
    });

  const registry =
    new MarketDataProviderRegistry();

  registry.register(
    new DemoMarketDataProvider(),
  );

  if (config.twelveDataApiKey) {
    registry.register(
      new TwelveDataProvider({
        apiKey:
          config.twelveDataApiKey,
      }),
    );
  }

  if (
    !registry.has(
      config.defaultProviderId,
    )
  ) {
    throw new Error(
      `Configured market data provider "${config.defaultProviderId}" is not registered.`,
    );
  }

  return new MarketDataService(
    registry,
    config.defaultProviderId,
    undefined,
    {
      allowFallback:
        options.allowFallback ??
        false,
    },
  );
}