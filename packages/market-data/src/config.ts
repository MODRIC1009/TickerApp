export interface MarketDataConfig {
  defaultProviderId: string;
  twelveDataApiKey?: string;
}

export function createMarketDataConfig(
  options: Partial<MarketDataConfig> = {},
): MarketDataConfig {
  const apiKey =
    options.twelveDataApiKey?.trim() ||
    undefined;

  const configuredProvider =
    options.defaultProviderId?.trim() ||
    undefined;

  const defaultProviderId =
    configuredProvider ??
    (apiKey
      ? "twelve-data"
      : "demo");

  if (
    defaultProviderId ===
      "twelve-data" &&
    !apiKey
  ) {
    throw new Error(
      "Twelve Data requires a valid API key.",
    );
  }

  return {
    defaultProviderId,
    twelveDataApiKey: apiKey,
  };
}