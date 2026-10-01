import { describe, expect, it } from "vitest";

import { DemoMarketDataProvider } from "./demo-provider";

describe("DemoMarketDataProvider", () => {
  const provider = new DemoMarketDataProvider();

  it("returns matching instruments from search", async () => {
    const results =
      await provider.searchInstruments("nvidia");

    expect(results).toHaveLength(1);
    expect(results[0].instrument.symbol).toBe(
      "NVDA",
    );
    expect(results[0].instrument.name).toBe(
      "NVIDIA Corporation",
    );
  });

  it("returns an instrument by symbol", async () => {
    const instrument =
      await provider.getInstrument("aapl");

    expect(instrument).toMatchObject({
      symbol: "AAPL",
      name: "Apple Inc.",
      exchangeId: "nasdaq",
      countryCode: "US",
    });
  });

  it("throws not_found for an unknown instrument", async () => {
    await expect(
      provider.getInstrument("UNKNOWN"),
    ).rejects.toMatchObject({
      code: "not_found",
      providerId: "demo",
    });
  });

  it("returns a quote by symbol", async () => {
    const quote =
      await provider.getQuote("AAPL");

    expect(quote).toMatchObject({
      symbol: "AAPL",
      price: 232.45,
    });
  });

  it("generates daily historical bars for 1d", async () => {
    const bars =
      await provider.getHistoricalPrices({
        symbol: "AAPL",
        startDate: "2026-09-01T00:00:00.000Z",
        endDate: "2026-09-03T00:00:00.000Z",
        interval: "1d",
      });

    expect(bars).toHaveLength(3);
    expect(bars[0].timestamp).toBe(
      "2026-09-01T00:00:00.000Z",
    );
    expect(bars[1].timestamp).toBe(
      "2026-09-02T00:00:00.000Z",
    );
  });

  it("generates hourly historical bars for 1h", async () => {
    const bars =
      await provider.getHistoricalPrices({
        symbol: "AAPL",
        startDate: "2026-09-01T00:00:00.000Z",
        endDate: "2026-09-01T03:00:00.000Z",
        interval: "1h",
      });

    expect(bars).toHaveLength(4);
    expect(bars[0].timestamp).toBe(
      "2026-09-01T00:00:00.000Z",
    );
    expect(bars[1].timestamp).toBe(
      "2026-09-01T01:00:00.000Z",
    );
    expect(bars[2].timestamp).toBe(
      "2026-09-01T02:00:00.000Z",
    );
    expect(bars[3].timestamp).toBe(
      "2026-09-01T03:00:00.000Z",
    );
  });

  it("generates 15-minute historical bars", async () => {
    const bars =
      await provider.getHistoricalPrices({
        symbol: "AAPL",
        startDate: "2026-09-01T00:00:00.000Z",
        endDate: "2026-09-01T00:45:00.000Z",
        interval: "15m",
      });

    expect(bars).toHaveLength(4);
    expect(bars[1].timestamp).toBe(
      "2026-09-01T00:15:00.000Z",
    );
    expect(bars[3].timestamp).toBe(
      "2026-09-01T00:45:00.000Z",
    );
  });

  it("generates 5-minute historical bars", async () => {
    const bars =
      await provider.getHistoricalPrices({
        symbol: "AAPL",
        startDate: "2026-09-01T00:00:00.000Z",
        endDate: "2026-09-01T00:20:00.000Z",
        interval: "5m",
      });

    expect(bars).toHaveLength(5);
    expect(bars[1].timestamp).toBe(
      "2026-09-01T00:05:00.000Z",
    );
    expect(bars[4].timestamp).toBe(
      "2026-09-01T00:20:00.000Z",
    );
  });

  it("rejects an invalid date range", async () => {
    await expect(
      provider.getHistoricalPrices({
        symbol: "AAPL",
        startDate: "invalid",
        endDate: "2026-09-03T00:00:00.000Z",
        interval: "1d",
      }),
    ).rejects.toMatchObject({
      code: "invalid_request",
      providerId: "demo",
    });
  });

  it("rejects a reversed date range", async () => {
    await expect(
      provider.getHistoricalPrices({
        symbol: "AAPL",
        startDate: "2026-09-03T00:00:00.000Z",
        endDate: "2026-09-01T00:00:00.000Z",
        interval: "1d",
      }),
    ).rejects.toMatchObject({
      code: "invalid_request",
      providerId: "demo",
    });
  });

  it("returns all global exchanges", async () => {
    const exchanges =
      await provider.listExchanges();

    expect(exchanges).toHaveLength(20);
  });

  it("reports healthy status", async () => {
    const health =
      await provider.healthCheck();

    expect(health.status).toBe("healthy");
    expect(health.message).toBe(
      "Demo market data provider is operational.",
    );
  });
});