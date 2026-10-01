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
  MarketDataProviderHealth,
} from "../index";

import { MarketDataError } from "../errors";
import {
  normalizeProviderInstrument,
} from "../instrument-normalizer";

interface TwelveDataResponse {
  status?: string;
  message?: string;
}

interface TwelveDataQuoteResponse
  extends TwelveDataResponse {
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

interface TwelveDataTimeSeriesResponse
  extends TwelveDataResponse {
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

interface TwelveDataSymbolSearchResponse
  extends TwelveDataResponse {
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

export class TwelveDataProvider
  implements MarketDataProvider
{
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

  constructor(
    options: TwelveDataProviderOptions,
  ) {
    if (!options.apiKey.trim()) {
      throw new Error(
        "Twelve Data API key is required.",
      );
    }

    this.apiKey = options.apiKey.trim();
    this.baseUrl =
      options.baseUrl ??
      "https://api.twelvedata.com";
  }

  private async request<
    T extends TwelveDataResponse,
  >(
    endpoint: string,
    params: Record<string, string>,
  ): Promise<T> {
    const url = new URL(
      endpoint,
      this.baseUrl,
    );

    for (const [key, value] of Object.entries(
      params,
    )) {
      url.searchParams.set(key, value);
    }

    url.searchParams.set(
      "apikey",
      this.apiKey,
    );

    let response: Response;

    try {
      response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });
    } catch (error) {
      throw new MarketDataError(
        "provider_unavailable",
        "Twelve Data API is unreachable.",
        {
          providerId: this.id,
          cause: error,
        },
      );
    }

    if (response.status === 429) {
      throw new MarketDataError(
        "rate_limited",
        "Twelve Data API rate limit exceeded.",
        {
          providerId: this.id,
        },
      );
    }

    if (!response.ok) {
      throw new MarketDataError(
        "provider_error",
        `Twelve Data request failed with HTTP ${response.status}.`,
        {
          providerId: this.id,
        },
      );
    }

    const data =
      (await response.json()) as T;

    if (data.status === "error") {
      throw new MarketDataError(
        "provider_error",
        data.message ??
          "Twelve Data returned an API error.",
        {
          providerId: this.id,
        },
      );
    }

    return data;
  }

  async searchInstruments(
    query: string,
  ): Promise<InstrumentSearchResult[]> {
    const normalizedQuery =
      query.trim();

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

    return (response.data ?? []).map(
      (item) => ({
        instrument:
          normalizeProviderInstrument(
            this.id,
            {
              symbol: item.symbol,
              name:
                item.instrument_name,
              exchange:
                item.exchange,
              micCode:
                item.mic_code,
              currency:
                item.currency,
              instrumentType:
                item.instrument_type,
            },
          ),
      }),
    );
  }

  async getInstrument(
    symbol: string,
  ): Promise<Instrument | null> {
    const results =
      await this.searchInstruments(
        symbol,
      );

    const normalizedSymbol =
      symbol.trim().toUpperCase();

    return (
      results.find(
        (result) =>
          result.instrument.symbol.toUpperCase() ===
          normalizedSymbol,
      )?.instrument ??
      results[0]?.instrument ??
      null
    );
  }

  async getQuote(
    symbol: string,
  ): Promise<Quote | null> {
    const response =
      await this.request<TwelveDataQuoteResponse>(
        "/quote",
        {
          symbol: symbol.trim(),
        },
      );

    if (
      !response.symbol ||
      response.close === undefined
    ) {
      return null;
    }

    const price =
      this.toNumber(response.close);

    if (price === null) {
      return null;
    }

    return {
      symbol: response.symbol,
      price,
      change:
        this.toNumber(
          response.change,
        ) ?? 0,
      changePercent:
        this.toNumber(
          response.percent_change,
        ) ?? 0,
      volume:
        this.toNumber(
          response.volume,
        ) ?? 0,
      marketCap:
        this.toNumber(
          response.market_cap,
        ) ?? undefined,
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
          interval:
            this.mapInterval(
              request.interval,
            ),
          start_date:
            request.startDate,
          end_date:
            request.endDate,
          order: "ASC",
          ...(request.outputSize !== undefined
            ? {
                outputsize: String(
                  request.outputSize,
                ),
              }
            : {}),
        },
      );

    return (response.values ?? [])
      .map((bar) => {
        const open =
          this.toNumber(bar.open);

        const high =
          this.toNumber(bar.high);

        const low =
          this.toNumber(bar.low);

        const close =
          this.toNumber(bar.close);

        const volume =
          this.toNumber(bar.volume);

        if (
          open === null ||
          high === null ||
          low === null ||
          close === null
        ) {
          return null;
        }

        const timestamp =
          new Date(
            bar.datetime,
          );

        if (
          Number.isNaN(
            timestamp.getTime(),
          )
        ) {
          return null;
        }

        return {
          timestamp:
            timestamp.toISOString(),
          open,
          high,
          low,
          close,
          volume: volume ?? 0,
        };
      })
      .filter(
        (
          bar,
        ): bar is OHLCVBar =>
          bar !== null,
      );
  }

  async healthCheck(): Promise<MarketDataProviderHealth> {
    try {
      await this.request<TwelveDataQuoteResponse>(
        "/quote",
        {
          symbol: "AAPL",
        },
      );

      return {
        status: "healthy",
        checkedAt:
          new Date().toISOString(),
        message:
          "Twelve Data API is reachable.",
      };
    } catch (error) {
      return {
        status: "unavailable",
        checkedAt:
          new Date().toISOString(),
        message:
          error instanceof Error
            ? error.message
            : "Twelve Data API health check failed.",
      };
    }
  }

  async listExchanges(): Promise<
    Exchange[]
  > {
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

  private toNumber(
    value?: string,
  ): number | null {
    if (
      value === undefined ||
      value === ""
    ) {
      return null;
    }

    const parsed = Number(value);

    return Number.isFinite(parsed)
      ? parsed
      : null;
  }

  private toTimestamp(
    unixTimestamp?: number,
    datetime?: string,
  ): string {
    if (
      unixTimestamp !== undefined
    ) {
      const timestamp = new Date(
        unixTimestamp * 1000,
      );

      if (
        !Number.isNaN(
          timestamp.getTime(),
        )
      ) {
        return timestamp.toISOString();
      }
    }

    if (datetime) {
      const timestamp = new Date(
        datetime,
      );

      if (
        !Number.isNaN(
          timestamp.getTime(),
        )
      ) {
        return timestamp.toISOString();
      }
    }

    return new Date().toISOString();
  }
}
