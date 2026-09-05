import type {
  Exchange,
  Instrument,
  OHLCVBar,
  Quote,
} from "@tickerapp/shared";

export interface InstrumentSearchResult {
  instrument: Instrument;
  score?: number;
}

export interface HistoricalPriceRequest {
  symbol: string;
  startDate: string;
  endDate: string;
  interval: "1d" | "1h" | "15m" | "5m";
}

export interface MarketDataProvider {
  readonly id: string;
  readonly name: string;

  searchInstruments(query: string): Promise<InstrumentSearchResult[]>;

  getInstrument(symbol: string): Promise<Instrument | null>;

  getQuote(symbol: string): Promise<Quote | null>;

  getHistoricalPrices(
    request: HistoricalPriceRequest,
  ): Promise<OHLCVBar[]>;

  listExchanges(): Promise<Exchange[]>;
}

export { MarketDataProviderRegistry } from "./provider-registry";
export { DemoMarketDataProvider } from "./providers/demo-provider";
export { MarketDataService } from "./market-data-service";
export {
  createMarketDataService,
} from "./container";

export type {
  MarketDataContainerOptions,
} from "./container";
export { TwelveDataProvider } from "./providers/twelve-data-provider";
export type { TwelveDataProviderOptions } from "./providers/twelve-data-provider";
export { ExchangeRegistry } from "./exchange-registry";