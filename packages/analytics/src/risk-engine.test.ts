import {
  describe,
  expect,
  it,
} from "vitest";

import {
  calculateRisk,
  type RiskEngineInput,
} from "./risk-engine";

function buildReturns(
  count: number,
  dailyReturn: number,
): number[] {
  return Array.from(
    { length: count },
    () => dailyReturn,
  );
}

function buildAlternatingReturns(
  count: number,
  magnitude: number,
): number[] {
  return Array.from(
    { length: count },
    (_, index) =>
      index % 2 === 0
        ? magnitude
        : -magnitude,
  );
}

describe("risk engine", () => {
  it("returns a bounded risk score and valid risk group", () => {
    const input: RiskEngineInput = {
      symbol: "TEST",
      marketCap:
        1_000_000_000_000,
      volume: 10_000_000,
      volumeUsd:
        2_000_000_000,
      beta: 0.9,
      returns:
        buildAlternatingReturns(
          120,
          0.005,
        ),
      benchmarkReturns:
        buildAlternatingReturns(
          120,
          0.003,
        ),
      historyDays: 252,
    };

    const result =
      calculateRisk(input);

    expect(result.symbol).toBe(
      "TEST",
    );

    expect(result.score).toBeGreaterThanOrEqual(
      0,
    );

    expect(result.score).toBeLessThanOrEqual(
      100,
    );

    expect([
      "Very Stable",
      "Stable",
      "Moderate",
      "Risky",
      "Very Risky",
    ]).toContain(result.group);

    expect(
      result.confidence,
    ).toBeGreaterThan(0);

    expect(
      result.confidence,
    ).toBeLessThanOrEqual(100);

    expect(
      result.suggestedLeverage,
    ).toBeGreaterThanOrEqual(1);

    expect(
      result.suggestedLeverage,
    ).toBeLessThanOrEqual(4);
  });

  it("calculates volatility only when the required history exists", () => {
    const result =
      calculateRisk({
        symbol: "VOL",
        returns:
          buildAlternatingReturns(
            120,
            0.01,
          ),
        historyDays: 120,
      });

    expect(
      result.metrics.volatility30d,
    ).not.toBeNull();

    expect(
      result.metrics.volatility60d,
    ).not.toBeNull();

    expect(
      result.metrics.volatility90d,
    ).not.toBeNull();

    expect(
      result.metrics.volatility30d ??
        0,
    ).toBeGreaterThan(0);

    expect(
      result.metrics.volatility60d ??
        0,
    ).toBeGreaterThan(0);

    expect(
      result.metrics.volatility90d ??
        0,
    ).toBeGreaterThan(0);
  });

  it("does not fabricate volatility windows from insufficient history", () => {
    const result =
      calculateRisk({
        symbol: "LIMITED",
        returns: [
          0.01,
          -0.01,
          0.005,
        ],
        historyDays: 3,
      });

    expect(
      result.metrics.volatility30d,
    ).toBeNull();

    expect(
      result.metrics.volatility60d,
    ).toBeNull();

    expect(
      result.metrics.volatility90d,
    ).toBeNull();
  });

  it("requires a complete 30-session history for momentum30d", () => {
    const shortHistory =
      calculateRisk({
        symbol: "SHORT",
        returns:
          buildReturns(
            29,
            0.01,
          ),
      });

    expect(
      shortHistory.metrics
        .momentum30d,
    ).toBeNull();

    const fullHistory =
      calculateRisk({
        symbol: "FULL",
        returns:
          buildReturns(
            30,
            0.01,
          ),
      });

    expect(
      fullHistory.metrics
        .momentum30d,
    ).not.toBeNull();

    expect(
      fullHistory.metrics
        .momentum30d ?? 0,
    ).toBeGreaterThan(0);
  });

  it("detects benchmark correlation and calculates beta", () => {
    const benchmarkReturns =
      buildAlternatingReturns(
        120,
        0.005,
      );

    const securityReturns =
      benchmarkReturns.map(
        (value) =>
          value * 1.5,
      );

    const result =
      calculateRisk({
        symbol: "BETA",
        returns:
          securityReturns,
        benchmarkReturns,
        historyDays: 120,
      });

    expect(
      result.metrics.correlation,
    ).not.toBeNull();

    expect(
      result.metrics.beta,
    ).not.toBeNull();

    expect(
      result.metrics.correlation ??
        0,
    ).toBeGreaterThan(0.95);

    expect(
      result.metrics.beta ?? 0,
    ).toBeGreaterThan(1);
  });

  it("detects historical drawdown", () => {
    const returns = [
      ...buildReturns(
        60,
        0.01,
      ),
      ...buildReturns(
        20,
        -0.03,
      ),
      ...buildReturns(
        40,
        0.002,
      ),
    ];

    const result =
      calculateRisk({
        symbol: "DD",
        returns,
        historyDays:
          returns.length,
      });

    expect(
      result.metrics.maxDrawdown,
    ).not.toBeNull();

    expect(
      result.metrics.currentDrawdown,
    ).not.toBeNull();

    expect(
      result.metrics.maxDrawdown ??
        0,
    ).toBeGreaterThan(0);

    expect(
      result.metrics.currentDrawdown ??
        0,
    ).toBeGreaterThan(0);
  });

  it("calculates tail-risk measures when enough history exists", () => {
    const returns = [
      ...buildReturns(
        110,
        0.002,
      ),
      -0.08,
      -0.1,
      -0.12,
      -0.06,
      -0.05,
      -0.04,
      -0.03,
      -0.02,
      -0.01,
      -0.09,
    ];

    const result =
      calculateRisk({
        symbol: "TAIL",
        returns,
        historyDays:
          returns.length,
      });

    expect(
      result.metrics.var95,
    ).not.toBeNull();

    expect(
      result.metrics.cvar95,
    ).not.toBeNull();

    expect(
      result.metrics.var95 ?? 0,
    ).toBeGreaterThan(0);

    expect(
      result.metrics.cvar95 ?? 0,
    ).toBeGreaterThan(0);

    expect(
      result.metrics.cvar95 ??
        0,
    ).toBeGreaterThanOrEqual(
      result.metrics.var95 ??
        0,
    );
  });

  it("calculates recent momentum", () => {
    const result =
      calculateRisk({
        symbol: "MOM",
        returns:
          buildReturns(
            60,
            0.01,
          ),
        historyDays: 60,
      });

    expect(
      result.metrics.momentum30d,
    ).not.toBeNull();

    expect(
      result.metrics.momentum30d ??
        0,
    ).toBeGreaterThan(0);
  });

  it("reduces confidence when historical data is insufficient", () => {
    const result =
      calculateRisk({
        symbol: "LIMITED",
        returns: [
          0.01,
          -0.01,
          0.005,
        ],
      });

    expect(
      result.confidence,
    ).toBeLessThan(70);

    expect(
      result.metrics.volatility30d,
    ).toBeNull();

    expect(
      result.metrics.volatility60d,
    ).toBeNull();

    expect(
      result.metrics.volatility90d,
    ).toBeNull();

    expect(
      result.metrics.var95,
    ).toBeNull();

    expect(
      result.metrics.cvar95,
    ).toBeNull();

    expect(
      result.metrics.momentum30d,
    ).toBeNull();
  });

  it("uses supplied beta when provider beta is available", () => {
    const result =
      calculateRisk({
        symbol: "SUPPLIED",
        beta: 1.75,
        returns:
          buildReturns(
            100,
            0.002,
          ),
        benchmarkReturns:
          buildReturns(
            100,
            0.001,
          ),
      });

    expect(
      result.metrics.beta,
    ).toBe(1.75);
  });

  it("produces explainable component contributions", () => {
    const result =
      calculateRisk({
        symbol: "EXPLAIN",
        marketCap:
          500_000_000_000,
        volumeUsd:
          1_000_000_000,
        beta: 1.2,
        returns:
          buildAlternatingReturns(
            120,
            0.008,
          ),
        benchmarkReturns:
          buildAlternatingReturns(
            120,
            0.004,
          ),
        historyDays: 252,
      });

    const components =
      Object.values(
        result.components,
      );

    expect(
      components,
    ).toHaveLength(6);

    for (const component of components) {
      expect(
        component.label.length,
      ).toBeGreaterThan(0);

      expect(
        component.explanation
          .length,
      ).toBeGreaterThan(0);

      expect(
        component.score,
      ).toBeGreaterThanOrEqual(
        0,
      );

      expect(
        component.score,
      ).toBeLessThanOrEqual(
        100,
      );

      expect(
        component.weight,
      ).toBeGreaterThan(0);

      expect(
        component.contribution,
      ).toBeGreaterThanOrEqual(
        0,
      );
    }

    expect(
      result.drivers,
    ).toHaveLength(3);

    expect(
      result.drivers.every(
        (driver) =>
          driver.length > 0,
      ),
    ).toBe(true);
  });

  it("keeps risk score equal to the weighted component score", () => {
    const result =
      calculateRisk({
        symbol: "WEIGHTED",
        returns:
          buildAlternatingReturns(
            120,
            0.01,
          ),
        benchmarkReturns:
          buildAlternatingReturns(
            120,
            0.005,
          ),
        marketCap:
          100_000_000_000,
        volumeUsd:
          500_000_000,
        historyDays: 252,
      });

    const weightedScore =
      Object.values(
        result.components,
      ).reduce(
        (total, component) =>
          total +
          component.contribution,
        0,
      );

    expect(
      result.score,
    ).toBeCloseTo(
      weightedScore,
      1,
    );
  });

  it("handles missing benchmark data without failing", () => {
    const result =
      calculateRisk({
        symbol: "NOBENCH",
        returns:
          buildAlternatingReturns(
            120,
            0.01,
          ),
      });

    expect(
      result.metrics.beta,
    ).toBeNull();

    expect(
      result.metrics.correlation,
    ).toBeNull();

    expect(
      result.score,
    ).toBeGreaterThanOrEqual(
      0,
    );

    expect(
      result.score,
    ).toBeLessThanOrEqual(
      100,
    );
  });
});