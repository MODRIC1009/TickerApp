import { AnalyticsError } from "./errors";

function validatePeriod(
  period: number,
): void {
  if (
    !Number.isInteger(period) ||
    period <= 0
  ) {
    throw new AnalyticsError(
      "invalid_parameter",
      "Indicator period must be a positive integer.",
    );
  }
}

function validateSeries(
  values: number[],
): void {
  if (values.length === 0) {
    throw new AnalyticsError(
      "insufficient_data",
      "At least one observation is required.",
    );
  }

  if (
    values.some(
      (value) => !Number.isFinite(value),
    )
  ) {
    throw new AnalyticsError(
      "invalid_request",
      "Indicator inputs must contain only finite values.",
    );
  }
}

export function calculateSMA(
  values: number[],
  period: number,
): Array<number | null> {
  validatePeriod(period);
  validateSeries(values);

  return values.map((_, index) => {
    if (index + 1 < period) {
      return null;
    }

    const window = values.slice(
      index + 1 - period,
      index + 1,
    );

    return (
      window.reduce(
        (total, value) => total + value,
        0,
      ) / period
    );
  });
}

export function calculateEMA(
  values: number[],
  period: number,
): Array<number | null> {
  validatePeriod(period);
  validateSeries(values);

  const result: Array<
    number | null
  > = Array(values.length).fill(null);

  if (values.length < period) {
    return result;
  }

  const initialWindow = values.slice(
    0,
    period,
  );

  let previous =
    initialWindow.reduce(
      (total, value) => total + value,
      0,
    ) / period;

  result[period - 1] = previous;

  const multiplier =
    2 / (period + 1);

  for (
    let index = period;
    index < values.length;
    index += 1
  ) {
    const current = values[index];

    previous =
      (current - previous) *
        multiplier +
      previous;

    result[index] = previous;
  }

  return result;
}

export function calculateMomentum(
  values: number[],
  period: number,
): Array<number | null> {
  validatePeriod(period);
  validateSeries(values);

  return values.map((value, index) => {
    if (index < period) {
      return null;
    }

    return value - values[index - period];
  });
}

export function calculateROC(
  values: number[],
  period: number,
): Array<number | null> {
  validatePeriod(period);
  validateSeries(values);

  return values.map((value, index) => {
    if (index < period) {
      return null;
    }

    const previous =
      values[index - period];

    if (previous === 0) {
      return null;
    }

    return (
      (value / previous - 1) * 100
    );
  });
}

export function calculateRSI(
  values: number[],
  period = 14,
): Array<number | null> {
  validatePeriod(period);
  validateSeries(values);

  const result: Array<
    number | null
  > = Array(values.length).fill(null);

  if (values.length <= period) {
    return result;
  }

  let gains = 0;
  let losses = 0;

  for (
    let index = 1;
    index <= period;
    index += 1
  ) {
    const change =
      values[index] - values[index - 1];

    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  let averageGain =
    gains / period;
  let averageLoss =
    losses / period;

  result[period] =
    calculateRSIValue(
      averageGain,
      averageLoss,
    );

  for (
    let index = period + 1;
    index < values.length;
    index += 1
  ) {
    const change =
      values[index] - values[index - 1];

    const gain =
      change > 0 ? change : 0;

    const loss =
      change < 0 ? -change : 0;

    averageGain =
      (averageGain * (period - 1) +
        gain) /
      period;

    averageLoss =
      (averageLoss * (period - 1) +
        loss) /
      period;

    result[index] =
      calculateRSIValue(
        averageGain,
        averageLoss,
      );
  }

  return result;
}

function calculateRSIValue(
  averageGain: number,
  averageLoss: number,
): number {
  if (averageLoss === 0) {
    return 100;
  }

  if (averageGain === 0) {
    return 0;
  }

  const relativeStrength =
    averageGain / averageLoss;

  return (
    100 -
    100 /
      (1 + relativeStrength)
  );
}

export interface OHLCPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function calculateATR(
  values: OHLCPoint[],
  period = 14,
): Array<number | null> {
  validatePeriod(period);

  if (values.length === 0) {
    throw new AnalyticsError(
      "insufficient_data",
      "At least one OHLC observation is required.",
    );
  }

  for (const value of values) {
    if (
      !Number.isFinite(value.open) ||
      !Number.isFinite(value.high) ||
      !Number.isFinite(value.low) ||
      !Number.isFinite(value.close)
    ) {
      throw new AnalyticsError(
        "invalid_request",
        "OHLC inputs must contain only finite values.",
      );
    }

    if (
      value.high < value.low ||
      value.high < value.open ||
      value.high < value.close ||
      value.low > value.open ||
      value.low > value.close
    ) {
      throw new AnalyticsError(
        "invalid_request",
        "OHLC values must satisfy valid high/low relationships.",
      );
    }
  }

  const trueRanges: number[] = [];

  for (
    let index = 0;
    index < values.length;
    index += 1
  ) {
    const current = values[index];

    if (index === 0) {
      trueRanges.push(
        current.high - current.low,
      );
      continue;
    }

    const previousClose =
      values[index - 1].close;

    trueRanges.push(
      Math.max(
        current.high - current.low,
        Math.abs(
          current.high -
            previousClose,
        ),
        Math.abs(
          current.low -
            previousClose,
        ),
      ),
    );
  }

  const result: Array<
    number | null
  > = Array(values.length).fill(null);

  if (trueRanges.length < period) {
    return result;
  }

  let atr =
    trueRanges
      .slice(0, period)
      .reduce(
        (total, value) =>
          total + value,
        0,
      ) / period;

  result[period - 1] = atr;

  for (
    let index = period;
    index < trueRanges.length;
    index += 1
  ) {
    atr =
      (atr * (period - 1) +
        trueRanges[index]) /
      period;

    result[index] = atr;
  }

  return result;
}