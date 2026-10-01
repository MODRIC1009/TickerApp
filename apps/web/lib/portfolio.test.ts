import { describe, expect, it, vi } from "vitest";

import {
  getFxService,
  getPortfolioService,
  resetPortfolioService,
} from "./portfolio";

describe("portfolio web services", () => {
  it("returns the same portfolio service instance", () => {
    resetPortfolioService();

    const first = getPortfolioService();
    const second = getPortfolioService();

    expect(first).toBe(second);
  });

  it("returns the same FX service instance", () => {
    resetPortfolioService();

    const first = getFxService();
    const second = getFxService();

    expect(first).toBe(second);
  });

  it("creates a working default FX service", async () => {
    resetPortfolioService();

    const service = getFxService();

    const rate = await service.getRate(
      "USD",
      "EUR",
    );

    expect(rate.rate).toBe(0.9);
    expect(rate.fromCurrency).toBe("USD");
    expect(rate.toCurrency).toBe("EUR");
  });

  it("resets both services", () => {
    resetPortfolioService();

    const firstPortfolio = getPortfolioService();
    const firstFx = getFxService();

    resetPortfolioService();

    const secondPortfolio = getPortfolioService();
    const secondFx = getFxService();

    expect(secondPortfolio).not.toBe(firstPortfolio);
    expect(secondFx).not.toBe(firstFx);
  });

  it("uses environment FX configuration", async () => {
    vi.stubEnv("FX_PROVIDER", "custom-demo");
    vi.stubEnv("FX_FALLBACK_PROVIDERS", "");

    resetPortfolioService();

    const service = getFxService();

    expect(service.listProviders()).toEqual([
      "custom-demo",
    ]);

    const rate = await service.getRate(
      "USD",
      "JPY",
    );

    expect(rate.rate).toBe(147);

    vi.unstubAllEnvs();
    resetPortfolioService();
  });
});