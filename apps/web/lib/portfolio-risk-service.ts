import type { Position } from "@tickerapp/portfolio";

import {
  calculateRisk,
  type RiskResult,
} from "@/lib/risk-api";

export type PortfolioRiskPosition = {
  symbol: string;
  weight: number;
  marketValue: number;
  risk: RiskResult | null;
  error: string | null;
};

export type PortfolioRiskGroup =
  | "Very Stable"
  | "Stable"
  | "Moderate"
  | "Risky"
  | "Very Risky";

export type PortfolioRiskAnalysis = {
  portfolioId: string;
  score: number | null;
  group: PortfolioRiskGroup | null;
  confidence: number | null;
  largestPositionWeight: number | null;
  weightedVolatility30d: number | null;
  weightedMaxDrawdown: number | null;
  weightedVar95: number | null;
  analyzedPositions: number;
  totalPositions: number;
  coveragePercent: number;
  drivers: string[];
  positions: PortfolioRiskPosition[];
};

function classifyRisk(
  score: number,
): PortfolioRiskGroup {
  if (score < 20) {
    return "Very Stable";
  }

  if (score < 40) {
    return "Stable";
  }

  if (score < 60) {
    return "Moderate";
  }

  if (score < 80) {
    return "Risky";
  }

  return "Very Risky";
}

function weightedAverage(
  values: Array<{
    value: number | null;
    weight: number;
  }>,
): number | null {
  const valid = values.filter(
    (item) =>
      item.value !== null &&
      Number.isFinite(item.value) &&
      item.weight > 0,
  );

  if (valid.length === 0) {
    return null;
  }

  const totalWeight = valid.reduce(
    (sum, item) => sum + item.weight,
    0,
  );

  if (totalWeight <= 0) {
    return null;
  }

  return (
    valid.reduce(
      (sum, item) =>
        sum +
        (item.value ?? 0) * item.weight,
      0,
    ) / totalWeight
  );
}

function uniqueDrivers(
  positions: PortfolioRiskPosition[],
): string[] {
  const counts = new Map<string, number>();

  for (const position of positions) {
    for (const driver of position.risk?.drivers ?? []) {
      counts.set(
        driver,
        (counts.get(driver) ?? 0) + 1,
      );
    }
  }

  return [...counts.entries()]
    .sort((left, right) => {
      return (
        right[1] - left[1] ||
        left[0].localeCompare(right[0])
      );
    })
    .slice(0, 5)
    .map(([driver]) => driver);
}

function getTotalMarketValue(
  positions: Position[],
): number {
  return positions.reduce(
    (total, position) => {
      const marketValue =
        Number.isFinite(position.marketValue)
          ? Math.max(0, position.marketValue)
          : 0;

      return total + marketValue;
    },
    0,
  );
}

export async function getPortfolioRiskAnalysis(
  portfolioId: string,
  positions: Position[],
): Promise<PortfolioRiskAnalysis> {
  const totalMarketValue =
    getTotalMarketValue(positions);

  const positionResults =
    await Promise.all(
      positions.map(
        async (
          position,
        ): Promise<PortfolioRiskPosition> => {
          const marketValue =
            Number.isFinite(position.marketValue)
              ? Math.max(
                  0,
                  position.marketValue,
                )
              : 0;

          const weight =
            totalMarketValue > 0
              ? (marketValue /
                  totalMarketValue) *
                100
              : 0;

          const symbol =
            position.instrument.symbol.trim().toUpperCase();

          try {
            const risk =
              await calculateRisk({
                symbol,
              });

            return {
              symbol,
              weight,
              marketValue,
              risk,
              error: null,
            };
          } catch (error) {
            return {
              symbol,
              weight,
              marketValue,
              risk: null,
              error:
                error instanceof Error
                  ? error.message
                  : "Risk analysis unavailable.",
            };
          }
        },
      ),
    );

  const analyzed =
    positionResults.filter(
      (
        position,
      ): position is PortfolioRiskPosition & {
        risk: RiskResult;
      } => position.risk !== null,
    );

  const analyzedWeight =
    analyzed.reduce(
      (total, position) =>
        total + position.weight,
      0,
    );

  const analyzedPositions =
    analyzed.length;

  const totalPositions =
    positionResults.length;

  const coveragePercent =
    totalMarketValue > 0
      ? analyzedWeight
      : totalPositions > 0
        ? (analyzedPositions /
            totalPositions) *
          100
        : 0;

  if (analyzed.length === 0) {
    return {
      portfolioId,
      score: null,
      group: null,
      confidence: null,
      largestPositionWeight:
        positionResults.length > 0
          ? Math.max(
              ...positionResults.map(
                (position) =>
                  position.weight,
              ),
            )
          : null,
      weightedVolatility30d: null,
      weightedMaxDrawdown: null,
      weightedVar95: null,
      analyzedPositions,
      totalPositions,
      coveragePercent,
      drivers: [],
      positions: positionResults,
    };
  }

  const score =
    weightedAverage(
      analyzed.map((position) => ({
        value: position.risk.score,
        weight: position.weight,
      })),
    );

  const confidence =
    weightedAverage(
      analyzed.map((position) => ({
        value: position.risk.confidence,
        weight: position.weight,
      })),
    );

  const weightedVolatility30d =
    weightedAverage(
      analyzed.map((position) => ({
        value:
          position.risk.metrics
            .volatility30d,
        weight: position.weight,
      })),
    );

  const weightedMaxDrawdown =
    weightedAverage(
      analyzed.map((position) => ({
        value:
          position.risk.metrics
            .maxDrawdown,
        weight: position.weight,
      })),
    );

  const weightedVar95 =
    weightedAverage(
      analyzed.map((position) => ({
        value:
          position.risk.metrics.var95,
        weight: position.weight,
      })),
    );

  const largestPositionWeight =
    positionResults.length > 0
      ? Math.max(
          ...positionResults.map(
            (position) =>
              position.weight,
          ),
        )
      : null;

  return {
    portfolioId,
    score,
    group:
      score !== null
        ? classifyRisk(score)
        : null,
    confidence,
    largestPositionWeight,
    weightedVolatility30d,
    weightedMaxDrawdown,
    weightedVar95,
    analyzedPositions,
    totalPositions,
    coveragePercent,
    drivers: uniqueDrivers(
      positionResults,
    ),
    positions: positionResults,
  };
}