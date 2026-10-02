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
import { GLOBAL_INSTRUMENTS } from "../instrument-catalog";

interface TwelveDataResponse {
  status?: string;
  message?: string;
}

interface TwelveDataQuoteResponse
  extends TwelveDataResponse {
  symbol?: string;
  name?: string;
  exchange?: string;
  mic_code?: string;
  country?: string;
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
    mic_code?: string;
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
    country?: string;
    currency?: string;
    instrument_type?: string;
  }>;
}

export interface TwelveDataProviderOptions {
  apiKey: string;
  baseUrl?: string;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const SEARCH_CACHE_TTL_MS = 5 * 60_000;
const QUOTE_CACHE_TTL_MS = 60_000;
const HISTORICAL_CACHE_TTL_MS = 6 * 60 * 60_000;
const STALE_CACHE_MAX_AGE_MS = 24 * 60 * 60_000;

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
  private readonly cache = new Map<
    string,
    CacheEntry<unknown>
  >();
  private readonly inFlight = new Map<
    string,
    Promise<unknown>
  >();
  private rateLimitedUntil = 0;

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

  private async request<T extends TwelveDataResponse>(
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
      this.rateLimitedUntil = Math.max(
        this.rateLimitedUntil,
        Date.now() + 61_000,
      );

      throw new MarketDataError(
        "rate_limited",
        "Twelve Data API rate limit exceeded. Cached market data will be used when available; the provider quota resets every minute.",
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

  private async cachedRequest<T extends TwelveDataResponse>(
    cacheKey: string,
    ttlMs: number,
    endpoint: string,
    params: Record<string, string>,
  ): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(cacheKey) as
      | CacheEntry<T>
      | undefined;

    if (
      cached &&
      cached.expiresAt > now
    ) {
      return cached.value;
    }

    if (
      this.rateLimitedUntil > now
    ) {
      if (
        cached &&
        now - cached.expiresAt <=
          STALE_CACHE_MAX_AGE_MS
      ) {
        return cached.value;
      }

      throw new MarketDataError(
        "rate_limited",
        "Twelve Data API is temporarily rate limited. Please retry after the provider quota resets.",
        {
          providerId: this.id,
        },
      );
    }

    const existing = this.inFlight.get(
      cacheKey,
    );

    if (existing) {
      return existing as Promise<T>;
    }

    const request = this.request<T>(
      endpoint,
      params,
    )
      .then((value) => {
        this.rateLimitedUntil = 0;
        this.cache.set(cacheKey, {
          value,
          expiresAt:
            Date.now() + ttlMs,
        });
        return value;
      })
      .catch((error) => {
        if (
          error instanceof MarketDataError &&
          error.code === "rate_limited" &&
          cached &&
          Date.now() - cached.expiresAt <=
            STALE_CACHE_MAX_AGE_MS
        ) {
          return cached.value;
        }

        throw error;
      })
      .finally(() => {
        this.inFlight.delete(cacheKey);
      });

    this.inFlight.set(cacheKey, request);
    return request;
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
      await this.cachedRequest<TwelveDataSymbolSearchResponse>(
        `search:${normalizedQuery.toUpperCase()}`,
        SEARCH_CACHE_TTL_MS,
        "/symbol_search",
        {
          symbol: normalizedQuery,
          outputsize: "30",
        },
      );

    const results = (response.data ?? []).map(
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
              countryCode:
                item.country,
              currency:
                item.currency,
              instrumentType:
                item.instrument_type,
            },
          ),
      }),
    );

    const seen = new Set<string>();
    const normalizedResults =
      results.filter((result) => {
        const instrument = result.instrument;
        const key = [
          instrument.symbol,
          instrument.exchangeId,
          instrument.countryCode,
          instrument.currency,
          instrument.assetClass,
        ].join("|");

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);
        return true;
      });

    if (normalizedResults.length > 0) {
      return normalizedResults;
    }

    const catalogQuery =
      normalizedQuery.toLowerCase();

    return GLOBAL_INSTRUMENTS
      .filter((instrument) =>
        instrument.symbol
          .toLowerCase()
          .includes(catalogQuery) ||
        instrument.name
          .toLowerCase()
          .includes(catalogQuery),
      )
      .map((instrument) => ({
        instrument,
        score:
          instrument.symbol.toLowerCase() ===
          catalogQuery
            ? 1
            : 0.5,
      }));
  }

  async getInstrument(
    symbol: string,
  ): Promise<Instrument | null> {
    const normalizedSymbol =
      symbol.trim().toUpperCase();

    const catalogInstrument =
      GLOBAL_INSTRUMENTS.find(
        (instrument) =>
          instrument.symbol.toUpperCase() ===
          normalizedSymbol,
      );

    if (catalogInstrument) {
      return catalogInstrument;
    }

    const results =
      await this.searchInstruments(
        normalizedSymbol,
      );

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
    const normalizedSymbol =
      symbol.trim().toUpperCase();

    const response =
      await this.cachedRequest<TwelveDataQuoteResponse>(
        `quote:${normalizedSymbol}`,
        QUOTE_CACHE_TTL_MS,
        "/quote",
        {
          symbol: normalizedSymbol,
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
      await this.cachedRequest<TwelveDataTimeSeriesResponse>(
        `history:${request.symbol.trim().toUpperCase()}:${request.startDate}:${request.endDate}:${request.interval}:${request.outputSize ?? ""}`,
        HISTORICAL_CACHE_TTL_MS,
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
          new Date(bar.datetime);

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
      await this.cachedRequest<TwelveDataQuoteResponse>(
        "health:AAPL",
        QUOTE_CACHE_TTL_MS,
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
