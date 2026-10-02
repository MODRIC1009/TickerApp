import { describe, expect, it, vi } from "vitest";

import { TwelveDataProvider } from "./twelve-data-provider";

describe("TwelveDataProvider cache resilience", () => {
  it("resolves catalog instruments without spending a provider search request", async () => {
    const originalFetch = globalThis.fetch;
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    try {
      const provider = new TwelveDataProvider({
        apiKey: "test-api-key",
      });

      const instrument = await provider.getInstrument("NVDA");

      expect(instrument).toMatchObject({
        symbol: "NVDA",
        name: "NVIDIA Corporation",
        exchangeId: "nasdaq",
        countryCode: "US",
        currency: "USD",
        assetClass: "equity",
      });
      expect(fetchMock).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it("serves stale cached quotes when the provider becomes rate limited", async () => {
    const originalFetch = globalThis.fetch;
    const originalDateNow = Date.now;
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            status: "ok",
            symbol: "NVDA",
            close: "178.32",
            change: "-2.14",
            percent_change: "-1.19",
            volume: "62450000",
            timestamp: 1757066400,
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response("Too many requests", {
          status: 429,
        }),
      );

    globalThis.fetch = fetchMock;

    try {
      const provider = new TwelveDataProvider({
        apiKey: "test-api-key",
      });

      const initialQuote = await provider.getQuote("NVDA");

      Date.now = () => originalDateNow() + 61_000;

      const staleQuote = await provider.getQuote("NVDA");

      expect(staleQuote).toEqual(initialQuote);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      Date.now = originalDateNow;
      globalThis.fetch = originalFetch;
    }
  });
});
