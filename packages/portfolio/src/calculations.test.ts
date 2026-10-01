import { describe, expect, it } from "vitest";

import {
  calculatePortfolioValuation,
  calculatePosition,
  calculateRealizedPnl,
} from "./calculations";
import type {
  Position,
  Transaction,
} from "./types";

const instrument = {
  symbol: "AAPL",
  name: "Apple Inc.",
  exchangeId: "nasdaq",
  countryCode: "US",
  currency: "USD",
  assetClass: "equity" as const,
};

function createPosition(
  overrides: Partial<Position> = {},
): Position {
  return {
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
    ...overrides,
  };
}

function createTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id: "transaction-1",
    portfolioId: "portfolio-1",
    symbol: "AAPL",
    instrument,
    side: "buy",
    quantity: 10,
    price: 100,
    fees: 0,
    executedAt: "2026-09-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("calculatePosition", () => {
  it("calculates cost basis", () => {
    const result = calculatePosition(
      createPosition({
        quantity: 5,
        averageCost: 80,
      }),
    );

    expect(result.costBasis).toBe(400);
  });

  it("calculates market value", () => {
    const result = calculatePosition(
      createPosition({
        quantity: 5,
        marketPrice: 90,
      }),
    );

    expect(result.marketValue).toBe(450);
  });

  it("calculates unrealized P&L", () => {
    const result = calculatePosition(
      createPosition({
        quantity: 5,
        averageCost: 80,
        marketPrice: 90,
      }),
    );

    expect(result.unrealizedPnl).toBe(50);
  });

  it("calculates unrealized P&L percentage", () => {
    const result = calculatePosition(
      createPosition({
        quantity: 5,
        averageCost: 80,
        marketPrice: 90,
      }),
    );

    expect(result.unrealizedPnlPercent).toBe(12.5);
  });

  it("returns zero percentage for zero cost basis", () => {
    const result = calculatePosition(
      createPosition({
        quantity: 0,
        averageCost: 100,
        marketPrice: 120,
      }),
    );

    expect(result.unrealizedPnlPercent).toBe(0);
  });
});

describe("calculateRealizedPnl", () => {
  it("calculates realized profit", () => {
    const transactions = [
      createTransaction({
        id: "buy-1",
        side: "buy",
        quantity: 10,
        price: 100,
      }),
      createTransaction({
        id: "sell-1",
        side: "sell",
        quantity: 10,
        price: 120,
        executedAt: "2026-09-02T00:00:00.000Z",
      }),
    ];

    const result =
      calculateRealizedPnl(transactions);

    expect(result).toHaveLength(1);
    expect(result[0].realizedPnl).toBe(200);
    expect(result[0].realizedPnlPercent).toBe(20);
  });
});

describe("calculatePortfolioValuation", () => {
  it("calculates portfolio totals", () => {
    const result =
      calculatePortfolioValuation(
        "portfolio-1",
        "USD",
        500,
        [
          createPosition({
            costBasis: 1000,
            marketValue: 1200,
            unrealizedPnl: 200,
          }),
        ],
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
});