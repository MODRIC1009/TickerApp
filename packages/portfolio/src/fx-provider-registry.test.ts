import { describe, expect, it } from "vitest";

import { FxProviderRegistry } from "./fx-provider-registry";
import type { FxRateProvider } from "./currency";

const provider: FxRateProvider = {
  async getRate(fromCurrency, toCurrency) {
    return {
      fromCurrency,
      toCurrency,
      rate: 1.25,
      asOf: "2026-09-06T00:00:00.000Z",
    };
  },
};

describe("FxProviderRegistry", () => {
  it("registers and retrieves a provider", () => {
    const registry = new FxProviderRegistry();

    registry.register("demo-fx", provider);

    expect(registry.get("demo-fx")).toBe(provider);
  });

  it("normalizes provider ids", () => {
    const registry = new FxProviderRegistry();

    registry.register("  Demo-FX  ", provider);

    expect(registry.has("demo-fx")).toBe(true);
    expect(registry.has(" DEMO-FX ")).toBe(true);
    expect(registry.get("DEMO-FX")).toBe(provider);
  });

  it("rejects an empty provider id", () => {
    const registry = new FxProviderRegistry();

    expect(() =>
      registry.register("   ", provider),
    ).toThrow("FX provider id is required.");
  });

  it("rejects duplicate provider ids", () => {
    const registry = new FxProviderRegistry();

    registry.register("demo-fx", provider);

    expect(() =>
      registry.register("DEMO-FX", provider),
    ).toThrow(
      'FX provider "demo-fx" is already registered.',
    );
  });

  it("throws when retrieving an unknown provider", () => {
    const registry = new FxProviderRegistry();

    expect(() =>
      registry.get("missing"),
    ).toThrow(
      'FX provider "missing" is not registered.',
    );
  });

  it("reports whether a provider exists", () => {
    const registry = new FxProviderRegistry();

    expect(registry.has("demo-fx")).toBe(false);

    registry.register("demo-fx", provider);

    expect(registry.has("demo-fx")).toBe(true);
  });

  it("lists registered providers", () => {
    const registry = new FxProviderRegistry();

    registry.register("demo-fx", provider);

    const registrations = registry.list();

    expect(registrations).toEqual([
      {
        id: "demo-fx",
        provider,
      },
    ]);
  });

  it("clears all registered providers", () => {
    const registry = new FxProviderRegistry();

    registry.register("demo-fx", provider);
    registry.clear();

    expect(registry.has("demo-fx")).toBe(false);
    expect(registry.list()).toEqual([]);
  });
});