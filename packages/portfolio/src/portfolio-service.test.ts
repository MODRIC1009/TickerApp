import { describe, expect, it } from "vitest";

import { PortfolioError } from "./errors";
import { createFxService } from "./container";
import { PortfolioService } from "./portfolio-service";
import type {
  Instrument,
  Portfolio,
  Position,
  Transaction,
} from "./types";

const portfolio: Portfolio = {
  id: "portfolio-1",
  name: "Test Portfolio",
  baseCurrency: "USD",
  cashBalance: 10_000,
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

const instrument: Instrument = {
  symbol: "AAPL",
  name: "Apple Inc.",
  exchangeId: "nasdaq",
  countryCode: "US",
  currency: "USD",
  assetClass: "equity",
};

function createTransaction(
  overrides: Partial<Transaction> = {},
): Transaction {
  return {
    id: "transaction-1",
    portfolioId: portfolio.id,
    symbol: instrument.symbol,
    instrument,
    side: "buy",
    quantity: 10,
    price: 100,
    fees: 0,
    executedAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

function createPosition(
  overrides: Partial<Position> = {},
): Position {
  return {
    portfolioId: portfolio.id,
    instrument,
    quantity: 10,
    averageCost: 100,
    costBasis: 1000,
    marketPrice: 100,
    marketValue: 1000,
    unrealizedPnl: 0,
    unrealizedPnlPercent: 0,
    updatedAt: "2026-09-01T10:00:00.000Z",
    ...overrides,
  };
}

function createService(): PortfolioService {
  return new PortfolioService({
    fxService: createFxService(),
  });
}

describe("PortfolioService", () => {
  it("creates and retrieves a portfolio", () => {
    const service = createService();

    const created = service.createPortfolio(
      portfolio,
    );

    expect(created).toEqual(portfolio);
    expect(service.getPortfolio(portfolio.id)).toEqual(
      portfolio,
    );
  });

  it("rejects duplicate portfolio ids", () => {
    const service = createService();

    service.createPortfolio(portfolio);

    expect(() =>
      service.createPortfolio(portfolio),
    ).toThrow(PortfolioError);
  });

  it("rejects missing portfolios", () => {
    const service = createService();

    expect(() =>
      service.getPortfolio("missing"),
    ).toThrow(PortfolioError);
  });

  it("lists portfolios", () => {
    const service = createService();

    service.createPortfolio(portfolio);

    expect(service.listPortfolios()).toEqual([
      portfolio,
    ]);
  });

  it("records a buy transaction and updates cash and position", async () => {
    const service = createService();

    service.createPortfolio(portfolio);

    const transaction = createTransaction({
      id: "buy-1",
      quantity: 10,
      price: 100,
    });

    await service.recordTransaction(
      transaction,
    );

    const storedPortfolio =
      service.getPortfolio(portfolio.id);

    expect(storedPortfolio.cashBalance).toBe(9000);

    const positions =
      service.getPositions(portfolio.id);

    expect(positions).toHaveLength(1);

    expect(positions[0]).toEqual(
      expect.objectContaining({
        instrument: expect.objectContaining({
          symbol: "AAPL",
        }),
        quantity: 10,
        averageCost: 100,
        costBasis: 1000,
        marketValue: 1000,
        unrealizedPnl: 0,
      }),
    );
  });

  it("records a sell transaction and realizes pnl", async () => {
    const service = createService();

    service.createPortfolio(portfolio);

    await service.recordTransaction(
      createTransaction({
        id: "buy-1",
        side: "buy",
        quantity: 10,
        price: 100,
      }),
    );

    service.updatePosition(
      createPosition({
        marketPrice: 110,
      }),
    );

    await service.recordTransaction(
      createTransaction({
        id: "sell-1",
        side: "sell",
        quantity: 5,
        price: 120,
        executedAt:
          "2026-09-02T10:00:00.000Z",
      }),
    );

    const valuation =
      await service.getValuation(
        portfolio.id,
        "2026-09-02T10:00:00.000Z",
      );

    expect(valuation).toEqual(
      expect.objectContaining({
        cashValue: 9600,
        positionsValue: 550,
        realizedPnl: 100,
        totalPnl: 150,
        totalValue: 10150,
        unrealizedPnl: 50,
      }),
    );
  });

  it("converts foreign-currency transaction cash flows into the portfolio base currency", async () => {
    const service = createService();

    service.createPortfolio(portfolio);

    const gbpInstrument: Instrument = {
      symbol: "VOD",
      name: "Vodafone Group plc",
      exchangeId: "lse",
      countryCode: "GB",
      currency: "GBP",
      assetClass: "equity",
    };

    await service.recordTransaction(
      createTransaction({
        id: "gbp-buy-1",
        symbol: "VOD",
        instrument: gbpInstrument,
        quantity: 10,
        price: 100,
      }),
    );

    await service.recordTransaction(
      createTransaction({
        id: "gbp-sell-1",
        symbol: "VOD",
        instrument: gbpInstrument,
        side: "sell",
        quantity: 5,
        price: 120,
        executedAt:
          "2026-09-02T10:00:00.000Z",
      }),
    );

    const valuation =
      await service.getValuation(
        portfolio.id,
        "2026-09-02T10:00:00.000Z",
      );

    const gbpToUsd = 1 / 0.77;

    const expectedBuyCashImpact =
      1_000 * gbpToUsd;

    const expectedSellCashImpact =
      600 * gbpToUsd;

    const expectedCashBalance =
      10_000 -
      expectedBuyCashImpact +
      expectedSellCashImpact;

    const expectedRealizedPnl =
      100 * gbpToUsd;

    const expectedPositionsValue =
      500 * gbpToUsd;

    const expectedTotalValue =
      expectedCashBalance +
      expectedPositionsValue;

    expect(
      valuation.cashValue,
    ).toBeCloseTo(
      expectedCashBalance,
      10,
    );

    expect(valuation.realizedPnl).toBeCloseTo(
      expectedRealizedPnl,
      10,
    );

    expect(
      valuation.positionsValue,
    ).toBeCloseTo(
      expectedPositionsValue,
      10,
    );

    expect(valuation.unrealizedPnl).toBeCloseTo(
      0,
      10,
    );

    expect(valuation.totalPnl).toBeCloseTo(
      expectedRealizedPnl,
      10,
    );

    expect(valuation.totalValue).toBeCloseTo(
      expectedTotalValue,
      10,
    );

    expect(valuation.baseCurrency).toBe("USD");
  });

  it("rejects a buy when cash is insufficient", async () => {
    const service = createService();

    service.createPortfolio({
      ...portfolio,
      cashBalance: 100,
    });

    await expect(
      service.recordTransaction(
        createTransaction({
          quantity: 2,
          price: 100,
        }),
      ),
    ).rejects.toThrow("Insufficient cash");
  });

  it("rejects a sell when quantity is insufficient", async () => {
    const service = createService();

    service.createPortfolio(portfolio);

    await expect(
      service.recordTransaction(
        createTransaction({
          id: "sell-1",
          side: "sell",
          quantity: 1,
          price: 100,
        }),
      ),
    ).rejects.toThrow("Insufficient quantity");
  });

  it("rejects duplicate transaction ids", async () => {
    const service = createService();

    service.createPortfolio(portfolio);

    const transaction = createTransaction();

    await service.recordTransaction(
      transaction,
    );

    await expect(
      service.recordTransaction(
        transaction,
      ),
    ).rejects.toThrow("already exists");
  });

  it("updates a position", () => {
    const service = createService();

    service.createPortfolio(portfolio);

    const position = createPosition({
      marketPrice: 120,
    });

    const updated =
      service.updatePosition(position);

    expect(updated).toEqual(
      expect.objectContaining({
        quantity: 10,
        averageCost: 100,
        costBasis: 1000,
        marketValue: 1200,
        unrealizedPnl: 200,
        unrealizedPnlPercent: 20,
      }),
    );
  });

  it("rebuilds a position from transactions", async () => {
    const service = createService();

    service.createPortfolio(portfolio);

    await service.recordTransaction(
      createTransaction({
        id: "buy-1",
        quantity: 10,
        price: 100,
      }),
    );

    await service.recordTransaction(
      createTransaction({
        id: "buy-2",
        quantity: 10,
        price: 120,
        executedAt:
          "2026-09-02T10:00:00.000Z",
      }),
    );

    const position =
      service.rebuildPosition(
        portfolio.id,
        "AAPL",
        130,
        "2026-09-03T10:00:00.000Z",
      );

    expect(position).toEqual(
      expect.objectContaining({
        quantity: 20,
        averageCost: 110,
        costBasis: 2200,
        marketValue: 2600,
        unrealizedPnl: 400,
      }),
    );
  });

  it("keeps positions separate for the same symbol on different exchanges", async () => {
    const service = createService();

    service.createPortfolio(portfolio);

    const londonInstrument: Instrument = {
      ...instrument,
      exchangeId: "lse",
      countryCode: "GB",
      currency: "GBP",
    };

    await service.recordTransaction(
      createTransaction({
        id: "buy-us",
        instrument,
        symbol: "ABC",
        quantity: 10,
        price: 100,
      }),
    );

    await service.recordTransaction(
      createTransaction({
        id: "buy-gb",
        instrument: londonInstrument,
        symbol: "ABC",
        quantity: 5,
        price: 200,
      }),
    );

    const positions =
      service.getPositions(portfolio.id);

    expect(positions).toHaveLength(2);
  });

  it("sells against the correct listing when symbols are identical", async () => {
    const service = createService();

    service.createPortfolio(portfolio);

    const londonInstrument: Instrument = {
      ...instrument,
      exchangeId: "lse",
      countryCode: "GB",
      currency: "GBP",
    };

    await service.recordTransaction(
      createTransaction({
        id: "buy-us",
        instrument,
        symbol: "ABC",
        quantity: 10,
        price: 100,
      }),
    );

    await service.recordTransaction(
      createTransaction({
        id: "buy-gb",
        instrument: londonInstrument,
        symbol: "ABC",
        quantity: 5,
        price: 200,
      }),
    );

    await service.recordTransaction(
      createTransaction({
        id: "sell-gb",
        instrument: londonInstrument,
        symbol: "ABC",
        side: "sell",
        quantity: 5,
        price: 220,
        executedAt:
          "2026-09-03T10:00:00.000Z",
      }),
    );

    const positions =
      service.getPositions(portfolio.id);

    expect(positions).toHaveLength(1);

    expect(
      positions[0].instrument.exchangeId,
    ).toBe("nasdaq");

    expect(positions[0].quantity).toBe(10);
  });

  it("does not allow selling one listing using another listing's quantity", async () => {
    const service = createService();

    service.createPortfolio(portfolio);

    await service.recordTransaction(
      createTransaction({
        id: "buy-us",
        instrument,
        symbol: "ABC",
        quantity: 10,
        price: 100,
      }),
    );

    const londonInstrument: Instrument = {
      ...instrument,
      exchangeId: "lse",
      countryCode: "GB",
      currency: "GBP",
    };

    await expect(
      service.recordTransaction(
        createTransaction({
          id: "sell-gb",
          instrument: londonInstrument,
          symbol: "ABC",
          side: "sell",
          quantity: 1,
          price: 100,
        }),
      ),
    ).rejects.toThrow("Insufficient quantity");
  });

  it("keeps transaction history chronological when transactions are inserted out of order", async () => {
    const service = createService();

    service.createPortfolio(portfolio);

    await service.recordTransaction(
      createTransaction({
        id: "later",
        executedAt:
          "2026-09-03T10:00:00.000Z",
      }),
    );

    await service.recordTransaction(
      createTransaction({
        id: "earlier",
        executedAt:
          "2026-09-02T10:00:00.000Z",
      }),
    );

    const transactions =
      service.getTransactions(portfolio.id);

    expect(
      transactions.map(
        (transaction) => transaction.id,
      ),
    ).toEqual([
      "earlier",
      "later",
    ]);
  });

  it("rebuilds the correct cash balance when transactions are inserted out of order", async () => {
    const service = createService();

    service.createPortfolio(portfolio);

    await service.recordTransaction(
      createTransaction({
        id: "later-buy",
        quantity: 10,
        price: 100,
        executedAt:
          "2026-09-03T10:00:00.000Z",
      }),
    );

    await service.recordTransaction(
      createTransaction({
        id: "earlier-buy",
        quantity: 5,
        price: 200,
        executedAt:
          "2026-09-02T10:00:00.000Z",
      }),
    );

    const storedPortfolio =
      service.getPortfolio(portfolio.id);

    expect(
      storedPortfolio.cashBalance,
    ).toBe(8000);
  });

  it("rebuilds the correct position when transactions are inserted out of order", async () => {
    const service = createService();

    service.createPortfolio(portfolio);

    await service.recordTransaction(
      createTransaction({
        id: "later-buy",
        quantity: 10,
        price: 100,
        executedAt:
          "2026-09-03T10:00:00.000Z",
      }),
    );

    await service.recordTransaction(
      createTransaction({
        id: "earlier-buy",
        quantity: 5,
        price: 200,
        executedAt:
          "2026-09-02T10:00:00.000Z",
      }),
    );

    const positions =
      service.getPositions(portfolio.id);

    expect(positions).toHaveLength(1);

    expect(positions[0]).toEqual(
      expect.objectContaining({
        quantity: 15,
        averageCost:
          (5 * 200 + 10 * 100) / 15,
        costBasis: 2000,
      }),
    );
  });

  it("rejects an out-of-order transaction that makes the chronological cash balance negative", async () => {
    const service = createService();

    service.createPortfolio({
      ...portfolio,
      cashBalance: 1_500,
    });

    await service.recordTransaction(
      createTransaction({
        id: "later-buy",
        quantity: 5,
        price: 100,
        executedAt:
          "2026-09-03T10:00:00.000Z",
      }),
    );

    await expect(
      service.recordTransaction(
        createTransaction({
          id: "earlier-buy",
          quantity: 11,
          price: 100,
          executedAt:
            "2026-09-02T10:00:00.000Z",
        }),
      ),
    ).rejects.toThrow("Insufficient cash");

    expect(
      service.getTransactions(
        portfolio.id,
      ).map(
        (transaction) => transaction.id,
      ),
    ).toEqual(["later-buy"]);

    expect(
      service.getPortfolio(
        portfolio.id,
      ).cashBalance,
    ).toBe(1_000);

    expect(
      service.getPositions(
        portfolio.id,
      )[0].quantity,
    ).toBe(5);
  });

  it("does not mutate the existing ledger when an out-of-order transaction is rejected", async () => {
    const service = createService();

    service.createPortfolio({
      ...portfolio,
      cashBalance: 1_500,
    });

    await service.recordTransaction(
      createTransaction({
        id: "valid-buy",
        quantity: 5,
        price: 100,
        executedAt:
          "2026-09-03T10:00:00.000Z",
      }),
    );

    const transactionsBefore =
      service.getTransactions(
        portfolio.id,
      );

    const positionsBefore =
      service.getPositions(
        portfolio.id,
      );

    const portfolioBefore =
      service.getPortfolio(
        portfolio.id,
      );

    await expect(
      service.recordTransaction(
        createTransaction({
          id: "invalid-earlier-buy",
          quantity: 11,
          price: 100,
          executedAt:
            "2026-09-02T10:00:00.000Z",
        }),
      ),
    ).rejects.toThrow("Insufficient cash");

    expect(
      service.getTransactions(
        portfolio.id,
      ),
    ).toEqual(transactionsBefore);

    expect(
      service.getPositions(
        portfolio.id,
      ),
    ).toEqual(positionsBefore);

    expect(
      service.getPortfolio(
        portfolio.id,
      ),
    ).toEqual(portfolioBefore);
  });
});