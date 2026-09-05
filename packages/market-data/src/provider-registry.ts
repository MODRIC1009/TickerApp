import type { MarketDataProvider } from "./index";

export class MarketDataProviderRegistry {
  private readonly providers = new Map<string, MarketDataProvider>();

  register(provider: MarketDataProvider): void {
    if (this.providers.has(provider.id)) {
      throw new Error(
        `Market data provider "${provider.id}" is already registered.`,
      );
    }

    this.providers.set(provider.id, provider);
  }

  get(providerId: string): MarketDataProvider {
    const provider = this.providers.get(providerId);

    if (!provider) {
      throw new Error(
        `Market data provider "${providerId}" is not registered.`,
      );
    }

    return provider;
  }

  has(providerId: string): boolean {
    return this.providers.has(providerId);
  }

  list(): MarketDataProvider[] {
    return [...this.providers.values()];
  }
}