import { describe, expect, it } from "vitest";

import { MarketDataError } from "@tickerapp/market-data";

import {
  getMarketDataErrorStatus,
  marketDataErrorResponse,
} from "./market-data-api";

describe("market-data-api", () => {
  it("maps market data errors to HTTP status codes", () => {
    expect(
      getMarketDataErrorStatus(
        new MarketDataError(
          "invalid_request",
          "Invalid request.",
        ),
      ),
    ).toBe(400);

    expect(
      getMarketDataErrorStatus(
        new MarketDataError(
          "not_found",
          "Not found.",
        ),
      ),
    ).toBe(404);

    expect(
      getMarketDataErrorStatus(
        new MarketDataError(
          "rate_limited",
          "Rate limited.",
        ),
      ),
    ).toBe(429);

    expect(
      getMarketDataErrorStatus(
        new MarketDataError(
          "unsupported_capability",
          "Unsupported.",
        ),
      ),
    ).toBe(501);

    expect(
      getMarketDataErrorStatus(
        new MarketDataError(
          "provider_unavailable",
          "Unavailable.",
        ),
      ),
    ).toBe(502);

    expect(
      getMarketDataErrorStatus(
        new MarketDataError(
          "provider_error",
          "Provider error.",
        ),
      ),
    ).toBe(502);

    expect(
      getMarketDataErrorStatus(
        new Error("Unexpected error."),
      ),
    ).toBe(502);
  });

  it("returns structured error responses", async () => {
    const response = marketDataErrorResponse(
      new MarketDataError(
        "rate_limited",
        "Provider rate limit reached.",
        {
          providerId: "twelve-data",
        },
      ),
      "Fallback message.",
    );

    expect(response.status).toBe(429);

    expect(await response.json()).toEqual({
      error: "Provider rate limit reached.",
      code: "rate_limited",
      providerId: "twelve-data",
    });
  });

  it("uses the fallback message for unknown errors", async () => {
    const response = marketDataErrorResponse(
      new Error("Unexpected failure."),
      "Market data request failed.",
    );

    expect(response.status).toBe(502);

    expect(await response.json()).toEqual({
      error: "Market data request failed.",
    });
  });
});