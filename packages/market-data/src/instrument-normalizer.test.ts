import { describe, expect, it } from "vitest";

import {
  mapAssetClass,
  normalizeProviderInstrument,
} from "./instrument-normalizer";

describe("instrument-normalizer", () => {
  it("normalizes a provider equity into the canonical instrument shape", () => {
    const instrument =
      normalizeProviderInstrument(
        "twelve-data",
        {
          symbol: " aapl ",
          name: " Apple Inc. ",
          exchange: "NASDAQ",
          micCode: "XNAS",
          countryCode: "us",
          currency: "usd",
          instrumentType:
            "Common Stock",
        },
      );

    expect(instrument).toEqual({
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
          providerSymbol: "aapl",
          providerExchangeId:
            "XNAS",
        },
      },
    });
  });

  it("prefers MIC code when both MIC and exchange are provided", () => {
    const instrument =
      normalizeProviderInstrument(
        "twelve-data",
        {
          symbol: "MSFT",
          name: "Microsoft Corporation",
          exchange: "NYSE",
          micCode: "XNAS",
        },
      );

    expect(
      instrument.exchangeId,
    ).toBe("nasdaq");

    expect(
      instrument.countryCode,
    ).toBe("US");
  });

  it("falls back to provider country when exchange cannot be resolved", () => {
    const instrument =
      normalizeProviderInstrument(
        "test-provider",
        {
          symbol: "ABC",
          name: "Example Company",
          exchange:
            "UNKNOWN_EXCHANGE",
          countryCode: "gb",
          currency: "gbp",
        },
      );

    expect(
      instrument.exchangeId,
    ).toBe("unknown");

    expect(
      instrument.countryCode,
    ).toBe("GB");

    expect(
      instrument.currency,
    ).toBe("GBP");
  });

  it("defaults missing names to the normalized symbol", () => {
    const instrument =
      normalizeProviderInstrument(
        "test-provider",
        {
          symbol: "  tsla  ",
        },
      );

    expect(instrument.name).toBe(
      "TSLA",
    );
  });

  it("defaults missing currency to USD", () => {
    const instrument =
      normalizeProviderInstrument(
        "test-provider",
        {
          symbol: "AAPL",
        },
      );

    expect(instrument.currency).toBe(
      "USD",
    );
  });

  it("preserves the provider symbol exactly in source metadata", () => {
    const instrument =
      normalizeProviderInstrument(
        "test-provider",
        {
          symbol: "  aapl  ",
          exchange: "NASDAQ",
        },
      );

    expect(
      instrument.metadata?.source,
    ).toEqual({
      providerId:
        "test-provider",
      providerSymbol: "aapl",
      providerExchangeId:
        "NASDAQ",
    });
  });

  it("normalizes major North American exchanges", () => {
    const cases = [
      {
        symbol: "SHOP",
        exchange: "TSX",
        micCode: "XTSE",
        countryCode: "CA",
        currency: "CAD",
        expectedExchange:
          "tsx",
      },
      {
        symbol: "AAPL",
        exchange: "NASDAQ",
        micCode: "XNAS",
        countryCode: "US",
        currency: "USD",
        expectedExchange:
          "nasdaq",
      },
      {
        symbol: "KO",
        exchange: "NYSE",
        micCode: "XNYS",
        countryCode: "US",
        currency: "USD",
        expectedExchange:
          "nyse",
      },
    ];

    for (const testCase of cases) {
      const instrument =
        normalizeProviderInstrument(
          "test-provider",
          testCase,
        );

      expect(
        instrument.exchangeId,
      ).toBe(
        testCase.expectedExchange,
      );

      expect(
        instrument.countryCode,
      ).toBe(
        testCase.countryCode,
      );

      expect(
        instrument.currency,
      ).toBe(
        testCase.currency,
      );
    }
  });

  it("normalizes major European exchanges", () => {
    const cases = [
      {
        symbol: "SHEL",
        exchange: "LSE",
        micCode: "XLON",
        countryCode: "GB",
        currency: "GBP",
        expectedExchange:
          "lse",
      },
      {
        symbol: "SAP",
        exchange: "XETRA",
        micCode: "XETR",
        countryCode: "DE",
        currency: "EUR",
        expectedExchange:
          "xetra",
      },
      {
        symbol: "MC",
        exchange: "EURONEXT",
        micCode: "XPAR",
        countryCode: "FR",
        currency: "EUR",
        expectedExchange:
          "euronext-paris",
      },
      {
        symbol: "ASML",
        exchange: "AMS",
        micCode: "XAMS",
        countryCode: "NL",
        currency: "EUR",
        expectedExchange:
          "euronext-amsterdam",
      },
      {
        symbol: "NESN",
        exchange: "SIX",
        micCode: "XSWX",
        countryCode: "CH",
        currency: "CHF",
        expectedExchange:
          "six",
      },
    ];

    for (const testCase of cases) {
      const instrument =
        normalizeProviderInstrument(
          "test-provider",
          testCase,
        );

      expect(
        instrument.exchangeId,
      ).toBe(
        testCase.expectedExchange,
      );

      expect(
        instrument.countryCode,
      ).toBe(
        testCase.countryCode,
      );

      expect(
        instrument.currency,
      ).toBe(
        testCase.currency,
      );
    }
  });

  it("normalizes major Asian-Pacific exchanges", () => {
    const cases = [
      {
        symbol: "RELIANCE",
        exchange: "NSE",
        micCode: "XNSE",
        countryCode: "IN",
        currency: "INR",
        expectedExchange:
          "nse",
      },
      {
        symbol: "7203",
        exchange: "JPX",
        micCode: "XTKS",
        countryCode: "JP",
        currency: "JPY",
        expectedExchange:
          "jpx",
      },
      {
        symbol: "0700",
        exchange: "HKEX",
        micCode: "XHKG",
        countryCode: "HK",
        currency: "HKD",
        expectedExchange:
          "hkex",
      },
      {
        symbol: "005930",
        exchange: "KRX",
        micCode: "XKRX",
        countryCode: "KR",
        currency: "KRW",
        expectedExchange:
          "krx",
      },
      {
        symbol: "D05",
        exchange: "SGX",
        micCode: "XSES",
        countryCode: "SG",
        currency: "SGD",
        expectedExchange:
          "sgx",
      },
      {
        symbol: "BHP",
        exchange: "ASX",
        micCode: "XASX",
        countryCode: "AU",
        currency: "AUD",
        expectedExchange:
          "asx",
      },
    ];

    for (const testCase of cases) {
      const instrument =
        normalizeProviderInstrument(
          "test-provider",
          testCase,
        );

      expect(
        instrument.exchangeId,
      ).toBe(
        testCase.expectedExchange,
      );

      expect(
        instrument.countryCode,
      ).toBe(
        testCase.countryCode,
      );

      expect(
        instrument.currency,
      ).toBe(
        testCase.currency,
      );
    }
  });

  it("normalizes Chinese, Taiwanese, and Latin American exchanges", () => {
    const cases = [
      {
        symbol: "600519",
        exchange: "SSE",
        micCode: "XSHG",
        countryCode: "CN",
        currency: "CNY",
        expectedExchange:
          "sse",
      },
      {
        symbol: "000001",
        exchange: "SZSE",
        micCode: "XSHE",
        countryCode: "CN",
        currency: "CNY",
        expectedExchange:
          "szse",
      },
      {
        symbol: "2330",
        exchange: "TWSE",
        micCode: "XTAI",
        countryCode: "TW",
        currency: "TWD",
        expectedExchange:
          "twse",
      },
      {
        symbol: "PETR4",
        exchange: "B3",
        micCode: "XBSP",
        countryCode: "BR",
        currency: "BRL",
        expectedExchange:
          "b3",
      },
      {
        symbol: "AMXL",
        exchange: "BMV",
        micCode: "XMEX",
        countryCode: "MX",
        currency: "MXN",
        expectedExchange:
          "bmv",
      },
      {
        symbol: "NPN",
        exchange: "JSE",
        micCode: "XJSE",
        countryCode: "ZA",
        currency: "ZAR",
        expectedExchange:
          "jse",
      },
    ];

    for (const testCase of cases) {
      const instrument =
        normalizeProviderInstrument(
          "test-provider",
          testCase,
        );

      expect(
        instrument.exchangeId,
      ).toBe(
        testCase.expectedExchange,
      );

      expect(
        instrument.countryCode,
      ).toBe(
        testCase.countryCode,
      );

      expect(
        instrument.currency,
      ).toBe(
        testCase.currency,
      );
    }
  });

  it("maps ETF instruments correctly", () => {
    expect(
      mapAssetClass("ETF"),
    ).toBe("etf");

    expect(
      mapAssetClass(
        "Exchange Traded Fund",
      ),
    ).toBe("etf");
  });

  it("maps ADR instruments correctly", () => {
    expect(
      mapAssetClass("ADR"),
    ).toBe("adr");
  });

  it("maps REIT instruments correctly", () => {
    expect(
      mapAssetClass("REIT"),
    ).toBe("reit");
  });

  it("maps fund and mutual fund instruments correctly", () => {
    expect(
      mapAssetClass("Fund"),
    ).toBe("fund");

    expect(
      mapAssetClass("Mutual Fund"),
    ).toBe("fund");
  });

  it("defaults unknown instrument types to equity", () => {
    expect(
      mapAssetClass(
        "Common Stock",
      ),
    ).toBe("equity");

    expect(
      mapAssetClass(
        "Preferred Security",
      ),
    ).toBe("equity");

    expect(
      mapAssetClass(),
    ).toBe("equity");
  });
});