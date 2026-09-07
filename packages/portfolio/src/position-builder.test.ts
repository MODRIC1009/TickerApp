import { describe, expect, it } from "vitest";

import { PortfolioError } from "./errors";
import { buildPosition } from "./position-builder";
import type { Instrument, Transaction } from "./types";

const nasdaqInstrument: Instrument = {
  symbol: "AAPL",
  name: "Apple Inc.",
  exchangeId: "nasdaq",
  countryCode: "US",
  currency: "USD",
  assetClass: "equity",
};

const nyseInstrument: Instrument = {
  symbol: "AAPL",
  name: "Apple Inc.",
  exchangeId: "nyse",
  countryCode: "US",
  currency: "USD",
  assetClass: "equity",
};

function createTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id: "tx-1",
    portfolioId: "portfolio-1",
    symbol: "AAPL",
    instrument: nasdaqInstrument,
    side: "buy",
    quantity: 10,
    price: 100,
    fees: 0,
    executedAt: "2026-01-01T10:00:00Z",
    ...overrides,
  };
}

describe("buildPosition", () => {
  it("builds a position from purchase transactions", () => {
    const position = buildPosition(
      "portfolio-1",
      "AAPL",
      [
        createTransaction({
          quantity: 10,
          price: 100,
        }),
      ],
      120,
      "2026-01-03T10:00:00Z",
    );

    expect(position).toEqual({
      portfolioId: "portfolio-1",
      instrument: nasdaqInstrument,
      quantity: 10,
      averageCost: 100,
      costBasis: 1000,
      marketPrice: 120,
      marketValue: 1200,
      unrealizedPnl: 200,
      unrealizedPnlPercent: 20,
      updatedAt: "2026-01-03T10:00:00Z",
    });
  });

  it("reduces quantity after a sale", () => {
    const position = buildPosition(
      "portfolio-1",
      "AAPL",
      [
        createTransaction({
          id: "tx-1",
          side: "buy",
          quantity: 10,
          price: 100,
          executedAt: "2026-01-01T10:00:00Z",
        }),
        createTransaction({
          id: "tx-2",
          side: "sell",
          quantity: 4,
          price: 120,
          executedAt: "2026-01-02T10:00:00Z",
        }),
      ],
      130,
      "2026-01-03T10:00:00Z",
    );

    expect(position).toEqual({
      portfolioId: "portfolio-1",
      instrument: nasdaqInstrument,
      quantity: 6,
      averageCost: 100,
      costBasis: 600,
      marketPrice: 130,
      marketValue: 780,
      unrealizedPnl: 180,
      unrealizedPnlPercent: 30,
      updatedAt: "2026-01-03T10:00:00Z",
    });
  });

  it("returns undefined when the position is fully closed", () => {
    const position = buildPosition(
      "portfolio-1",
      "AAPL",
      [
        createTransaction({
          id: "tx-1",
          side: "buy",
          quantity: 10,
          price: 100,
          executedAt: "2026-01-01T10:00:00Z",
        }),
        createTransaction({
          id: "tx-2",
          side: "sell",
          quantity: 10,
          price: 120,
          executedAt: "2026-01-02T10:00:00Z",
        }),
      ],
      130,
      "2026-01-03T10:00:00Z",
    );

    expect(position).toBeUndefined();
  });

  it("ignores transactions from another portfolio", () => {
    const position = buildPosition(
      "portfolio-1",
      "AAPL",
      [
        createTransaction({
          id: "tx-1",
          portfolioId: "portfolio-2",
          quantity: 10,
          price: 50,
        }),
      ],
      120,
      "2026-01-03T10:00:00Z",
    );

    expect(position).toBeUndefined();
  });

  it("rejects a sale larger than the available position", () => {
    expect(() =>
      buildPosition(
        "portfolio-1",
        "AAPL",
        [
          createTransaction({
            id: "tx-1",
            side: "buy",
            quantity: 5,
            price: 100,
            executedAt: "2026-01-01T10:00:00Z",
          }),
          createTransaction({
            id: "tx-2",
            side: "sell",
            quantity: 10,
            price: 120,
            executedAt: "2026-01-02T10:00:00Z",
          }),
        ],
        130,
        "2026-01-03T10:00:00Z",
      ),
    ).toThrowError(
      new PortfolioError(
        "insufficient_quantity",
        'Insufficient quantity of "AAPL" for transaction "tx-2".',
      ),
    );
  });

  it("does not merge transactions for the same symbol on different exchanges", () => {
    const transactions: Transaction[] = [
      createTransaction({
        id: "nasdaq-buy",
        instrument: nasdaqInstrument,
        quantity: 10,
        price: 100,
        executedAt: "2026-01-01T10:00:00Z",
      }),
      createTransaction({
        id: "nyse-buy",
        instrument: nyseInstrument,
        quantity: 20,
        price: 200,
        executedAt: "2026-01-02T10:00:00Z",
      }),
    ];

    const nasdaqPosition = buildPosition(
      "portfolio-1",
      "AAPL",
      transactions,
      120,
      "2026-01-03T10:00:00Z",
    );

    expect(nasdaqPosition).toEqual({
      portfolioId: "portfolio-1",
      instrument: nasdaqInstrument,
      quantity: 10,
      averageCost: 100,
      costBasis: 1000,
      marketPrice: 120,
      marketValue: 1200,
      unrealizedPnl: 200,
      unrealizedPnlPercent: 20,
      updatedAt: "2026-01-03T10:00:00Z",
    });

    const nysePosition = buildPosition(
      "portfolio-1",
      "AAPL",
      transactions.filter(
        (transaction) =>
          transaction.instrument.exchangeId === "nyse",
      ),
      240,
      "2026-01-03T10:00:00Z",
    );

    expect(nysePosition).toEqual({
      portfolioId: "portfolio-1",
      instrument: nyseInstrument,
      quantity: 20,
      averageCost: 200,
      costBasis: 4000,
      marketPrice: 240,
      marketValue: 4800,
      unrealizedPnl: 800,
      unrealizedPnlPercent: 20,
      updatedAt: "2026-01-03T10:00:00Z",
    });
  });

  it("processes out-of-order transactions chronologically", () => {
    const position = buildPosition(
      "portfolio-1",
      "AAPL",
      [
        createTransaction({
          id: "sell-1",
          side: "sell",
          quantity: 5,
          price: 150,
          executedAt: "2026-01-03T10:00:00Z",
        }),
        createTransaction({
          id: "buy-1",
          side: "buy",
          quantity: 10,
          price: 100,
          executedAt: "2026-01-01T10:00:00Z",
        }),
      ],
      150,
      "2026-01-04T10:00:00Z",
    );

    expect(position).toEqual({
      portfolioId: "portfolio-1",
      instrument: nasdaqInstrument,
      quantity: 5,
      averageCost: 100,
      costBasis: 500,
      marketPrice: 150,
      marketValue: 750,
      unrealizedPnl: 250,
      unrealizedPnlPercent: 50,
      updatedAt: "2026-01-04T10:00:00Z",
    });
  });
});