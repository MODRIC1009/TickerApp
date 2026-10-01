import { describe, expect, it } from "vitest";

import {
  calculateBenchmarkMetrics,
  calculatePerformanceMetrics,
} from "./performance";

describe("performance analytics", () => {
  it("calculates performance metrics", () => {
    const result =
      calculatePerformanceMetrics([
        {
          timestamp: "2026-01-01",
          price: 100,
        },
        {
          timestamp: "2026-01-02",
          price: 110,
        },
        {
          timestamp: "2026-01-03",
          price: 105,
        },
        {
          timestamp: "2026-01-04",
          price: 115,
        },
      ]);

    expect(result.totalReturn).toBeCloseTo(0.15);
    expect(result.observationCount).toBe(4);
    expect(result.winRate).toBeCloseTo(2 / 3);
    expect(result.bestPeriod).toBeCloseTo(
      10 / 105,
    );
    expect(result.worstPeriod).toBeCloseTo(
      -5 / 110,
    );
    expect(result.maxDrawdown).toBeCloseTo(-5);
    expect(
      result.maxDrawdownPercent,
    ).toBeCloseTo((-5 / 110) * 100);
  });

  it("calculates a positive profit factor", () => {
    const result =
      calculatePerformanceMetrics([
        {
          timestamp: "2026-01-01",
          price: 100,
        },
        {
          timestamp: "2026-01-02",
          price: 110,
        },
        {
          timestamp: "2026-01-03",
          price: 105,
        },
      ]);

    expect(result.profitFactor).toBeCloseTo(
      0.1 / (5 / 110),
    );
  });

  it("returns infinite profit factor when there are gains but no losses", () => {
    const result =
      calculatePerformanceMetrics([
        {
          timestamp: "2026-01-01",
          price: 100,
        },
        {
          timestamp: "2026-01-02",
          price: 110,
        },
        {
          timestamp: "2026-01-03",
          price: 121,
        },
      ]);

    expect(result.profitFactor).toBe(
      Number.POSITIVE_INFINITY,
    );
  });

  it("calculates benchmark metrics", () => {
    const strategy = [
      0.02,
      0.03,
      -0.01,
      0.04,
    ];

    const benchmark = [
      0.01,
      0.02,
      -0.01,
      0.03,
    ];

    const result =
      calculateBenchmarkMetrics(
        strategy,
        benchmark,
      );

    expect(result.beta).toBeCloseTo(
      1.257142857142857,
    );

    expect(result.correlation).toBeCloseTo(
      0.9938586931957761,
    );

    expect(result.trackingError).toBeGreaterThan(
      0,
    );

    expect(result.informationRatio).toBeGreaterThan(
      0,
    );
  });

  it("handles a zero-variance benchmark", () => {
    const result =
      calculateBenchmarkMetrics(
        [0.01, 0.02, 0.03],
        [0.01, 0.01, 0.01],
      );

    expect(result.beta).toBe(0);
    expect(result.correlation).toBe(0);
  });

  it("rejects mismatched benchmark lengths", () => {
    expect(() =>
      calculateBenchmarkMetrics(
        [0.01, 0.02],
        [0.01],
      ),
    ).toThrow(
      "Strategy and benchmark returns must have equal length",
    );
  });

  it("rejects invalid periods per year", () => {
    expect(() =>
      calculateBenchmarkMetrics(
        [0.01, 0.02],
        [0.01, 0.02],
        0,
      ),
    ).toThrow(
      "Periods per year must be finite and positive.",
    );
  });
});