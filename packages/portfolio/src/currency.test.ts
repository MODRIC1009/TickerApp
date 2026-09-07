import { describe, expect, it } from "vitest";

import {
  convertCurrency,
  normalizeCurrency,
  type FxRate,
  type FxRateProvider,
} from "./currency";

describe("normalizeCurrency", () => {
  it("normalizes currency codes", () => {
    expect(normalizeCurrency(" usd ")).toBe("USD");
    expect(normalizeCurrency("eur")).toBe("EUR");
  });

  it("preserves empty input as empty", () => {
    expect(normalizeCurrency("")).toBe("");
    expect(normalizeCurrency("   ")).toBe("");
  });
});

describe("convertCurrency", () => {
  it("converts between different currencies", () => {
    expect(
      convertCurrency(100, "USD", "EUR", 0.9),
    ).toBe(90);
  });

  it("normalizes currency codes before conversion", () => {
    expect(
      convertCurrency(100, "usd", "eur", 0.9),
    ).toBe(90);
  });

  it("returns the original amount for the same currency", () => {
    expect(
      convertCurrency(100, "USD", "USD", 0.9),
    ).toBe(100);
  });

  it("supports negative amounts", () => {
    expect(
      convertCurrency(-100, "USD", "EUR", 0.9),
    ).toBe(-90);
  });

  it("rejects non-finite amounts", () => {
    expect(() =>
      convertCurrency(
        Number.NaN,
        "USD",
        "EUR",
        0.9,
      ),
    ).toThrow("Amount must be finite.");

    expect(() =>
      convertCurrency(
        Number.POSITIVE_INFINITY,
        "USD",
        "EUR",
        0.9,
      ),
    ).toThrow("Amount must be finite.");
  });

  it("rejects invalid FX rates", () => {
    expect(() =>
      convertCurrency(100, "USD", "EUR", 0),
    ).toThrow("FX rate must be a positive finite number.");

    expect(() =>
      convertCurrency(100, "USD", "EUR", -1),
    ).toThrow("FX rate must be a positive finite number.");

    expect(() =>
      convertCurrency(
        100,
        "USD",
        "EUR",
        Number.NaN,
      ),
    ).toThrow("FX rate must be a positive finite number.");

    expect(() =>
      convertCurrency(
        100,
        "USD",
        "EUR",
        Number.POSITIVE_INFINITY,
      ),
    ).toThrow("FX rate must be a positive finite number.");
  });

  it("rejects missing currencies", () => {
    expect(() =>
      convertCurrency(100, "", "EUR", 0.9),
    ).toThrow("Both currencies are required.");

    expect(() =>
      convertCurrency(100, "USD", "", 0.9),
    ).toThrow("Both currencies are required.");

    expect(() =>
      convertCurrency(100, "   ", "EUR", 0.9),
    ).toThrow("Both currencies are required.");
  });
});

describe("FxRate", () => {
  it("represents an FX rate", () => {
    const rate: FxRate = {
      fromCurrency: "USD",
      toCurrency: "EUR",
      rate: 0.9,
      asOf: "2026-09-06T10:00:00.000Z",
    };

    expect(rate).toEqual({
      fromCurrency: "USD",
      toCurrency: "EUR",
      rate: 0.9,
      asOf: "2026-09-06T10:00:00.000Z",
    });
  });
});

describe("FxRateProvider", () => {
  it("supports asynchronous FX rate lookup", async () => {
    const provider: FxRateProvider = {
      async getRate(fromCurrency, toCurrency) {
        return {
          fromCurrency,
          toCurrency,
          rate: 0.9,
          asOf: "2026-09-06T10:00:00.000Z",
        };
      },
    };

    await expect(
      provider.getRate("USD", "EUR"),
    ).resolves.toEqual({
      fromCurrency: "USD",
      toCurrency: "EUR",
      rate: 0.9,
      asOf: "2026-09-06T10:00:00.000Z",
    });
  });
});