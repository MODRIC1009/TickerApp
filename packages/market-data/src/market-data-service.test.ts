import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import type {
  Instrument,
  Quote,
} from "@tickerapp/shared";

import type {
  HistoricalPriceRequest,
  InstrumentSearchResult,
  MarketDataProvider,
  MarketDataProviderHealth,
} from "./index";

import { MarketDataError } from "./errors";
import { MarketDataProviderRegistry } from "./provider-registry";
import { MarketDataService } from "./market-data-service";

function createProvider(
  overrides: Partial<MarketDataProvider> = {},
): MarketDataProvider {
  return {
    id: "test-provider",
    name: "Test Provider",
    capabilities: {
      searchInstruments: true,
      instrumentDetails: true,
      quotes: true,
      historicalPrices: true,
      exchanges: true,
    },
    searchInstruments: vi.fn(
      async (): Promise<
        InstrumentSearchResult[]
      > => [],
    ),
    getInstrument: vi.fn(
      async (): Promise<
        Instrument | null
      > => null,
    ),
    getQuote: vi.fn(
      async (): Promise<
        Quote | null
      > => null,
    ),
    getHistoricalPrices: vi.fn(
      async (
        _request: HistoricalPriceRequest,
      ) => [],
    ),
    listExchanges: vi.fn(
      async () => [],
    ),
    healthCheck: vi.fn(
      async (): Promise<MarketDataProviderHealth> => ({
        status: "healthy",
        checkedAt:
          new Date().toISOString(),
      }),
    ),
    ...overrides,
  };
}

