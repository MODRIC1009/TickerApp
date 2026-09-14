import { describe, expect, it } from "vitest";

import {
  generateStrategySignals,
  type StrategyConfig,
} from "./strategy";

const config: StrategyConfig = {
  id: "sma-rsi",
  name: "SMA RSI Strategy",
  shortPeriod: 2,
  longPeriod: 3,
  rsiPeriod: 2,
  rsiOversold: 70,
  rsiOverbought: 80,
};

describe("strategy signals", () => {
  it("generates hold signals while indicators are warming up", () => {
    const result =
      generateStrategySignals(
        [
          {
            timestamp: "2026-01-01",
            price: 100,
          },
          {
            timestamp: "2026-01-02",
            price: 98,
          },
        ],
        config,
      );

    expect(result).toHaveLength(2);
    expect(result[0].action).toBe("hold");
    expect(result[1].action).toBe("hold");
    expect(result[0].position).toBe("flat");
    expect(result[1].position).toBe("flat");
  });

  it("generates a buy signal for a bullish oversold setup", () => {
    const result =
      generateStrategySignals(
        [
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
        ],
        config,
      );

    const buySignal =
      result.find(
        (signal) =>
          signal.action === "buy",
      );

    expect(buySignal).toBeDefined();
    expect(buySignal?.position).toBe(
      "long",
    );
    expect(
      buySignal?.reason,
    ).toContain(
      "Bullish trend",
    );
  });

  it("generates a sell signal when an existing long becomes bearish", () => {
    const result =
      generateStrategySignals(
        [
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
            price: 80,
          },
          {
            timestamp: "2026-01-06",
            price: 70,
          },
        ],
        config,
      );

    const buyIndex =
      result.findIndex(
        (signal) =>
          signal.action === "buy",
      );

    const sellIndex =
      result.findIndex(
        (signal) =>
          signal.action === "sell",
      );

    expect(buyIndex).toBeGreaterThanOrEqual(
      0,
    );
    expect(sellIndex).toBeGreaterThan(
      buyIndex,
    );
    expect(
      result[sellIndex].position,
    ).toBe("flat");
  });

  it("does not open a position without bullish trend confirmation", () => {
    const result =
      generateStrategySignals(
        [
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
            price: 70,
          },
          {
            timestamp: "2026-01-05",
            price: 60,
          },
        ],
        config,
      );

    expect(
      result.some(
        (signal) =>
          signal.action === "buy",
      ),
    ).toBe(false);
  });

  it("rejects invalid strategy configuration", () => {
    expect(() =>
      generateStrategySignals(
        [
          {
            timestamp: "2026-01-01",
            price: 100,
          },
        ],
        {
          ...config,
          shortPeriod: 5,
          longPeriod: 3,
        },
      ),
    ).toThrow(
      "Short period must be smaller than long period.",
    );
  });

  it("rejects invalid strategy prices", () => {
    expect(() =>
      generateStrategySignals(
        [
          {
            timestamp: "2026-01-01",
            price: 0,
          },
        ],
        config,
      ),
    ).toThrow(
      "Strategy prices must be finite and greater than zero.",
    );
  });
});