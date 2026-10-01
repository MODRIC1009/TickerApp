/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskScorePanel } from "./risk-score-panel";
import type { RiskResult } from "@/lib/risk-api";

const result: RiskResult = {
  symbol: "AAPL",
  score: 34,
  group: "Stable",
  suggestedLeverage: 2.98,
  confidence: 87,

  components: {
    systematic: {
      score: 30,
      weight: 0.2,
      contribution: 6,
      label: "Systematic risk",
      explanation:
        "Systematic risk reflects benchmark sensitivity.",
    },
    volatility: {
      score: 28,
      weight: 0.22,
      contribution: 6.16,
      label: "Volatility",
      explanation:
        "Realized volatility remains relatively controlled.",
    },
    drawdown: {
      score: 38,
      weight: 0.2,
      contribution: 7.6,
      label: "Drawdown",
      explanation:
        "Historical drawdown has been moderate.",
    },
    liquidity: {
      score: 15,
      weight: 0.13,
      contribution: 1.95,
      label: "Liquidity",
      explanation:
        "Trading activity indicates relatively strong liquidity.",
    },
    tail: {
      score: 43,
      weight: 0.15,
      contribution: 6.45,
      label: "Tail risk",
      explanation:
        "Extreme downside movements remain a consideration.",
    },
    momentum: {
      score: 22,
      weight: 0.1,
      contribution: 2.2,
      label: "Price behavior",
      explanation:
        "Recent price behavior is relatively contained.",
    },
  },

  metrics: {
    beta: 1.02,
    correlation: 0.84,
    volatility30d: 0.21,
    volatility60d: 0.24,
    volatility90d: 0.26,
    downsideDeviation: 0.18,
    maxDrawdown: 0.27,
    currentDrawdown: 0.08,
    var95: 0.032,
    cvar95: 0.047,
    momentum30d: 0.06,
  },

  drivers: [
    "Historical drawdown has been moderate.",
    "Extreme downside movements remain a consideration.",
    "Realized volatility remains relatively controlled.",
  ],
};

describe("RiskScorePanel", () => {
  it("renders the quantitative risk score", () => {
    render(<RiskScorePanel result={result} />);

    expect(screen.getByText("34")).toBeTruthy();
    expect(screen.getByText("Stable")).toBeTruthy();
    expect(screen.getByText("87%")).toBeTruthy();
  });

  it("renders all risk components", () => {
    render(<RiskScorePanel result={result} />);

    expect(
      screen.getAllByText("Systematic risk").length,
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("Volatility").length,
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("Drawdown").length,
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("Liquidity").length,
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("Tail risk").length,
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("Price behavior").length,
    ).toBeGreaterThan(0);
  });

  it("renders quantitative metrics", () => {
    render(<RiskScorePanel result={result} />);

    expect(
      screen.getAllByText("1.02").length,
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("21.0%").length,
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("27.0%").length,
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText("3.2%").length,
    ).toBeGreaterThan(0);
  });

  it("renders primary risk drivers", () => {
    render(<RiskScorePanel result={result} />);

    expect(
      screen.getAllByText(
        "Historical drawdown has been moderate.",
      ).length,
    ).toBeGreaterThan(0);

    expect(
      screen.getAllByText(
        "Extreme downside movements remain a consideration.",
      ).length,
    ).toBeGreaterThan(0);
  });

  it("renders a loading state", () => {
    render(
      <RiskScorePanel
        result={null}
        loading
      />,
    );

    expect(
      screen.getByText(
        "Loading quantitative risk analysis...",
      ),
    ).toBeTruthy();
  });

  it("renders an error state", () => {
    render(
      <RiskScorePanel
        result={null}
        error="Risk service unavailable."
      />,
    );

    expect(
      screen.getByText("Risk engine unavailable"),
    ).toBeTruthy();

    expect(
      screen.getByText("Risk service unavailable."),
    ).toBeTruthy();
  });

  it("renders the empty state", () => {
    render(<RiskScorePanel result={null} />);

    expect(
      screen.getByText(
        "Risk analysis will appear when sufficient market and historical data is available.",
      ),
    ).toBeTruthy();
  });
});