describe("MarketDataService", () => {
  it("uses the default provider", () => {
    const provider =
      createProvider();

    const registry =
      new MarketDataProviderRegistry();

    registry.register(provider);

    const service =
      new MarketDataService(
        registry,
        provider.id,
      );

    expect(
      service.getDefaultProvider(),
    ).toBe(provider);
  });

  it("rejects an unknown provider", async () => {
    const provider =
      createProvider();

    const registry =
      new MarketDataProviderRegistry();

    registry.register(provider);

    const service =
      new MarketDataService(
        registry,
        provider.id,
      );

    await expect(
      service.getQuote(
        "AAPL",
        "unknown-provider",
      ),
    ).rejects.toMatchObject({
      code: "invalid_request",
      providerId:
        "unknown-provider",
    });
  });

  it("does not fallback by default when a provider operation fails", async () => {
    const primary =
      createProvider({
        id: "primary",
        name: "Primary",
        getQuote: vi.fn(
          async () => {
            throw new MarketDataError(
              "provider_unavailable",
              "Primary unavailable.",
              {
                providerId:
                  "primary",
              },
            );
          },
        ),
      });

    const fallbackQuote: Quote = {
      symbol: "AAPL",
      price: 200,
      change: 1,
      changePercent: 0.5,
      volume: 1_000,
      marketCap: 1_000_000,
      timestamp:
        "2026-09-05T00:00:00Z",
    };

    const fallback =
      createProvider({
        id: "fallback",
        name: "Fallback",
        getQuote: vi.fn(
          async () =>
            fallbackQuote,
        ),
      });

    const registry =
      new MarketDataProviderRegistry();

    registry.register(primary);
    registry.register(fallback);

    const service =
      new MarketDataService(
        registry,
        "primary",
      );

    await expect(
      service.getQuote("AAPL"),
    ).rejects.toMatchObject({
      code: "provider_unavailable",
      providerId: "primary",
    });

    expect(
      primary.getQuote,
    ).toHaveBeenCalled();

    expect(
      fallback.getQuote,
    ).not.toHaveBeenCalled();
  });

  it("falls back when fallback is explicitly enabled", async () => {
    const primary =
      createProvider({
        id: "primary",
        name: "Primary",
        getQuote: vi.fn(
          async () => {
            throw new MarketDataError(
              "provider_unavailable",
              "Primary unavailable.",
              {
                providerId:
                  "primary",
              },
            );
          },
        ),
      });

    const fallbackQuote: Quote = {
      symbol: "AAPL",
      price: 200,
      change: 1,
      changePercent: 0.5,
      volume: 1_000,
      marketCap: 1_000_000,
      timestamp:
        "2026-09-05T00:00:00Z",
    };

    const fallback =
      createProvider({
        id: "fallback",
        name: "Fallback",
        getQuote: vi.fn(
          async () =>
            fallbackQuote,
        ),
      });

    const registry =
      new MarketDataProviderRegistry();

    registry.register(primary);
    registry.register(fallback);

    const service =
      new MarketDataService(
        registry,
        "primary",
        undefined,
        {
          allowFallback: true,
        },
      );

    const quote =
      await service.getQuote("AAPL");

    expect(quote).toEqual(
      fallbackQuote,
    );

    expect(
      primary.getQuote,
    ).toHaveBeenCalled();

    expect(
      fallback.getQuote,
    ).toHaveBeenCalled();
  });

  it("does not fallback for not-found errors", async () => {
    const primary =
      createProvider({
        id: "primary",
        getQuote: vi.fn(
          async () => {
            throw new MarketDataError(
              "not_found",
              "Quote not found.",
              {
                providerId:
                  "primary",
              },
            );
          },
        ),
      });

    const fallback =
      createProvider({
        id: "fallback",
        getQuote: vi.fn(
          async () => ({
            symbol: "AAPL",
            price: 200,
            change: 0,
            changePercent: 0,
            volume: 0,
            timestamp:
              "2026-09-05T00:00:00Z",
          }),
        ),
      });

    const registry =
      new MarketDataProviderRegistry();

    registry.register(primary);
    registry.register(fallback);

    const service =
      new MarketDataService(
        registry,
        "primary",
        undefined,
        {
          allowFallback: true,
        },
      );

    await expect(
      service.getQuote("AAPL"),
    ).rejects.toMatchObject({
      code: "not_found",
    });

    expect(
      fallback.getQuote,
    ).not.toHaveBeenCalled();
  });

  it("routes to a capable fallback provider when fallback is enabled", async () => {
    const primary =
      createProvider({
        id: "primary",
        capabilities: {
          searchInstruments: true,
          instrumentDetails: true,
          quotes: true,
          historicalPrices: true,
          exchanges: false,
        },
        listExchanges: vi.fn(
          async () => {
            throw new Error(
              "Should not be called.",
            );
          },
        ),
      });

    const fallback =
      createProvider({
        id: "fallback",
        listExchanges: vi.fn(
          async () => [
            {
              id: "nse",
              name: "National Stock Exchange of India",
              countryCode: "IN",
              region:
                "asia-pacific",
              currency: "INR",
              timezone:
                "Asia/Kolkata",
              regularSession: {
                open: "09:15",
                close: "15:30",
              },
            },
          ],
        ),
      });

    const registry =
      new MarketDataProviderRegistry();

    registry.register(primary);
    registry.register(fallback);

    const service =
      new MarketDataService(
        registry,
        "primary",
        undefined,
        {
          allowFallback: true,
        },
      );

    const exchanges =
      await service.listExchanges();

    expect(exchanges).toHaveLength(
      1,
    );

    expect(
      primary.listExchanges,
    ).not.toHaveBeenCalled();

    expect(
      fallback.listExchanges,
    ).toHaveBeenCalled();
  });

  it("rejects unsupported capabilities when fallback is disabled", async () => {
    const primary =
      createProvider({
        id: "primary",
        capabilities: {
          searchInstruments: true,
          instrumentDetails: true,
          quotes: true,
          historicalPrices: true,
          exchanges: false,
        },
      });

    const fallback =
      createProvider({
        id: "fallback",
        listExchanges: vi.fn(
          async () => [],
        ),
      });

    const registry =
      new MarketDataProviderRegistry();

    registry.register(primary);
    registry.register(fallback);

    const service =
      new MarketDataService(
        registry,
        "primary",
      );

    await expect(
      service.listExchanges(),
    ).rejects.toMatchObject({
      code:
        "unsupported_capability",
      providerId: "primary",
    });

    expect(
      fallback.listExchanges,
    ).not.toHaveBeenCalled();
  });

  it("aggregates provider health correctly", async () => {
    const healthy =
      createProvider({
        id: "healthy",
        healthCheck: vi.fn(
          async () => ({
            status:
              "healthy" as const,
            checkedAt:
              "2026-09-05T00:00:00.000Z",
          }),
        ),
      });

    const unavailable =
      createProvider({
        id: "unavailable",
        healthCheck: vi.fn(
          async () => ({
            status:
              "unavailable" as const,
            checkedAt:
              "2026-09-05T00:00:00.000Z",
          }),
        ),
      });

    const registry =
      new MarketDataProviderRegistry();

    registry.register(healthy);
    registry.register(unavailable);

    const service =
      new MarketDataService(
        registry,
        "healthy",
      );

    const health =
      await service.getHealth();

    expect(health.status).toBe(
      "healthy",
    );

    expect(
      health.providers,
    ).toHaveLength(2);

    expect(
      health.providers,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          providerId: "healthy",
          providerName:
            "Test Provider",
          status: "healthy",
        }),
        expect.objectContaining({
          providerId:
            "unavailable",
          providerName:
            "Test Provider",
          status: "unavailable",
        }),
      ]),
    );
  });

  it("returns default provider status and capabilities", () => {
    const provider =
      createProvider({
        id: "primary",
        name: "Primary Provider",
        capabilities: {
          searchInstruments: true,
          instrumentDetails: true,
          quotes: true,
          historicalPrices: false,
          exchanges: true,
        },
      });

    const registry =
      new MarketDataProviderRegistry();

    registry.register(provider);

    const service =
      new MarketDataService(
        registry,
        "primary",
      );

    expect(
      service.getProviderStatus(),
    ).toEqual({
      providerId: "primary",
      providerName:
        "Primary Provider",
      capabilities: {
        searchInstruments: true,
        instrumentDetails: true,
        quotes: true,
        historicalPrices: false,
        exchanges: true,
      },
    });
  });

  it("caches instruments returned by providers", async () => {
    const instrument: Instrument = {
      symbol: "AAPL",
      name: "Apple Inc.",
      exchangeId: "nasdaq",
      countryCode: "US",
      currency: "USD",
      assetClass: "equity",
    };

    const provider =
      createProvider({
        id: "primary",
        getInstrument: vi.fn(
          async () => instrument,
        ),
      });

    const registry =
      new MarketDataProviderRegistry();

    registry.register(provider);

    const service =
      new MarketDataService(
        registry,
        "primary",
      );

    const result =
      await service.getInstrument(
        "aapl",
      );

    expect(result).toEqual(
      instrument,
    );

    expect(
      service.getCachedInstrument(
        "US",
        "nasdaq",
        "AAPL",
      ),
    ).toEqual(instrument);

    expect(
      service.getInstrumentIdentity(
        instrument,
      ),
    ).toEqual({
      symbol: "AAPL",
      exchangeId: "nasdaq",
      countryCode: "US",
      key: "US:nasdaq:AAPL",
    });
  });

  it("normalizes and caches instruments returned from search", async () => {
    const instrument: Instrument = {
      symbol: "aapl",
      name: "Apple Inc.",
      exchangeId: "NASDAQ",
      countryCode: "us",
      currency: "USD",
      assetClass: "equity",
    };

    const provider =
      createProvider({
        id: "primary",
        searchInstruments:
          vi.fn(
            async () => [
              {
                instrument,
                score: 1,
              },
            ],
          ),
      });

    const registry =
      new MarketDataProviderRegistry();

    registry.register(provider);

    const service =
      new MarketDataService(
        registry,
        "primary",
      );

    const results =
      await service.searchInstruments(
        "apple",
      );

    expect(results).toEqual([
      {
        instrument: {
          ...instrument,
          symbol: "AAPL",
        },
        score: 1,
      },
    ]);

    expect(
      service.getCachedInstrument(
        "us",
        "NASDAQ",
        "aapl",
      ),
    ).toEqual({
      ...instrument,
      symbol: "AAPL",
    });

    expect(
      service.getInstrumentIdentity(
        results[0].instrument,
      ),
    ).toEqual({
      symbol: "AAPL",
      exchangeId: "nasdaq",
      countryCode: "US",
      key: "US:nasdaq:AAPL",
    });
  });

  it("delegates historical price requests to the selected provider", async () => {
    const bars = [
      {
        timestamp:
          "2026-09-01T00:00:00.000Z",
        open: 100,
        high: 105,
        low: 98,
        close: 103,
        volume: 1_000_000,
      },
    ];

    const provider =
      createProvider({
        id: "primary",
        getHistoricalPrices:
          vi.fn(
            async (
              _request: HistoricalPriceRequest,
            ) => bars,
          ),
      });

    const registry =
      new MarketDataProviderRegistry();

    registry.register(provider);

    const service =
      new MarketDataService(
        registry,
        "primary",
      );

    const request: HistoricalPriceRequest =
      {
        symbol: "AAPL",
        startDate:
          "2026-09-01T00:00:00.000Z",
        endDate:
          "2026-09-02T00:00:00.000Z",
        interval: "1d",
      };

    const result =
      await service.getHistoricalPrices(
        request,
      );

    expect(result).toEqual(
      bars,
    );

    expect(
      provider.getHistoricalPrices,
    ).toHaveBeenCalledWith(
      request,
    );
  });

  it("uses an explicitly selected provider", async () => {
    const defaultProvider =
      createProvider({
        id: "default",
        getQuote: vi.fn(
          async () => ({
            symbol: "AAPL",
            price: 100,
            change: 1,
            changePercent: 1,
            volume: 1_000,
            timestamp:
              "2026-09-05T00:00:00Z",
          }),
        ),
      });

    const selectedProvider =
      createProvider({
        id: "selected",
        getQuote: vi.fn(
          async () => ({
            symbol: "AAPL",
            price: 200,
            change: 2,
            changePercent: 1,
            volume: 2_000,
            timestamp:
              "2026-09-05T00:00:00Z",
          }),
        ),
      });

    const registry =
      new MarketDataProviderRegistry();

    registry.register(
      defaultProvider,
    );
    registry.register(
      selectedProvider,
    );

    const service =
      new MarketDataService(
        registry,
        "default",
      );

    const quote =
      await service.getQuote(
        "AAPL",
        "selected",
      );

    expect(
      quote?.price,
    ).toBe(200);

    expect(
      defaultProvider.getQuote,
    ).not.toHaveBeenCalled();

    expect(
      selectedProvider.getQuote,
    ).toHaveBeenCalledWith(
      "AAPL",
    );
  });

  it("does not fallback for invalid request errors", async () => {
    const primary =
      createProvider({
        id: "primary",
        getQuote: vi.fn(
          async () => {
            throw new MarketDataError(
              "invalid_request",
              "Invalid symbol.",
              {
                providerId:
                  "primary",
              },
            );
          },
        ),
      });

    const fallback =
      createProvider({
        id: "fallback",
        getQuote: vi.fn(
          async () => ({
            symbol: "AAPL",
            price: 200,
            change: 0,
            changePercent: 0,
            volume: 0,
            timestamp:
              "2026-09-05T00:00:00Z",
          }),
        ),
      });

    const registry =
      new MarketDataProviderRegistry();

    registry.register(primary);
    registry.register(fallback);

    const service =
      new MarketDataService(
        registry,
        "primary",
      );

    await expect(
      service.getQuote("AAPL"),
    ).rejects.toMatchObject({
      code: "invalid_request",
      providerId: "primary",
    });

    expect(
      fallback.getQuote,
    ).not.toHaveBeenCalled();
  });

  it("finds cached instruments by symbol", () => {
    const service =
      new MarketDataService(
        new MarketDataProviderRegistry(),
        "primary",
      );

    const results =
      service.findInstrumentsBySymbol(
        " aapl ",
      );

    expect(results).toHaveLength(1);

    expect(results[0]).toMatchObject({
      symbol: "AAPL",
      countryCode: "US",
      exchangeId: "nasdaq",
    });
  });

  it("finds cached instruments by country", () => {
    const service =
      new MarketDataService(
        new MarketDataProviderRegistry(),
        "primary",
      );

    const results =
      service.findInstrumentsByCountry(
        " us ",
      );

    expect(
      results.length,
    ).toBeGreaterThan(0);

    expect(
      results.every(
        (instrument) =>
          instrument.countryCode ===
          "US",
      ),
    ).toBe(true);
  });

  it("finds cached instruments by exchange", () => {
    const service =
      new MarketDataService(
        new MarketDataProviderRegistry(),
        "primary",
      );

    const results =
      service.findInstrumentsByExchange(
        " NASDAQ ",
      );

    expect(
      results.length,
    ).toBeGreaterThan(0);

    expect(
      results.every(
        (instrument) =>
          instrument.exchangeId ===
          "nasdaq",
      ),
    ).toBe(true);
  });

  it("finds cached instruments by country and exchange", () => {
    const service =
      new MarketDataService(
        new MarketDataProviderRegistry(),
        "primary",
      );

    const results =
      service.findInstrumentsByCountryAndExchange(
        " us ",
        " NASDAQ ",
      );

    expect(
      results.length,
    ).toBeGreaterThan(0);

    expect(
      results.every(
        (instrument) =>
          instrument.countryCode ===
            "US" &&
          instrument.exchangeId ===
            "nasdaq",
      ),
    ).toBe(true);
  });
});