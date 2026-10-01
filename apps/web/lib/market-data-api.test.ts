import { describe, expect, it } from "vitest";

import {
  getMarketDataErrorStatus,
  marketDataErrorResponse,
} from "./market-data-api";

describe("market-data-api", () => {
  describe("getMarketDataErrorStatus", () => {
    it("maps rate-limit errors to HTTP 429", () => {
      expect(
        getMarketDataErrorStatus(
          new Error(
            "Provider rate limit exceeded.",
          ),
        ),
      ).toBe(429);
    });

    it("maps not-found errors to HTTP 404", () => {
      expect(
        getMarketDataErrorStatus(
          new Error(
            "Instrument not found.",
          ),
        ),
      ).toBe(404);
    });

    it("maps validation errors to HTTP 400", () => {
      expect(
        getMarketDataErrorStatus(
          new Error(
            "A ticker symbol is required.",
          ),
        ),
      ).toBe(400);
    });

    it("maps unavailable and timeout errors to HTTP 503", () => {
      expect(
        getMarketDataErrorStatus(
          new Error(
            "Provider unavailable.",
          ),
        ),
      ).toBe(503);

      expect(
        getMarketDataErrorStatus(
          new Error(
            "Provider request timed out.",
          ),
        ),
      ).toBe(503);
    });

    it("maps unknown errors to HTTP 500", () => {
      expect(
        getMarketDataErrorStatus(
          new Error(
            "Something unexpected happened.",
          ),
        ),
      ).toBe(500);
    });
  });

  describe("marketDataErrorResponse", () => {
    it("uses the error message when one is available", async () => {
      const response =
        marketDataErrorResponse(
          new Error(
            "Market provider failed.",
          ),
          "Fallback message.",
        );

      expect(response.status).toBe(500);

      await expect(
        response.json(),
      ).resolves.toEqual({
        error:
          "Market provider failed.",
        code: "internal_error",
      });
    });

    it("uses the fallback message when the error has no message", async () => {
      const response =
        marketDataErrorResponse(
          {},
          "Market data request failed.",
        );

      expect(response.status).toBe(500);

      await expect(
        response.json(),
      ).resolves.toEqual({
        error:
          "Market data request failed.",
        code: "internal_error",
      });
    });
  });
});