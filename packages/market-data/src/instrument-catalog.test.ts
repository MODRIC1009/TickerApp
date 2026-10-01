import { describe, expect, it } from "vitest";

import { GLOBAL_INSTRUMENTS } from "./instrument-catalog";

describe("GLOBAL_INSTRUMENTS", () => {
  it("contains instruments across all supported global regions", () => {
    const countries = new Set(
      GLOBAL_INSTRUMENTS.map(
        (instrument) =>
          instrument.countryCode,
      ),
    );

    expect(countries).toEqual(
      new Set([
        "US",
        "CA",
        "GB",
        "DE",
        "FR",
        "NL",
        "CH",
        "IN",
        "JP",
        "HK",
        "CN",
        "KR",
        "TW",
        "SG",
        "AU",
        "BR",
        "MX",
        "ZA",
      ]),
    );
  });

  it("contains unique canonical instrument identities", () => {
    const identities =
      GLOBAL_INSTRUMENTS.map(
        (instrument) =>
          `${instrument.countryCode}:${instrument.exchangeId}:${instrument.symbol}`,
      );

    expect(
      new Set(identities).size,
    ).toBe(identities.length);
  });

  it("contains only registered global exchanges", () => {
    const supportedExchangeIds =
      new Set([
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
      ]);

    for (const instrument of GLOBAL_INSTRUMENTS) {
      expect(
        supportedExchangeIds.has(
          instrument.exchangeId,
        ),
      ).toBe(true);
    }
  });

  it("uses valid canonical asset classes", () => {
    const validAssetClasses =
      new Set([
        "equity",
        "etf",
        "adr",
        "reit",
        "fund",
      ]);

    for (const instrument of GLOBAL_INSTRUMENTS) {
      expect(
        validAssetClasses.has(
          instrument.assetClass,
        ),
      ).toBe(true);
    }
  });

  it("contains the expected number of seed instruments", () => {
    expect(
      GLOBAL_INSTRUMENTS.length,
    ).toBe(21);
  });

  it("contains representative instruments from the supported markets", () => {
    const symbols =
      new Set(
        GLOBAL_INSTRUMENTS.map(
          (instrument) =>
            instrument.symbol,
        ),
      );

    expect(symbols.has("AAPL")).toBe(
      true,
    );

    expect(
      symbols.has("RELIANCE"),
    ).toBe(true);

    expect(symbols.has("7203")).toBe(
      true,
    );

    expect(symbols.has("SAP")).toBe(
      true,
    );

    expect(symbols.has("ASML")).toBe(
      true,
    );

    expect(symbols.has("BHP")).toBe(
      true,
    );

    expect(symbols.has("TSM")).toBe(
      false,
    );

    expect(
      symbols.has("2330"),
    ).toBe(true);
  });
});