import { AnalyticsError } from "./errors";
import {
  mean,
  standardDeviation,
} from "./statistics";
import type {
  DrawdownPoint,
} from "./types";

export function calculateVolatility(
  returns: number[],
  periodsPerYear: number,
): number {
  if (
    returns.length < 2 ||
    !Number.isFinite(periodsPerYear) ||
    periodsPerYear <= 0
  ) {
    throw new AnalyticsError(
      "insufficient_data",
      "At least two returns and a positive annualization frequency are required.",
    );
  }

  return (
    standardDeviation(returns) *
    Math.sqrt(periodsPerYear)
  );
}

export function calculateSharpeRatio(
  returns: number[],
  riskFreeRatePerPeriod = 0,
  periodsPerYear = 252,
): number {
  if (returns.length < 2) {
    throw new AnalyticsError(
      "insufficient_data",
      "At least two returns are required for Sharpe ratio.",
    );
  }

  const excessReturns = returns.map(
    (value) =>
      value - riskFreeRatePerPeriod,
  );

  const excessMean =
    mean(excessReturns);

  const deviation =
    standardDeviation(excessReturns);

  if (deviation === 0) {
    return 0;
  }

  return (
    (excessMean / deviation) *
    Math.sqrt(periodsPerYear)
  );
}

export function calculateSortinoRatio(
  returns: number[],
  targetReturnPerPeriod = 0,
  periodsPerYear = 252,
): number {
  if (returns.length < 2) {
    throw new AnalyticsError(
      "insufficient_data",
      "At least two returns are required for Sortino ratio.",
    );
  }

  const excessReturns = returns.map(
    (value) =>
      value - targetReturnPerPeriod,
  );

  const downsideSquared = excessReturns
    .filter((value) => value < 0)
    .map((value) => value * value);

  if (downsideSquared.length === 0) {
    return 0;
  }

  const downsideDeviation = Math.sqrt(
    downsideSquared.reduce(
      (total, value) =>
        total + value,
      0,
    ) / returns.length,
  );

  if (downsideDeviation === 0) {
    return 0;
  }

  return (
    (mean(excessReturns) /
      downsideDeviation) *
    Math.sqrt(periodsPerYear)
  );
}

export function calculateDrawdown(
  equity: Array<{
    timestamp: string;
    equity: number;
  }>,
): DrawdownPoint[] {
  if (equity.length === 0) {
    throw new AnalyticsError(
      "insufficient_data",
      "At least one equity observation is required.",
    );
  }

  let peak = equity[0].equity;

  return equity.map((point) => {
    if (
      !Number.isFinite(point.equity) ||
      point.equity < 0
    ) {
      throw new AnalyticsError(
        "invalid_request",
        "Equity values must be finite and non-negative.",
      );
    }

    peak = Math.max(peak, point.equity);

    const drawdown =
      point.equity - peak;

    const drawdownPercent =
      peak === 0
        ? 0
        : (drawdown / peak) * 100;

    return {
      timestamp: point.timestamp,
      equity: point.equity,
      peak,
      drawdown,
      drawdownPercent,
    };
  });
}

export function calculateMaxDrawdown(
  equity: Array<{
    timestamp: string;
    equity: number;
  }>,
): {
  amount: number;
  percent: number;
} {
  const drawdowns =
    calculateDrawdown(equity);

  let maximumAmount = 0;
  let maximumPercent = 0;

  for (const point of drawdowns) {
    maximumAmount = Math.min(
      maximumAmount,
      point.drawdown,
    );

    maximumPercent = Math.min(
      maximumPercent,
      point.drawdownPercent,
    );
  }

  return {
    amount: maximumAmount,
    percent: maximumPercent,
  };
}