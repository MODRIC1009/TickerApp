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

export interface MarketDataProviderCapabilities {
  searchInstruments: boolean;
  instrumentDetails: boolean;
  quotes: boolean;
  historicalPrices: boolean;
  exchanges: boolean;
}

export type MarketDataProviderHealthStatus =
  | "healthy"
  | "degraded"
  | "unavailable";

export interface MarketDataProviderHealth {
  status: MarketDataProviderHealthStatus;
  checkedAt: string;
  message?: string;
}

export interface MarketDataProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: MarketDataProviderCapabilities;
  healthCheck(): Promise<MarketDataProviderHealth>;

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
export {
  MarketDataService,
} from "./market-data-service";

export type {
  MarketDataProviderSummary,
} from "./market-data-service";
export {
  createMarketDataService,
} from "./container";

export type {
  MarketDataContainerOptions,
} from "./container";
export { TwelveDataProvider } from "./providers/twelve-data-provider";
export type { TwelveDataProviderOptions } from "./providers/twelve-data-provider";
export { ExchangeRegistry } from "./exchange-registry";
export {
  getMarketSession,
} from "./market-session";

export type {
  MarketSession,
  MarketSessionStatus,
} from "./market-session";
export { GLOBAL_EXCHANGES } from "./exchange-catalog";
export {
  WeekdayTradingCalendar,
} from "./trading-calendar";

export type {
  TradingCalendar,
} from "./trading-calendar";
export {
  HISTORICAL_INTERVALS,
  validateDateRange,
  validateHistoricalInterval,
  validateSymbol,
} from "./request-validation";

export type {
  HistoricalInterval,
  HistoricalRequestInput,
} from "./request-validation";
export {
  createMarketDataConfig,
} from "./config";

export type {
  MarketDataConfig,
} from "./config";
export {
  createInstrumentIdentity,
  getInstrumentIdentityKey,
  normalizeSymbol,
} from "./instrument-identity";

export type {
  CanonicalInstrumentIdentity,
} from "./instrument-identity";
export { InstrumentRegistry } from "./instrument-registry";
export {
  MarketDataError,
} from "./errors";

export type {
  MarketDataErrorCode,
} from "./errors";
export type {
  MarketDataApiError,
  MarketDataApiSuccess,
  MarketDataApiList,
} from "./api-types";