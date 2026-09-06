import { describe, expect, it, vi } from "vitest";

import {
  HistoricalPriceClientError,
  getHistoricalPrices,
} from "./historical-price-client";

describe("historical-price-client", () => {
  it("fetches historical bars using the requested parameters", async () => {
    const bars = [
      {
        timestamp: "2026-01-02T00:00:00.000Z",
        open: 100,
        high: 105,
        low: 98,
        close: 103,
        volume: 1_000_000,
      },
    ];

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            symbol: "AAPL",
            interval: "1d",
            startDate:
              "2026-01-01T00:00:00.000Z",
            endDate:
              "2026-02-01T00:00:00.000Z",
            bars,
          }),
          {
            status: 200,
            headers: {
              "content-type":
                "application/json",
            },
          },
        ),
      );

    const result =
      await getHistoricalPrices(
        "AAPL",
        "2026-01-01",
        "2026-02-01",
        "1d",
      );

    expect(result).toEqual(bars);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/market-data/history?symbol=AAPL&startDate=2026-01-01&endDate=2026-02-01&interval=1d",
    );

    fetchMock.mockRestore();
  });

  it("throws the API error when the request fails", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            error:
              "Historical price request failed.",
          }),
          {
            status: 502,
            headers: {
              "content-type":
                "application/json",
            },
          },
        ),
      );

    await expect(
      getHistoricalPrices(
        "AAPL",
        "2026-01-01",
        "2026-02-01",
      ),
    ).rejects.toEqual(
      expect.objectContaining({
        name:
          "HistoricalPriceClientError",
        status: 502,
        message:
          "Historical price request failed.",
      }),
    );

    fetchMock.mockRestore();
  });

  it("throws when the API returns invalid JSON", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response("not-json", {
          status: 200,
        }),
      );

    await expect(
      getHistoricalPrices(
        "AAPL",
        "2026-01-01",
        "2026-02-01",
      ),
    ).rejects.toBeInstanceOf(
      HistoricalPriceClientError,
    );

    fetchMock.mockRestore();
  });

  it("uses 1d as the default interval", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({
            symbol: "AAPL",
            interval: "1d",
            startDate:
              "2026-01-01T00:00:00.000Z",
            endDate:
              "2026-02-01T00:00:00.000Z",
            bars: [],
          }),
          {
            status: 200,
            headers: {
              "content-type":
                "application/json",
            },
          },
        ),
      );

    await getHistoricalPrices(
      "AAPL",
      "2026-01-01",
      "2026-02-01",
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/market-data/history?symbol=AAPL&startDate=2026-01-01&endDate=2026-02-01&interval=1d",
    );

    fetchMock.mockRestore();
  });
});