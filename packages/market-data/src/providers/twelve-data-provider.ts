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
} from "../index";

interface TwelveDataResponse {
  status?: string;
  message?: string;
}

interface TwelveDataQuoteResponse extends TwelveDataResponse {
  symbol?: string;
  name?: string;
  exchange?: string;
  currency?: string;
  datetime?: string;
  timestamp?: number;
  open?: string;
  high?: string;
  low?: string;
  close?: string;
  volume?: string;
  previous_close?: string;
  change?: string;
  percent_change?: string;
  market_cap?: string;
}

interface TwelveDataTimeSeriesResponse extends TwelveDataResponse {
  meta?: {
    symbol?: string;
    name?: string;
    exchange?: string;
    currency?: string;
    type?: string;
  };
  values?: Array<{
    datetime: string;
    open: string;
    high: string;
    low: string;
    close: string;
    volume?: string;
  }>;
}

interface TwelveDataSymbolSearchResponse extends TwelveDataResponse {
  data?: Array<{
    symbol: string;
    instrument_name?: string;
    exchange?: string;
    mic_code?: string;
    exchange_timezone?: string;
    currency?: string;
    instrument_type?: string;
  }>;
}

export interface TwelveDataProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

export class TwelveDataProvider implements MarketDataProvider {
  readonly id = "twelve-data";
  readonly name = "Twelve Data";
  readonly capabilities = {
  searchInstruments: true,
  instrumentDetails: true,
  quotes: true,
  historicalPrices: true,
  exchanges: false,
};

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: TwelveDataProviderOptions) {
    if (!options.apiKey.trim()) {
      throw new Error("Twelve Data API key is required.");
    }

    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl ?? "https://api.twelvedata.com";
  }

  private async request<T extends TwelveDataResponse>(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<T> {
    const url = new URL(endpoint, this.baseUrl);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    url.searchParams.set("apikey", this.apiKey);

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Twelve Data request failed with HTTP ${response.status}.`,
      );
    }

    const data = (await response.json()) as T;

    if (data.status === "error") {
      throw new Error(
        data.message ?? "Twelve Data returned an API error.",
      );
    }

    return data;
  }

  async searchInstruments(
    query: string,
  ): Promise<InstrumentSearchResult[]> {
    const normalizedQuery = query.trim();

    if (!normalizedQuery) {
      return [];
    }

    const response =
      await this.request<TwelveDataSymbolSearchResponse>(
        "/symbol_search",
        {
          symbol: normalizedQuery,
        },
      );

    return (response.data ?? []).map((item) => ({
      instrument: {
        symbol: item.symbol,
        name: item.instrument_name ?? item.symbol,
        exchangeId: item.mic_code ?? item.exchange ?? "unknown",
        countryCode: "",
        currency: item.currency ?? "USD",
        assetClass: this.mapAssetClass(item.instrument_type),
      },
    }));
  }

  async getInstrument(symbol: string): Promise<Instrument | null> {
    const results = await this.searchInstruments(symbol);

    const normalizedSymbol = symbol.trim().toUpperCase();

    return (
      results.find(
        (result) =>
          result.instrument.symbol.toUpperCase() === normalizedSymbol,
      )?.instrument ?? results[0]?.instrument ?? null
    );
  }

  async getQuote(symbol: string): Promise<Quote | null> {
    const response = await this.request<TwelveDataQuoteResponse>(
      "/quote",
      {
        symbol: symbol.trim(),
      },
    );

    if (!response.symbol || response.close === undefined) {
      return null;
    }

    const price = this.toNumber(response.close);

    if (price === null) {
      return null;
    }

    return {
      symbol: response.symbol,
      price,
      change: this.toNumber(response.change) ?? 0,
      changePercent: this.toNumber(response.percent_change) ?? 0,
      volume: this.toNumber(response.volume) ?? 0,
      marketCap: this.toNumber(response.market_cap) ?? undefined,
      timestamp: this.toTimestamp(
        response.timestamp,
        response.datetime,
      ),
    };
  }

  async getHistoricalPrices(
    request: HistoricalPriceRequest,
  ): Promise<OHLCVBar[]> {
    const response =
      await this.request<TwelveDataTimeSeriesResponse>(
        "/time_series",
        {
          symbol: request.symbol.trim(),
          interval: this.mapInterval(request.interval),
          start_date: request.startDate,
          end_date: request.endDate,
          order: "ASC",
        },
      );

    return (response.values ?? [])
      .map((bar) => {
        const open = this.toNumber(bar.open);
        const high = this.toNumber(bar.high);
        const low = this.toNumber(bar.low);
        const close = this.toNumber(bar.close);
        const volume = this.toNumber(bar.volume);

        if (
          open === null ||
          high === null ||
          low === null ||
          close === null
        ) {
          return null;
        }

        return {
          timestamp: new Date(bar.datetime).toISOString(),
          open,
          high,
          low,
          close,
          volume: volume ?? 0,
        };
      })
      .filter((bar): bar is OHLCVBar => bar !== null);
  }

  async listExchanges(): Promise<Exchange[]> {
  throw new Error(
    "Twelve Data exchange listing is not implemented yet.",
  );
}

  private mapInterval(
    interval: HistoricalPriceRequest["interval"],
  ): string {
    switch (interval) {
      case "1d":
        return "1day";
      case "1h":
        return "1h";
      case "15m":
        return "15min";
      case "5m":
        return "5min";
    }
  }

  private mapAssetClass(
    type?: string,
  ): Instrument["assetClass"] {
    switch (type?.toLowerCase()) {
      case "etf":
        return "etf";
      case "adr":
        return "adr";
      case "reit":
        return "reit";
      case "fund":
      case "mutual fund":
        return "fund";
      default:
        return "equity";
    }
  }

  private toNumber(value?: string): number | null {
    if (value === undefined || value === "") {
      return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }

  private toTimestamp(
    unixTimestamp?: number,
    datetime?: string,
  ): string {
    if (unixTimestamp !== undefined) {
      return new Date(unixTimestamp * 1000).toISOString();
    }

    if (datetime) {
      return new Date(datetime).toISOString();
    }

    return new Date().toISOString();
  }
}