import type { MarketDataProvider } from "./index";

export class MarketDataProviderRegistry {
  private readonly providers = new Map<
    string,
    MarketDataProvider
  >();

  register(provider: MarketDataProvider): void {
    const providerId = provider.id.trim();

    if (!providerId) {
      throw new Error(
        "Market data provider ID cannot be empty.",
      );
    }

    if (this.providers.has(providerId)) {
      throw new Error(
        `Market data provider "${providerId}" is already registered.`,
      );
    }

    this.providers.set(providerId, provider);
  }

  get(providerId: string): MarketDataProvider {
    const normalizedProviderId = providerId.trim();
    const provider =
      this.providers.get(normalizedProviderId);

    if (!provider) {
      throw new Error(
        `Market data provider "${normalizedProviderId}" is not registered.`,
      );
    }

    return provider;
  }

  has(providerId: string): boolean {
    return this.providers.has(providerId.trim());
  }

  list(): MarketDataProvider[] {
    return [...this.providers.values()];
  }

  getFallbackProvider(
    excludeProviderId: string,
  ): MarketDataProvider | null {
    const normalizedProviderId =
      excludeProviderId.trim();

    return (
      this.list().find(
        (provider) =>
          provider.id !== normalizedProviderId,
      ) ?? null
    );
  }
}