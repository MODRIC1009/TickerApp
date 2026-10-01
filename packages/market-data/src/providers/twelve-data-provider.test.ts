import { describe, expect, it, vi } from "vitest";

import { TwelveDataProvider } from "./twelve-data-provider";

describe("TwelveDataProvider", () => {
  it("has the expected provider identity and capabilities", () => {
    const provider = new TwelveDataProvider({
      apiKey: "test-api-key",
    });

    expect(provider.id).toBe("twelve-data");
    expect(provider.name).toBe("Twelve Data");

    expect(provider.capabilities).toEqual({
      searchInstruments: true,
      instrumentDetails: true,
      quotes: true,
      historicalPrices: true,
      exchanges: false,
    });
  });

  it("requires an API key", () => {
    expect(
      () =>
        new TwelveDataProvider({
          apiKey: "   ",
        }),
    ).toThrow(
      "Twelve Data API key is required.",
    );
  });

  it("trims the configured API key", () => {
    const provider = new TwelveDataProvider({
      apiKey: "  test-api-key  ",
    });

    expect(provider).toBeInstanceOf(
      TwelveDataProvider,
    );
  });

  it("normalizes symbol search results to canonical exchange metadata", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: "ok",
            data: [
              {
                symbol: "AAPL",
                instrument_name:
                  "Apple Inc.",
                exchange: "NASDAQ",
                mic_code: "XNAS",
                exchange_timezone:
                  "America/New_York",
                currency: "USD",
                instrument_type:
                  "Common Stock",
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
    );

    try {
      const provider =
        new TwelveDataProvider({
          apiKey: "test-api-key",
        });

      const results =
        await provider.searchInstruments(
          "AAPL",
        );

      expect(results).toEqual([
        {
          instrument: {
            symbol: "AAPL",
            name: "Apple Inc.",
            exchangeId: "nasdaq",
            countryCode: "US",
            currency: "USD",
            assetClass: "equity",
            metadata: {
              source: {
                providerId:
                  "twelve-data",
                providerSymbol:
                  "AAPL",
                providerExchangeId:
                  "XNAS",
              },
            },
          },
        },
      ]);

      expect(globalThis.fetch).toHaveBeenCalledTimes(
        1,
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("normalizes non-equity instrument types", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: "ok",
            data: [
              {
                symbol: "SPY",
                instrument_name:
                  "SPDR S&P 500 ETF Trust",
                exchange: "NYSE",
                mic_code: "XNYS",
                currency: "USD",
                instrument_type:
                  "ETF",
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
    );

    try {
      const provider =
        new TwelveDataProvider({
          apiKey: "test-api-key",
        });

      const results =
        await provider.searchInstruments(
          "SPY",
        );

      expect(
        results[0].instrument,
      ).toMatchObject({
        symbol: "SPY",
        exchangeId: "nyse",
        countryCode: "US",
        assetClass: "etf",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("returns an exact instrument match from search results", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: "ok",
            data: [
              {
                symbol: "AAPL",
                instrument_name:
                  "Apple Inc.",
                exchange: "NASDAQ",
                mic_code: "XNAS",
                currency: "USD",
                instrument_type:
                  "Common Stock",
              },
              {
                symbol: "AAP",
                instrument_name:
                  "Advance Auto Parts",
                exchange: "NYSE",
                mic_code: "XNYS",
                currency: "USD",
                instrument_type:
                  "Common Stock",
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
    );

    try {
      const provider =
        new TwelveDataProvider({
          apiKey: "test-api-key",
        });

      const instrument =
        await provider.getInstrument(
          "AAPL",
        );

      expect(instrument).toMatchObject({
        symbol: "AAPL",
        name: "Apple Inc.",
        exchangeId: "nasdaq",
        countryCode: "US",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("returns null when symbol search has no results", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: "ok",
            data: [],
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
    );

    try {
      const provider =
        new TwelveDataProvider({
          apiKey: "test-api-key",
        });

      const instrument =
        await provider.getInstrument(
          "UNKNOWN",
        );

      expect(instrument).toBeNull();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("normalizes quote responses", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: "ok",
            symbol: "AAPL",
            close: "232.45",
            change: "1.82",
            percent_change: "0.79",
            volume: "48210000",
            market_cap:
              "3450000000000",
            timestamp: 1757066400,
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
    );

    try {
      const provider =
        new TwelveDataProvider({
          apiKey: "test-api-key",
        });

      const quote =
        await provider.getQuote("AAPL");

      expect(quote).toMatchObject({
        symbol: "AAPL",
        price: 232.45,
        change: 1.82,
        changePercent: 0.79,
        volume: 48210000,
        marketCap:
          3450000000000,
      });

      expect(quote?.timestamp).toBe(
        new Date(
          1757066400 * 1000,
        ).toISOString(),
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("normalizes historical time-series responses", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: "ok",
            values: [
              {
                datetime:
                  "2026-09-01T00:00:00Z",
                open: "100",
                high: "105",
                low: "98",
                close: "103",
                volume: "1000000",
              },
              {
                datetime:
                  "2026-09-02T00:00:00Z",
                open: "103",
                high: "108",
                low: "101",
                close: "107",
                volume: "1200000",
              },
            ],
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
    );

    try {
      const provider =
        new TwelveDataProvider({
          apiKey: "test-api-key",
        });

      const bars =
        await provider.getHistoricalPrices({
          symbol: "AAPL",
          startDate:
            "2026-09-01T00:00:00.000Z",
          endDate:
            "2026-09-02T00:00:00.000Z",
          interval: "1d",
        });

      expect(bars).toEqual([
        {
          timestamp:
            "2026-09-01T00:00:00.000Z",
          open: 100,
          high: 105,
          low: 98,
          close: 103,
          volume: 1000000,
        },
        {
          timestamp:
            "2026-09-02T00:00:00.000Z",
          open: 103,
          high: 108,
          low: 101,
          close: 107,
          volume: 1200000,
        },
      ]);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("reports unavailable when the API request cannot be completed", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () => {
        throw new Error(
          "Network failure",
        );
      },
    );

    try {
      const provider =
        new TwelveDataProvider({
          apiKey: "test-api-key",
        });

      await expect(
        provider.getQuote("AAPL"),
      ).rejects.toMatchObject({
        code: "provider_unavailable",
        providerId: "twelve-data",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("maps rate limiting responses", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          "Too many requests",
          {
            status: 429,
          },
        ),
    );

    try {
      const provider =
        new TwelveDataProvider({
          apiKey: "test-api-key",
        });

      await expect(
        provider.getQuote("AAPL"),
      ).rejects.toMatchObject({
        code: "rate_limited",
        providerId: "twelve-data",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("maps provider HTTP errors", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          "Internal server error",
          {
            status: 500,
            statusText:
              "Internal Server Error",
          },
        ),
    );

    try {
      const provider =
        new TwelveDataProvider({
          apiKey: "test-api-key",
        });

      await expect(
        provider.getQuote("AAPL"),
      ).rejects.toMatchObject({
        code: "provider_error",
        providerId: "twelve-data",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("maps API-level errors", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: "error",
            code: 401,
            message:
              "Invalid API key.",
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
    );

    try {
      const provider =
        new TwelveDataProvider({
          apiKey: "test-api-key",
        });

      await expect(
        provider.getQuote("AAPL"),
      ).rejects.toMatchObject({
        code: "provider_error",
        providerId: "twelve-data",
      });
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("reports healthy status when the provider health request succeeds", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            status: "ok",
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        ),
    );

    try {
      const provider =
        new TwelveDataProvider({
          apiKey: "test-api-key",
        });

      const health =
        await provider.healthCheck();

      expect(health.status).toBe(
        "healthy",
      );

      expect(health.message).toBe(
        "Twelve Data API is reachable.",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("reports unavailable status when the health request fails", async () => {
    const originalFetch = globalThis.fetch;

    globalThis.fetch = vi.fn(
      async () => {
        throw new Error(
          "Network failure",
        );
      },
    );

    try {
      const provider =
        new TwelveDataProvider({
          apiKey: "test-api-key",
        });

      const health =
        await provider.healthCheck();

      expect(health.status).toBe(
        "unavailable",
      );

      expect(health.message).toBe(
        "Twelve Data API is unreachable.",
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("does not support exchange listing yet", async () => {
    const provider =
      new TwelveDataProvider({
        apiKey: "test-api-key",
      });

    await expect(
      provider.listExchanges(),
    ).rejects.toThrow(
      "Twelve Data exchange listing is not implemented yet.",
    );
  });
});