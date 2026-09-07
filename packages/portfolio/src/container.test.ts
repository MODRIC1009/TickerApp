import { describe, expect, it } from "vitest";

import {
  createFxService,
  createPortfolioService,
} from "./container";

describe("portfolio container", () => {
  it("creates an isolated portfolio service", () => {
    const first = createPortfolioService();
    const second = createPortfolioService();

    expect(first).not.toBe(second);
  });

  it("creates an FX service with the demo provider", async () => {
    const service = createFxService();

    const rate = await service.getRate(
      "USD",
      "EUR",
    );

    expect(rate.fromCurrency).toBe("USD");
    expect(rate.toCurrency).toBe("EUR");
    expect(rate.rate).toBe(0.9);
  });

  it("supports a custom FX provider id", async () => {
    const service = createFxService({
      fxProviderId: "custom-demo",
    });

    const rate = await service.getRate(
      "USD",
      "JPY",
    );

    expect(rate.rate).toBe(147);
    expect(service.listProviders()).toEqual([
      "custom-demo",
    ]);
  });

  it("preserves configured FX fallback ids", () => {
    const service = createFxService({
      fxProviderId: "primary",
      fxFallbackProviderIds: ["fallback"],
    });

    expect(service.listProviders()).toEqual([
      "primary",
    ]);
  });
});