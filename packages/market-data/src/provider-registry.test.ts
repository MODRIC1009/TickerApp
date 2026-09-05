import { describe, expect, it, vi } from "vitest";

import type {
  Instrument,
  MarketDataProvider,
  MarketDataProviderHealth,
  Quote,
} from "@tickerapp/shared";

import type {
  HistoricalPriceRequest,
  InstrumentSearchResult,
} from "./index";

import { MarketDataProviderRegistry } from "./provider-registry";

function createProvider(
  id: string,
): MarketDataProvider {
  return {
    id,
    name: `Provider ${id}`,
    capabilities: {
      searchInstruments: true,
      instrumentDetails: true,
      quotes: true,
      historicalPrices: true,
      exchanges: true,
    },
    searchInstruments: vi.fn(
      async (): Promise<InstrumentSearchResult[]> => [],
    ),
    getInstrument: vi.fn(
      async (): Promise<Instrument | null> => null,
    ),
    getQuote: vi.fn(
      async (): Promise<Quote | null> => null,
    ),
    getHistoricalPrices: vi.fn(
      async (
        _request: HistoricalPriceRequest,
      ) => [],
    ),
    listExchanges: vi.fn(async () => []),
    healthCheck: vi.fn(
      async (): Promise<MarketDataProviderHealth> => ({
        status: "healthy",
        checkedAt: new Date().toISOString(),
      }),
    ),
  };
}

describe("MarketDataProviderRegistry", () => {
  it("registers and retrieves providers", () => {
    const registry =
      new MarketDataProviderRegistry();

    const provider = createProvider("primary");

    registry.register(provider);

    expect(registry.has("primary")).toBe(true);
    expect(registry.get("primary")).toBe(provider);
    expect(registry.list()).toEqual([provider]);
  });

  it("normalizes provider IDs during lookup", () => {
    const registry =
      new MarketDataProviderRegistry();

    const provider = createProvider("primary");

    registry.register(provider);

    expect(registry.has("  primary  ")).toBe(true);
    expect(registry.get("  primary  ")).toBe(provider);
  });

  it("rejects duplicate provider IDs", () => {
    const registry =
      new MarketDataProviderRegistry();

    registry.register(createProvider("primary"));

    expect(() =>
      registry.register(createProvider("primary")),
    ).toThrow(
      'Market data provider "primary" is already registered.',
    );
  });

  it("rejects blank provider IDs", () => {
    const registry =
      new MarketDataProviderRegistry();

    expect(() =>
      registry.register(createProvider("   ")),
    ).toThrow(
      "Market data provider ID cannot be empty.",
    );
  });

  it("returns null when no fallback provider exists", () => {
    const registry =
      new MarketDataProviderRegistry();

    registry.register(createProvider("primary"));

    expect(
      registry.getFallbackProvider("primary"),
    ).toBeNull();
  });

  it("returns a different provider as fallback", () => {
    const registry =
      new MarketDataProviderRegistry();

    const primary = createProvider("primary");
    const fallback = createProvider("fallback");

    registry.register(primary);
    registry.register(fallback);

    expect(
      registry.getFallbackProvider("primary"),
    ).toBe(fallback);
  });

  it("throws when retrieving an unknown provider", () => {
    const registry =
      new MarketDataProviderRegistry();

    expect(() =>
      registry.get("unknown"),
    ).toThrow(
      'Market data provider "unknown" is not registered.',
    );
  });
});