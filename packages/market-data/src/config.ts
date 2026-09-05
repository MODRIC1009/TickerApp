export interface MarketDataConfig {
  defaultProviderId: string;
  twelveDataApiKey?: string;
}

export function createMarketDataConfig(
  options: Partial<MarketDataConfig> = {},
): MarketDataConfig {
  return {
    defaultProviderId:
      options.defaultProviderId ??
      (options.twelveDataApiKey?.trim()
        ? "twelve-data"
        : "demo"),
    twelveDataApiKey:
      options.twelveDataApiKey?.trim() || undefined,
  };
}