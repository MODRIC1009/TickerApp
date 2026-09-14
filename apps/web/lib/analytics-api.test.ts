import {
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  runBacktest,
} from "./analytics-api";

const input = [
  {
    timestamp: "2026-01-01",
    price: 100,
  },
  {
    timestamp: "2026-01-02",
    price: 110,
  },
];

const config = {
  symbol: "NVDA",
  strategy: {
    id: "test-strategy",
    name: "Test Strategy",
    shortPeriod: 2,
    longPeriod: 3,
    rsiPeriod: 2,
    rsiOversold: 30,
    rsiOverbought: 70,
  },
  initialCapital: 10_000,
};

describe("analytics API client", () => {
  it("returns a backtest result for a successful response", async () => {
    const response = {
      ok: true,
      json: vi.fn().mockResolvedValue({
        success: true,
        result: {
          strategyId:
            "test-strategy",
          symbol: "NVDA",
          startDate:
            "2026-01-01",
          endDate:
            "2026-01-02",
          summary: {
            initialCapital: 10_000,
            finalCapital: 10_100,
            netProfit: 100,
            totalReturn: 0.01,
            annualizedReturn:
              0.01,
            maxDrawdown: 0,
            maxDrawdownPercent: 0,
            volatility: 0,
            sharpeRatio: 0,
            sortinoRatio: 0,
            winRate: 0,
            profitFactor: 0,
            tradeCount: 0,
          },
          equityCurve: [],
          trades: [],
        },
      }),
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response,
      ),
    );

    const result =
      await runBacktest(
        input,
        config,
      );

    expect(
      result.symbol,
    ).toBe("NVDA");

    expect(
      result.strategyId,
    ).toBe("test-strategy");

    expect(
      result.summary
        .finalCapital,
    ).toBe(10_100);
  });

  it("throws the API error message for an unsuccessful response", async () => {
    const response = {
      ok: false,
      json: vi.fn().mockResolvedValue({
        success: false,
        error: {
          code: "invalid_request",
          message:
            "Backtest symbol is required.",
        },
      }),
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response,
      ),
    );

    await expect(
      runBacktest(
        input,
        config,
      ),
    ).rejects.toThrow(
      "Backtest symbol is required.",
    );
  });

  it("throws when the service returns invalid JSON", async () => {
    const response = {
      ok: true,
      json: vi.fn().mockRejectedValue(
        new Error("Invalid JSON"),
      ),
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        response,
      ),
    );

    await expect(
      runBacktest(
        input,
        config,
      ),
    ).rejects.toThrow(
      "The backtest service returned an invalid response.",
    );
  });
});