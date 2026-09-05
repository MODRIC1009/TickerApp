import type {
  Exchange,
  Instrument,
  OHLCVBar,
  Quote,
} from "@tickerapp/shared";

import type {
  HistoricalPriceRequest,
  InstrumentSearchResult,
  MarketDataProvider,
} from "./index";
import { MarketDataProviderRegistry } from "./provider-registry";

export class MarketDataService {
  constructor(
    private readonly registry: MarketDataProviderRegistry,
    private readonly defaultProviderId: string,
  ) {}

  getDefaultProvider(): MarketDataProvider {
  return this.getProvider();
 }
  
  getProviderStatus(): {
  providerId: string;
  providerName: string;
  capabilities: MarketDataProvider["capabilities"];
} {
  const provider = this.getDefaultProvider();

  return {
    providerId: provider.id,
    providerName: provider.name,
    capabilities: provider.capabilities,
  };
}

  private getProvider(providerId?: string): MarketDataProvider {
    return this.registry.get(providerId ?? this.defaultProviderId);
  }

  private async withFallback<T>(
    operation: (provider: MarketDataProvider) => Promise<T>,
    providerId?: string,
  ): Promise<T> {
    const provider = this.getProvider(providerId);

    try {
      return await operation(provider);
    } catch (error) {
      const fallbackProvider =
        this.registry.getFallbackProvider(provider.id);

      if (!fallbackProvider) {
        throw error;
      }

      console.warn(
        `Market data provider "${provider.id}" failed. Falling back to "${fallbackProvider.id}".`,
        error,
      );

      return operation(fallbackProvider);
    }
  }

  async searchInstruments(
    query: string,
    providerId?: string,
  ): Promise<InstrumentSearchResult[]> {
    return this.withFallback(
      (provider) => provider.searchInstruments(query),
      providerId,
    );
  }

  async getInstrument(
    symbol: string,
    providerId?: string,
  ): Promise<Instrument | null> {
    return this.withFallback(
      (provider) => provider.getInstrument(symbol),
      providerId,
    );
  }

  async getQuote(
    symbol: string,
    providerId?: string,
  ): Promise<Quote | null> {
    return this.withFallback(
      (provider) => provider.getQuote(symbol),
      providerId,
    );
  }

  async getHistoricalPrices(
    request: HistoricalPriceRequest,
    providerId?: string,
  ): Promise<OHLCVBar[]> {
    return this.withFallback(
      (provider) => provider.getHistoricalPrices(request),
      providerId,
    );
  }

  async listExchanges(
    providerId?: string,
  ): Promise<Exchange[]> {
    return this.withFallback(
      (provider) => provider.listExchanges(),
      providerId,
    );
  }
}