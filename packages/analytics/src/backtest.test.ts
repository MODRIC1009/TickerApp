import {
  describe,
  expect,
  it,
} from "vitest";

import {
  runBacktest,
  type BacktestConfig,
} from "./backtest";

const config: BacktestConfig = {
  symbol: "NVDA",
  strategy: {
    id: "test-strategy",
    name: "Test Strategy",
    shortPeriod: 2,
    longPeriod: 3,
    rsiPeriod: 2,
    rsiOversold: 70,
    rsiOverbought: 80,
  },
  initialCapital: 10_000,
  positionSizePercent: 100,
  transactionFeePercent: 0,
  slippagePercent: 0,
};

const prices = [
  {
    timestamp: "2026-01-01",
    price: 100,
  },
  {
    timestamp: "2026-01-02",
    price: 90,
  },
  {
    timestamp: "2026-01-03",
    price: 80,
  },
  {
    timestamp: "2026-01-04",
    price: 102,
  },
  {
    timestamp: "2026-01-05",
    price: 110,
  },
  {
    timestamp: "2026-01-06",
    price: 80,
  },
  {
    timestamp: "2026-01-07",
    price: 70,
  },
];

describe("backtest engine", () => {
  it("runs a backtest and produces an equity curve", () => {
    const result =
      runBacktest(
        prices,
        config,
      );

    expect(
      result.strategyId,
    ).toBe("test-strategy");

    expect(result.symbol).toBe(
      "NVDA",
    );

    expect(result.startDate).toBe(
      "2026-01-01",
    );

    expect(result.endDate).toBe(
      "2026-01-07",
    );

    expect(
      result.equityCurve,
    ).toHaveLength(7);

    expect(
      result.summary.initialCapital,
    ).toBe(10_000);

    expect(
      result.summary.finalCapital,
    ).toBeGreaterThan(0);
  });

  it("records buy and sell trades with the configured symbol", () => {
    const result =
      runBacktest(
        prices,
        config,
      );

    expect(
      result.trades.some(
        (trade) =>
          trade.side === "buy",
      ),
    ).toBe(true);

    expect(
      result.trades.some(
        (trade) =>
          trade.side === "sell",
      ),
    ).toBe(true);

    expect(
      result.trades.every(
        (trade) =>
          trade.symbol ===
          "NVDA",
      ),
    ).toBe(true);
  });

  it("applies transaction fees and slippage", () => {
    const result =
      runBacktest(
        prices,
        {
          ...config,
          transactionFeePercent:
            0.1,
          slippagePercent: 0.2,
        },
      );

    expect(
      result.trades.length,
    ).toBeGreaterThan(0);

    expect(
      result.trades.every(
        (trade) =>
          trade.fees >= 0,
      ),
    ).toBe(true);

    expect(
      result.trades.some(
        (trade) =>
          trade.slippage !== 0,
      ),
    ).toBe(true);
  });

  it("respects position sizing", () => {
    const result =
      runBacktest(
        prices.slice(0, 4),
        {
          ...config,
          positionSizePercent: 50,
        },
      );

    const buyTrade =
      result.trades.find(
        (trade) =>
          trade.side === "buy",
      );

    expect(
      buyTrade,
    ).toBeDefined();

    expect(
      buyTrade!.quantity *
        buyTrade!.price,
    ).toBeCloseTo(5_000);
  });

  it("rejects an empty symbol", () => {
    expect(() =>
      runBacktest(
        prices,
        {
          ...config,
          symbol: " ",
        },
      ),
    ).toThrow(
      "Backtest symbol is required.",
    );
  });

  it("rejects invalid initial capital", () => {
    expect(() =>
      runBacktest(
        prices.slice(0, 2),
        {
          ...config,
          initialCapital: 0,
        },
      ),
    ).toThrow(
      "Initial capital must be finite and greater than zero.",
    );
  });

  it("rejects invalid position sizing", () => {
    expect(() =>
      runBacktest(
        prices.slice(0, 2),
        {
          ...config,
          positionSizePercent: 101,
        },
      ),
    ).toThrow(
      "Position size percent must be greater than zero and at most 100.",
    );
  });

  it("rejects insufficient historical data", () => {
    expect(() =>
      runBacktest(
        prices.slice(0, 1),
        config,
      ),
    ).toThrow(
      "At least two observations are required for a backtest.",
    );
  });
});