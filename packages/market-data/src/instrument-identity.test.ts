import { describe, expect, it } from "vitest";

import {
  createInstrumentIdentity,
  getInstrumentIdentityKey,
  normalizeSymbol,
} from "./instrument-identity";

import { InstrumentRegistry } from "./instrument-registry";

import type { Instrument } from "@tickerapp/shared";

const apple: Instrument = {
  symbol: " aapl ",
  name: "Apple Inc.",
  exchangeId: "NASDAQ",
  countryCode: "us",
  currency: "USD",
  assetClass: "equity",
};

describe("instrument identity", () => {
  it("normalizes symbols", () => {
    expect(normalizeSymbol(" aapl ")).toBe("AAPL");
  });

  it("creates a canonical identity", () => {
    expect(createInstrumentIdentity(apple)).toEqual({
      symbol: "AAPL",
      exchangeId: "nasdaq",
      countryCode: "US",
    });
  });

  it("creates a stable identity key", () => {
    expect(getInstrumentIdentityKey(apple)).toBe(
      "US:nasdaq:AAPL",
    );
  });
});

describe("InstrumentRegistry", () => {
  it("registers and retrieves instruments", () => {
    const registry = new InstrumentRegistry();

    registry.register(apple);

    expect(
      registry.get("US", "nasdaq", "AAPL"),
    ).toEqual(apple);
    expect(registry.size()).toBe(1);
  });

  it("prevents duplicate registration", () => {
    const registry = new InstrumentRegistry();

    registry.register(apple);

    expect(() => registry.register(apple)).toThrow(
      'Instrument "US:nasdaq:AAPL" is already registered.',
    );
  });

  it("upserts an existing instrument", () => {
    const registry = new InstrumentRegistry();

    registry.register(apple);

    registry.upsert({
      ...apple,
      name: "Apple Inc. Updated",
    });

    expect(
      registry.get("US", "nasdaq", "AAPL")?.name,
    ).toBe("Apple Inc. Updated");
    expect(registry.size()).toBe(1);
  });
});