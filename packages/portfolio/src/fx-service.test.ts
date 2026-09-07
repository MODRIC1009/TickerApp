import { describe, expect, it } from "vitest";

import type { FxRateProvider } from "./currency";
import { FxService } from "./fx-service";

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

describe("FxService", () => {
  it("uses the configured default provider", async () => {
    const service = new FxService({
      providers: {
        demo: provider,
      },
      defaultProviderId: "demo",
    });

    const result = await service.getRate("usd", "eur");

    expect(result).toEqual({
      fromCurrency: "USD",
      toCurrency: "EUR",
      rate: 1.25,
      asOf: "2026-09-06T00:00:00.000Z",
    });
  });

  it("uses an explicitly requested provider", async () => {
    const explicitProvider: FxRateProvider = {
      async getRate(fromCurrency, toCurrency) {
        return {
          fromCurrency,
          toCurrency,
          rate: 1.4,
          asOf: "2026-09-06T00:00:00.000Z",
        };
      },
    };

    const service = new FxService({
      providers: {
        default: provider,
        explicit: explicitProvider,
      },
      defaultProviderId: "default",
    });

    const result = await service.getRate(
      "USD",
      "GBP",
      "explicit",
    );

    expect(result.rate).toBe(1.4);
  });

  it("falls back when the default provider fails", async () => {
    const failingProvider: FxRateProvider = {
      async getRate() {
        throw new Error("Primary unavailable.");
      },
    };

    const fallbackProvider: FxRateProvider = {
      async getRate(fromCurrency, toCurrency) {
        return {
          fromCurrency,
          toCurrency,
          rate: 1.3,
          asOf: "2026-09-06T00:00:00.000Z",
        };
      },
    };

    const service = new FxService({
      providers: {
        primary: failingProvider,
        fallback: fallbackProvider,
      },
      defaultProviderId: "primary",
      fallbackProviderIds: ["fallback"],
    });

    const result = await service.getRate(
      "USD",
      "EUR",
    );

    expect(result.rate).toBe(1.3);
  });

  it("falls back during conversion when the primary provider fails", async () => {
    const failingProvider: FxRateProvider = {
      async getRate() {
        throw new Error("Primary unavailable.");
      },
    };

    const fallbackProvider: FxRateProvider = {
      async getRate(fromCurrency, toCurrency) {
        return {
          fromCurrency,
          toCurrency,
          rate: 1.3,
          asOf: "2026-09-06T00:00:00.000Z",
        };
      },
    };

    const service = new FxService({
      providers: {
        primary: failingProvider,
        fallback: fallbackProvider,
      },
      defaultProviderId: "primary",
      fallbackProviderIds: ["fallback"],
    });

    const result = await service.convert(
      100,
      "USD",
      "EUR",
    );

    expect(result.amount).toBe(130);
    expect(result.providerId).toBe("fallback");
  });

  it("does not duplicate the default provider in fallback order", async () => {
    const calls: string[] = [];

    const trackingProvider: FxRateProvider = {
      async getRate(fromCurrency, toCurrency) {
        calls.push("primary");

        return {
          fromCurrency,
          toCurrency,
          rate: 1.25,
          asOf: "2026-09-06T00:00:00.000Z",
        };
      },
    };

    const service = new FxService({
      providers: {
        primary: trackingProvider,
      },
      defaultProviderId: "primary",
      fallbackProviderIds: ["primary"],
    });

    await service.getRate("USD", "EUR");

    expect(calls).toEqual(["primary"]);
  });

  it("uses fallback providers when no default provider is configured", async () => {
    const service = new FxService({
      providers: {
        fallback: provider,
      },
      fallbackProviderIds: ["fallback"],
    });

    const result = await service.getRate(
      "USD",
      "EUR",
    );

    expect(result.rate).toBe(1.25);
  });

  it("uses fallback providers after an explicitly requested provider fails", async () => {
    const failingProvider: FxRateProvider = {
      async getRate() {
        throw new Error("Explicit provider unavailable.");
      },
    };

    const fallbackProvider: FxRateProvider = {
      async getRate(fromCurrency, toCurrency) {
        return {
          fromCurrency,
          toCurrency,
          rate: 1.15,
          asOf: "2026-09-06T00:00:00.000Z",
        };
      },
    };

    const service = new FxService({
      providers: {
        explicit: failingProvider,
        fallback: fallbackProvider,
      },
      defaultProviderId: "explicit",
      fallbackProviderIds: ["fallback"],
    });

    const result = await service.getRate(
      "USD",
      "EUR",
      "explicit",
    );

    expect(result.rate).toBe(1.15);
  });

  it("throws the final provider error when all providers fail", async () => {
    const primary: FxRateProvider = {
      async getRate() {
        throw new Error("Primary unavailable.");
      },
    };

    const fallback: FxRateProvider = {
      async getRate() {
        throw new Error("Fallback unavailable.");
      },
    };

    const service = new FxService({
      providers: {
        primary,
        fallback,
      },
      defaultProviderId: "primary",
      fallbackProviderIds: ["fallback"],
    });

    await expect(
      service.getRate("USD", "EUR"),
    ).rejects.toThrow("Fallback unavailable.");
  });

  it("normalizes currencies before calling providers", async () => {
    const calls: Array<[string, string]> = [];

    const trackingProvider: FxRateProvider = {
      async getRate(fromCurrency, toCurrency) {
        calls.push([fromCurrency, toCurrency]);

        return {
          fromCurrency,
          toCurrency,
          rate: 1.25,
          asOf: "2026-09-06T00:00:00.000Z",
        };
      },
    };

    const service = new FxService({
      providers: {
        demo: trackingProvider,
      },
      defaultProviderId: "demo",
    });

    await service.getRate(
      " usd ",
      " eur ",
    );

    expect(calls).toEqual([
      ["USD", "EUR"],
    ]);
  });

  it("handles same-currency conversion without calling a provider", async () => {
    let calls = 0;

    const trackingProvider: FxRateProvider = {
      async getRate(fromCurrency, toCurrency) {
        calls += 1;

        return {
          fromCurrency,
          toCurrency,
          rate: 2,
          asOf: "2026-09-06T00:00:00.000Z",
        };
      },
    };

    const service = new FxService({
      providers: {
        demo: trackingProvider,
      },
      defaultProviderId: "demo",
    });

    const result = await service.convert(
      100,
      "USD",
      "USD",
    );

    expect(result.amount).toBe(100);
    expect(result.rate).toBe(1);
    expect(result.providerId).toBe("demo");
    expect(calls).toBe(0);
  });

  it("uses identity for same-currency conversion without any provider", async () => {
    const service = new FxService();

    const result = await service.convert(
      100,
      "USD",
      "USD",
    );

    expect(result.amount).toBe(100);
    expect(result.fromCurrency).toBe("USD");
    expect(result.toCurrency).toBe("USD");
    expect(result.rate).toBe(1);
    expect(result.providerId).toBe("identity");
  });

  it("lists registered providers", () => {
    const service = new FxService({
      providers: {
        demo: provider,
        secondary: provider,
      },
    });

    expect(service.listProviders()).toEqual([
      "demo",
      "secondary",
    ]);
  });

  it("allows registering providers after construction", async () => {
    const service = new FxService();

    service.registerProvider("demo", provider);

    const result = await service.getRate(
      "USD",
      "EUR",
      "demo",
    );

    expect(result.rate).toBe(1.25);
  });

  it("throws when no provider is configured", async () => {
    const service = new FxService();

    await expect(
      service.getRate("USD", "EUR"),
    ).rejects.toThrow(
      "No FX provider was specified and no default FX provider is configured.",
    );
  });

  it("throws when the requested provider is unknown and no fallback is available", async () => {
    const service = new FxService({
      providers: {
        demo: provider,
      },
    });

    await expect(
      service.getRate(
        "USD",
        "EUR",
        "missing",
      ),
    ).rejects.toThrow(
      'FX provider "missing" is not registered.',
    );
  });

  it("propagates provider errors when every provider fails", async () => {
    const failingProvider: FxRateProvider = {
      async getRate() {
        throw new Error("FX provider unavailable.");
      },
    };

    const service = new FxService({
      providers: {
        failing: failingProvider,
      },
      defaultProviderId: "failing",
    });

    await expect(
      service.convert(100, "USD", "EUR"),
    ).rejects.toThrow(
      "FX provider unavailable.",
    );
  });
});