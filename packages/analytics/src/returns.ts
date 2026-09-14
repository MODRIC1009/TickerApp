import { AnalyticsError } from "./errors";
import type {
  PricePoint,
  ReturnPoint,
} from "./types";

export function calculateSimpleReturns(
  prices: PricePoint[],
): ReturnPoint[] {
  if (prices.length < 2) {
    throw new AnalyticsError(
      "insufficient_data",
      "At least two price observations are required.",
    );
  }

  const results: ReturnPoint[] = [];

  for (let index = 1; index < prices.length; index += 1) {
    const previous = prices[index - 1];
    const current = prices[index];

    if (
      !Number.isFinite(previous.price) ||
      !Number.isFinite(current.price) ||
      previous.price <= 0 ||
      current.price <= 0
    ) {
      throw new AnalyticsError(
        "invalid_price",
        "Prices must be finite and greater than zero.",
      );
    }

    results.push({
      timestamp: current.timestamp,
      value: current.price / previous.price - 1,
    });
  }

  return results;
}

export function calculateCumulativeReturn(
  returns: number[],
): number {
  let growth = 1;

  for (const value of returns) {
    if (!Number.isFinite(value)) {
      throw new AnalyticsError(
        "invalid_request",
        "Returns must contain only finite values.",
      );
    }

    growth *= 1 + value;
  }

  return growth - 1;
}

export function calculateAnnualizedReturn(
  totalReturn: number,
  periods: number,
  periodsPerYear: number,
): number {
  if (
    !Number.isFinite(totalReturn) ||
    !Number.isFinite(periods) ||
    !Number.isFinite(periodsPerYear) ||
    periods <= 0 ||
    periodsPerYear <= 0
  ) {
    throw new AnalyticsError(
      "invalid_parameter",
      "Return annualization parameters must be finite and positive.",
    );
  }

  if (totalReturn <= -1) {
    return -1;
  }

  return (
    Math.pow(
      1 + totalReturn,
      periodsPerYear / periods,
    ) - 1
  );
}