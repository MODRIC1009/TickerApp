import { describe, expect, it } from "vitest";

import { GLOBAL_EXCHANGES } from "./exchange-catalog";

describe("GLOBAL_EXCHANGES", () => {
  it("contains the expected global exchange coverage", () => {
    expect(GLOBAL_EXCHANGES).toHaveLength(20);

    const exchangeIds = GLOBAL_EXCHANGES.map(
      (exchange) => exchange.id,
    );

    expect(exchangeIds).toEqual(
      expect.arrayContaining([
        "nasdaq",
        "nyse",
        "tsx",
        "lse",
        "xetra",
        "euronext-paris",
        "euronext-amsterdam",
        "six",
        "nse",
        "jpx",
        "hkex",
        "sse",
        "szse",
        "krx",
        "twse",
        "sgx",
        "asx",
        "b3",
        "bmv",
        "jse",
      ]),
    );
  });

  it("contains unique exchange identifiers", () => {
    const ids = GLOBAL_EXCHANGES.map(
      (exchange) => exchange.id,
    );

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("contains valid session definitions", () => {
    for (const exchange of GLOBAL_EXCHANGES) {
      expect(exchange.countryCode).toMatch(/^[A-Z]{2}$/);
      expect(exchange.currency).toMatch(/^[A-Z]{3}$/);
      expect(exchange.timezone).toBeTruthy();
      expect(exchange.regularSession.open).toMatch(
        /^\d{2}:\d{2}$/,
      );
      expect(exchange.regularSession.close).toMatch(
        /^\d{2}:\d{2}$/,
      );
    }
  });

  it("includes representative markets across regions", () => {
    expect(
      GLOBAL_EXCHANGES.some(
        (exchange) =>
          exchange.region === "north-america",
      ),
    ).toBe(true);

    expect(
      GLOBAL_EXCHANGES.some(
        (exchange) => exchange.region === "europe",
      ),
    ).toBe(true);

    expect(
      GLOBAL_EXCHANGES.some(
        (exchange) =>
          exchange.region === "asia-pacific",
      ),
    ).toBe(true);

    expect(
      GLOBAL_EXCHANGES.some(
        (exchange) =>
          exchange.region === "latin-america",
      ),
    ).toBe(true);

    expect(
      GLOBAL_EXCHANGES.some(
        (exchange) => exchange.region === "africa",
      ),
    ).toBe(true);
  });
});