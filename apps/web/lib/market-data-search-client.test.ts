import { afterEach, describe, expect, it, vi } from "vitest";

import {
  searchInstruments,
  type InstrumentSearchResponse,
} from "./market-data-search-client";

describe("searchInstruments", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns an empty result for a blank query without making a request", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({ results: [] }),
          { status: 200 },
        ),
      );

    const result = await searchInstruments("   ");

    expect(result).toEqual({ results: [] });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("searches instruments through the market-data API", async () => {
    const response: InstrumentSearchResponse = {
      results: [
        {
          instrument: {
            symbol: "AAPL",
            name: "Apple Inc.",
            exchangeId: "nasdaq",
            countryCode: "US",
            currency: "USD",
            assetClass: "equity",
          },
          score: 1,
        },
      ],
    };

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify(response), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }),
      );

    const result = await searchInstruments(" apple ");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/market-data/search?q=apple",
    );
    expect(result).toEqual(response);
  });

  it("encodes special characters in the search query", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(
          JSON.stringify({ results: [] }),
          { status: 200 },
        ),
      );

    await searchInstruments("Berkshire & Hathaway");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/market-data/search?q=Berkshire%20%26%20Hathaway",
    );
  });

  it("throws the API error message when the request fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "Market instrument search failed.",
        }),
        {
          status: 502,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    await expect(
      searchInstruments("AAPL"),
    ).rejects.toThrow(
      "Market instrument search failed.",
    );
  });

  it("uses a fallback error when the failed response has no message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({}),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    );

    await expect(
      searchInstruments("AAPL"),
    ).rejects.toThrow(
      "Failed to search instruments.",
    );
  });
});