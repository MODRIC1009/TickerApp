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

  private getProvider(providerId?: string): MarketDataProvider {
    return this.registry.get(providerId ?? this.defaultProviderId);
  }

  async searchInstruments(
    query: string,
    providerId?: string,
  ): Promise<InstrumentSearchResult[]> {
    return this.getProvider(providerId).searchInstruments(query);
  }

  async getInstrument(
    symbol: string,
    providerId?: string,
  ): Promise<Instrument | null> {
    return this.getProvider(providerId).getInstrument(symbol);
  }

  async getQuote(
    symbol: string,
    providerId?: string,
  ): Promise<Quote | null> {
    return this.getProvider(providerId).getQuote(symbol);
  }

  async getHistoricalPrices(
    request: HistoricalPriceRequest,
    providerId?: string,
  ): Promise<OHLCVBar[]> {
    return this.getProvider(providerId).getHistoricalPrices(request);
  }

  async listExchanges(
    providerId?: string,
  ): Promise<Exchange[]> {
    return this.getProvider(providerId).listExchanges();
  }
}