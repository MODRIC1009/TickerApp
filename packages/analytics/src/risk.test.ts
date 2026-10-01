import { describe, expect, it } from "vitest";

import {
  calculateDrawdown,
  calculateMaxDrawdown,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateVolatility,
} from "./risk";

describe("risk", () => {
  it("calculates annualized volatility", () => {
    const result = calculateVolatility(
      [0.01, -0.01, 0.02, -0.02],
      252,
    );

    expect(result).toBeGreaterThan(0);
  });

  it("calculates Sharpe ratio", () => {
    const result = calculateSharpeRatio(
      [0.01, 0.02, 0.01, 0.02],
      0,
      252,
    );

    expect(result).toBeGreaterThan(0);
  });

  it("returns zero Sharpe when volatility is zero", () => {
    expect(
      calculateSharpeRatio([0.01, 0.01]),
    ).toBe(0);
  });

  it("calculates Sortino ratio", () => {
    const result = calculateSortinoRatio([
      0.02,
      -0.01,
      0.03,
      -0.005,
    ]);

    expect(result).toBeGreaterThan(0);
  });

  it("calculates drawdown", () => {
    const result = calculateDrawdown([
      {
        timestamp: "2026-01-01",
        equity: 100,
      },
      {
        timestamp: "2026-01-02",
        equity: 120,
      },
      {
        timestamp: "2026-01-03",
        equity: 90,
      },
    ]);

    expect(result[2].peak).toBe(120);
    expect(result[2].drawdown).toBe(-30);
    expect(result[2].drawdownPercent).toBeCloseTo(-25);
  });

  it("calculates maximum drawdown", () => {
    const result = calculateMaxDrawdown([
      {
        timestamp: "2026-01-01",
        equity: 100,
      },
      {
        timestamp: "2026-01-02",
        equity: 120,
      },
      {
        timestamp: "2026-01-03",
        equity: 90,
      },
      {
        timestamp: "2026-01-04",
        equity: 110,
      },
    ]);

    expect(result.amount).toBe(-30);
    expect(result.percent).toBeCloseTo(-25);
  });

  it("rejects insufficient risk data", () => {
    expect(() =>
      calculateVolatility([0.01], 252),
    ).toThrow(
      "At least two returns and a positive annualization frequency are required.",
    );
  });
});