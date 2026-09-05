import { describe, expect, it } from "vitest";

import { resolveExchange } from "./exchange-resolution";

describe("resolveExchange", () => {
  it("resolves canonical exchange IDs exactly", () => {
    expect(resolveExchange("nasdaq")).toEqual({
      exchangeId: "nasdaq",
      countryCode: "US",
      confidence: "exact",
    });
  });

  it("resolves provider exchange aliases", () => {
    expect(resolveExchange("XNAS")).toEqual({
      exchangeId: "nasdaq",
      countryCode: "US",
      confidence: "alias",
    });

    expect(resolveExchange("XNSE")).toEqual({
      exchangeId: "nse",
      countryCode: "IN",
      confidence: "alias",
    });

    expect(resolveExchange("XLON")).toEqual({
      exchangeId: "lse",
      countryCode: "GB",
      confidence: "alias",
    });
  });

  it("resolves common exchange names case-insensitively", () => {
    expect(resolveExchange("nyse")).toEqual({
      exchangeId: "nyse",
      countryCode: "US",
      confidence: "exact",
    });

    expect(resolveExchange("  XNYS  ")).toEqual({
      exchangeId: "nyse",
      countryCode: "US",
      confidence: "alias",
    });
  });

  it("returns unknown for an unsupported exchange", () => {
    expect(resolveExchange("UNKNOWN")).toEqual({
      exchangeId: "unknown",
      countryCode: "",
      confidence: "unknown",
    });
  });

  it("returns unknown for a missing exchange", () => {
    expect(resolveExchange()).toEqual({
      exchangeId: "unknown",
      countryCode: "",
      confidence: "unknown",
    });
  });

  it("covers the major configured global exchanges", () => {
    const expected = [
      ["XNAS", "nasdaq", "US"],
      ["XNYS", "nyse", "US"],
      ["XTSE", "tsx", "CA"],
      ["XLON", "lse", "GB"],
      ["XETR", "xetra", "DE"],
      ["XPAR", "euronext-paris", "FR"],
      ["XAMS", "euronext-amsterdam", "NL"],
      ["XSWX", "six", "CH"],
      ["XNSE", "nse", "IN"],
      ["XTKS", "jpx", "JP"],
      ["XHKG", "hkex", "HK"],
      ["XSHG", "sse", "CN"],
      ["XSHE", "szse", "CN"],
      ["XKRX", "krx", "KR"],
      ["XTAI", "twse", "TW"],
      ["XSES", "sgx", "SG"],
      ["XASX", "asx", "AU"],
      ["XBSP", "b3", "BR"],
      ["XMEX", "bmv", "MX"],
      ["XJSE", "jse", "ZA"],
    ] as const;

    for (const [
      providerExchange,
      exchangeId,
      countryCode,
    ] of expected) {
      expect(
        resolveExchange(providerExchange),
      ).toMatchObject({
        exchangeId,
        countryCode,
        confidence: "alias",
      });
    }
  });
});