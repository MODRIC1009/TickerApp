import { describe, expect, it } from "vitest";

import {
  calculateCurrencyAwareValuation,
  type ValuationPosition,
} from "./valuation";

const instrument = {
  symbol: "AAPL",
  name: "Apple Inc.",
  exchangeId: "nasdaq",
  countryCode: "US",
  currency: "USD",
  assetClass: "equity" as const,
};

const position = {
  portfolioId: "portfolio-1",
  instrument,
  quantity: 10,
  averageCost: 100,
  costBasis: 1000,
  marketPrice: 120,
  marketValue: 1200,
  unrealizedPnl: 200,
  unrealizedPnlPercent: 20,
  updatedAt: "2026-09-06T00:00:00.000Z",
};

function createValuationPosition(
  overrides: Partial<ValuationPosition> = {},
): ValuationPosition {
  return {
    position,
    currency: "USD",
    convertedMarketValue: 1200,
    convertedCostBasis: 1000,
    convertedUnrealizedPnl: 200,
    fxRate: 1,
    fxAsOf: "2026-09-06T00:00:00.000Z",
    fxProviderId: "demo-fx",
    ...overrides,
  };
}

describe("calculateCurrencyAwareValuation", () => {
  it("calculates valuation for a base-currency position", () => {
    const result = calculateCurrencyAwareValuation(
      "portfolio-1",
      "USD",
      500,
      [createValuationPosition()],
      100,
      "2026-09-06T00:00:00.000Z",
    );

    expect(result).toEqual({
      portfolioId: "portfolio-1",
      baseCurrency: "USD",
      cashValue: 500,
      positionsValue: 1200,
      totalValue: 1700,
      totalCostBasis: 1000,
      unrealizedPnl: 200,
      realizedPnl: 100,
      totalPnl: 300,
      totalPnlPercent: 30,
      asOf: "2026-09-06T00:00:00.000Z",
    });
  });

  it("includes multiple currencies after conversion", () => {
    const usdPosition = createValuationPosition();

    const eurPosition = createValuationPosition({
      position: {
        ...position,
        instrument: {
          ...instrument,
          symbol: "SAP",
          name: "SAP SE",
          exchangeId: "xetra",
          countryCode: "DE",
          currency: "EUR",
        },
      },
      currency: "EUR",
      convertedMarketValue: 1350,
      convertedCostBasis: 1125,
      convertedUnrealizedPnl: 225,
      fxRate: 1.2,
      fxAsOf: "2026-09-06T00:00:00.000Z",
      fxProviderId: "demo-fx",
    });

    const result = calculateCurrencyAwareValuation(
      "portfolio-1",
      "USD",
      500,
      [usdPosition, eurPosition],
      100,
      "2026-09-06T00:00:00.000Z",
    );

    expect(result.positionsValue).toBe(2550);
    expect(result.totalCostBasis).toBe(2125);
    expect(result.unrealizedPnl).toBe(425);
    expect(result.totalValue).toBe(3050);
    expect(result.totalPnl).toBe(525);
  });

  it("normalizes the base currency", () => {
    const result = calculateCurrencyAwareValuation(
      "portfolio-1",
      " usd ",
      500,
      [createValuationPosition()],
      0,
      "2026-09-06T00:00:00.000Z",
    );

    expect(result.baseCurrency).toBe("USD");
  });

  it("returns zero P&L percentage when cost basis is zero", () => {
    const result = calculateCurrencyAwareValuation(
      "portfolio-1",
      "USD",
      500,
      [],
      100,
      "2026-09-06T00:00:00.000Z",
    );

    expect(result.totalPnlPercent).toBe(0);
  });

  it("preserves the valuation timestamp", () => {
    const asOf = "2026-09-07T00:00:00.000Z";

    const result = calculateCurrencyAwareValuation(
      "portfolio-1",
      "USD",
      500,
      [createValuationPosition()],
      0,
      asOf,
    );

    expect(result.asOf).toBe(asOf);
  });
});