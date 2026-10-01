import { AnalyticsError } from "./errors";
import {
  calculateAnnualizedReturn,
  calculateCumulativeReturn,
  calculateSimpleReturns,
} from "./returns";
import {
  calculateMaxDrawdown,
  calculateSharpeRatio,
  calculateSortinoRatio,
  calculateVolatility,
} from "./risk";
import { mean } from "./statistics";
import type {
  PerformanceMetrics,
  PricePoint,
} from "./types";

export interface PerformanceOptions {
  periodsPerYear?: number;
  riskFreeRatePerPeriod?: number;
  targetReturnPerPeriod?: number;
}

export function calculatePerformanceMetrics(
  prices: PricePoint[],
  options: PerformanceOptions = {},
): PerformanceMetrics {
  if (prices.length < 2) {
    throw new AnalyticsError(
      "insufficient_data",
      "At least two price observations are required for performance metrics.",
    );
  }

  const periodsPerYear =
    options.periodsPerYear ?? 252;

  const riskFreeRatePerPeriod =
    options.riskFreeRatePerPeriod ?? 0;

  const targetReturnPerPeriod =
    options.targetReturnPerPeriod ?? 0;

  if (
    !Number.isFinite(periodsPerYear) ||
    periodsPerYear <= 0
  ) {
    throw new AnalyticsError(
      "invalid_parameter",
      "Periods per year must be finite and positive.",
    );
  }

  if (
    !Number.isFinite(riskFreeRatePerPeriod) ||
    !Number.isFinite(targetReturnPerPeriod)
  ) {
    throw new AnalyticsError(
      "invalid_parameter",
      "Risk-free and target returns must be finite.",
    );
  }

  const returns = calculateSimpleReturns(prices);
  const returnValues = returns.map(
    (point) => point.value,
  );

  const totalReturn =
    calculateCumulativeReturn(returnValues);

  const annualizedReturn =
    calculateAnnualizedReturn(
      totalReturn,
      returnValues.length,
      periodsPerYear,
    );

  const volatility =
    calculateVolatility(
      returnValues,
      periodsPerYear,
    );

  const sharpeRatio =
    calculateSharpeRatio(
      returnValues,
      riskFreeRatePerPeriod,
      periodsPerYear,
    );

  const sortinoRatio =
    calculateSortinoRatio(
      returnValues,
      targetReturnPerPeriod,
      periodsPerYear,
    );

  const equity = prices.map(
    (point) => ({
      timestamp: point.timestamp,
      equity: point.price,
    }),
  );

  const drawdown =
    calculateMaxDrawdown(equity);

  const positiveReturns =
    returnValues.filter(
      (value) => value > 0,
    );

  const negativeReturns =
    returnValues.filter(
      (value) => value < 0,
    );

  const winRate =
    returnValues.length === 0
      ? 0
      : positiveReturns.length /
        returnValues.length;

  const grossProfit =
    positiveReturns.reduce(
      (total, value) =>
        total + value,
      0,
    );

  const grossLoss =
    negativeReturns.reduce(
      (total, value) =>
        total + Math.abs(value),
      0,
    );

  const profitFactor =
    grossLoss === 0
      ? grossProfit > 0
        ? Number.POSITIVE_INFINITY
        : 0
      : grossProfit / grossLoss;

  return {
    totalReturn,
    annualizedReturn,
    volatility,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown: drawdown.amount,
    maxDrawdownPercent:
      drawdown.percent,
    winRate,
    profitFactor,
    bestPeriod: Math.max(...returnValues),
    worstPeriod: Math.min(...returnValues),
    observationCount: prices.length,
  };
}

export function calculateBenchmarkMetrics(
  strategyReturns: number[],
  benchmarkReturns: number[],
  periodsPerYear = 252,
): {
  alpha: number;
  beta: number;
  correlation: number;
  trackingError: number;
  informationRatio: number;
} {
  if (
    strategyReturns.length !==
      benchmarkReturns.length ||
    strategyReturns.length < 2
  ) {
    throw new AnalyticsError(
      "insufficient_data",
      "Strategy and benchmark returns must have equal length with at least two observations.",
    );
  }

  if (
    !Number.isFinite(periodsPerYear) ||
    periodsPerYear <= 0
  ) {
    throw new AnalyticsError(
      "invalid_parameter",
      "Periods per year must be finite and positive.",
    );
  }

  for (const value of [
    ...strategyReturns,
    ...benchmarkReturns,
  ]) {
    if (!Number.isFinite(value)) {
      throw new AnalyticsError(
        "invalid_request",
        "Benchmark inputs must contain only finite values.",
      );
    }
  }

  const strategyMean =
    mean(strategyReturns);

  const benchmarkMean =
    mean(benchmarkReturns);

  const benchmarkVariance =
    benchmarkReturns.reduce(
      (total, value) =>
        total +
        Math.pow(
          value - benchmarkMean,
          2,
        ),
      0,
    ) /
    (benchmarkReturns.length - 1);

  const covariance =
    strategyReturns.reduce(
      (total, value, index) =>
        total +
        (value - strategyMean) *
          (benchmarkReturns[index] -
            benchmarkMean),
      0,
    ) /
    (strategyReturns.length - 1);

  const beta =
    benchmarkVariance === 0
      ? 0
      : covariance /
        benchmarkVariance;

  const alpha =
    (strategyMean -
      beta * benchmarkMean) *
    periodsPerYear;

  const trackingDifferences =
    strategyReturns.map(
      (value, index) =>
        value - benchmarkReturns[index],
    );

  const trackingError =
    calculateVolatility(
      trackingDifferences,
      periodsPerYear,
    );

  const trackingMean =
    mean(trackingDifferences);

  const informationRatio =
    trackingError === 0
      ? 0
      : (trackingMean /
          trackingError) *
        Math.sqrt(periodsPerYear);

  const strategyStd =
    Math.sqrt(
      strategyReturns.reduce(
        (total, value) =>
          total +
          Math.pow(
            value - strategyMean,
            2,
          ),
        0,
      ) /
        (strategyReturns.length - 1),
    );

  const benchmarkStd =
    Math.sqrt(
      benchmarkReturns.reduce(
        (total, value) =>
          total +
          Math.pow(
            value - benchmarkMean,
            2,
          ),
        0,
      ) /
        (benchmarkReturns.length - 1),
    );

  const correlation =
    strategyStd === 0 ||
    benchmarkStd === 0
      ? 0
      : covariance /
        (strategyStd *
          benchmarkStd);

  return {
    alpha,
    beta,
    correlation,
    trackingError,
    informationRatio,
  };
}