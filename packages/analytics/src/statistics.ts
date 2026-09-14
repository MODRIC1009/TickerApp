import { AnalyticsError } from "./errors";

export function mean(values: number[]): number {
  if (values.length === 0) {
    throw new AnalyticsError(
      "insufficient_data",
      "At least one value is required.",
    );
  }

  return (
    values.reduce(
      (total, value) => {
        if (!Number.isFinite(value)) {
          throw new AnalyticsError(
            "invalid_request",
            "Statistical inputs must be finite.",
          );
        }

        return total + value;
      },
      0,
    ) / values.length
  );
}

export function variance(
  values: number[],
  sample = true,
): number {
  if (values.length < (sample ? 2 : 1)) {
    throw new AnalyticsError(
      "insufficient_data",
      sample
        ? "At least two observations are required for sample variance."
        : "At least one observation is required for population variance.",
    );
  }

  const average = mean(values);

  const squaredDeviation = values.reduce(
    (total, value) =>
      total + Math.pow(value - average, 2),
    0,
  );

  const denominator =
    sample
      ? values.length - 1
      : values.length;

  return squaredDeviation / denominator;
}

export function standardDeviation(
  values: number[],
  sample = true,
): number {
  return Math.sqrt(
    variance(values, sample),
  );
}

export function covariance(
  x: number[],
  y: number[],
): number {
  if (
    x.length !== y.length ||
    x.length < 2
  ) {
    throw new AnalyticsError(
      "insufficient_data",
      "Covariance requires equally sized arrays with at least two observations.",
    );
  }

  const xMean = mean(x);
  const yMean = mean(y);

  return (
    x.reduce(
      (total, value, index) =>
        total +
        (value - xMean) *
          (y[index] - yMean),
      0,
    ) /
    (x.length - 1)
  );
}

export function correlation(
  x: number[],
  y: number[],
): number {
  const covarianceValue =
    covariance(x, y);

  const xStd = standardDeviation(x);
  const yStd = standardDeviation(y);

  if (xStd === 0 || yStd === 0) {
    return 0;
  }

  return (
    covarianceValue /
    (xStd * yStd)
  );
}