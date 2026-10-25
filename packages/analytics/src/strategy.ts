
import { AnalyticsError } from "./errors";
import {
  calculateRSI,
  calculateSMA,
} from "./indicators";

export type SignalAction = "buy" | "sell" | "hold";
export type PositionState = "flat" | "long";

export interface StrategySignal {
  timestamp: string;
  action: SignalAction;
  position: PositionState;
  price: number;
  reason: string;
}

export interface StrategyConfig {
  id: string;
  name: string;
  shortPeriod: number;
  longPeriod: number;
  rsiPeriod: number;
  rsiOversold: number;
  rsiOverbought: number;
}

export interface StrategyInput {
  timestamp: string;
  price: number;
}

function validateConfig(config: StrategyConfig): void {
  if (!config.id.trim()) {
    throw new AnalyticsError("invalid_request", "Strategy id is required.");
  }

  if (!config.name.trim()) {
    throw new AnalyticsError("invalid_request", "Strategy name is required.");
  }

  if (!Number.isInteger(config.shortPeriod) || config.shortPeriod <= 0) {
    throw new AnalyticsError(
      "invalid_parameter",
      "Short period must be a positive integer.",
    );
  }

  if (!Number.isInteger(config.longPeriod) || config.longPeriod <= 0) {
    throw new AnalyticsError(
      "invalid_parameter",
      "Long period must be a positive integer.",
    );
  }

  if (config.shortPeriod >= config.longPeriod) {
    throw new AnalyticsError(
      "invalid_parameter",
      "Short period must be smaller than long period.",
    );
  }

  if (!Number.isInteger(config.rsiPeriod) || config.rsiPeriod <= 0) {
    throw new AnalyticsError(
      "invalid_parameter",
      "RSI period must be a positive integer.",
    );
  }

  if (
    !Number.isFinite(config.rsiOversold) ||
    config.rsiOversold < 0 ||
    config.rsiOversold > 100
  ) {
    throw new AnalyticsError(
      "invalid_parameter",
      "RSI oversold threshold must be between 0 and 100.",
    );
  }

  if (
    !Number.isFinite(config.rsiOverbought) ||
    config.rsiOverbought < 0 ||
    config.rsiOverbought > 100
  ) {
    throw new AnalyticsError(
      "invalid_parameter",
      "RSI overbought threshold must be between 0 and 100.",
    );
  }

  if (config.rsiOversold >= config.rsiOverbought) {
    throw new AnalyticsError(
      "invalid_parameter",
      "RSI oversold threshold must be smaller than overbought threshold.",
    );
  }
}

function validateInput(input: StrategyInput[]): void {
  if (input.length === 0) {
    throw new AnalyticsError(
      "insufficient_data",
      "At least one price observation is required.",
    );
  }

  for (const point of input) {
    if (
      typeof point.timestamp !== "string" ||
      !point.timestamp.trim()
    ) {
      throw new AnalyticsError(
        "invalid_request",
        "Strategy timestamps are required.",
      );
    }

    if (!Number.isFinite(point.price) || point.price <= 0) {
      throw new AnalyticsError(
        "invalid_price",
        "Strategy prices must be finite and greater than zero.",
      );
    }
  }
}

export function generateStrategySignals(
  input: StrategyInput[],
  config: StrategyConfig,
): StrategySignal[] {
  validateConfig(config);
  validateInput(input);

  const prices = input.map((point) => point.price);
  const shortSma = calculateSMA(prices, config.shortPeriod);
  const longSma = calculateSMA(prices, config.longPeriod);
  const rsi = calculateRSI(prices, config.rsiPeriod);

  const strategyId = config.id.trim().toLowerCase();

  const isBuyAndHold = [
    "buy-and-hold",
    "buy_and_hold",
    "buyandhold",
  ].includes(strategyId);

  const isSmaCrossover = [
    "sma-crossover",
    "sma_crossover",
    "sma",
  ].includes(strategyId);

  const isMomentum = strategyId === "momentum";

  const isSmaRsi = [
    "sma-rsi",
    "sma_rsi",
    "test-strategy",
  ].includes(strategyId);

  if (
    !isBuyAndHold &&
    !isSmaCrossover &&
    !isMomentum &&
    !isSmaRsi
  ) {
    throw new AnalyticsError(
      "invalid_request",
      `Unsupported strategy id: ${config.id}`,
    );
  }

  let position: PositionState = "flat";
  let previousShortSma: number | null = null;
  let previousLongSma: number | null = null;

  return input.map((point, index) => {
    let action: SignalAction = "hold";
    let reason = "No strategy transition.";

    if (isBuyAndHold) {
      if (index === 0) {
        position = "long";
        action = "buy";
        reason = "Buy and hold: enter at the first available observation.";
      } else {
        reason = "Buy and hold: maintain the long position.";
      }
    } else if (isSmaCrossover) {
      const shortValue = shortSma[index];
      const longValue = longSma[index];

      if (shortValue === null || longValue === null) {
        reason = "Insufficient moving-average history.";
      } else if (
        previousShortSma !== null &&
        previousLongSma !== null
      ) {
        const crossedAbove =
          previousShortSma <= previousLongSma &&
          shortValue > longValue;

        const crossedBelow =
          previousShortSma >= previousLongSma &&
          shortValue < longValue;

        if (position === "flat" && crossedAbove) {
          position = "long";
          action = "buy";
          reason = "Short SMA crossed above long SMA.";
        } else if (position === "long" && crossedBelow) {
          position = "flat";
          action = "sell";
          reason = "Short SMA crossed below long SMA.";
        }
      }

      if (shortValue !== null && longValue !== null) {
        previousShortSma = shortValue;
        previousLongSma = longValue;
      }
    } else if (isMomentum) {
      const lookbackIndex = index - config.shortPeriod;

      if (lookbackIndex < 0) {
        reason = "Insufficient momentum lookback history.";
      } else {
        const referencePrice = prices[lookbackIndex];

        if (position === "flat" && point.price > referencePrice) {
          position = "long";
          action = "buy";
          reason = `Positive momentum over ${config.shortPeriod} observations.`;
        } else if (position === "long" && point.price < referencePrice) {
          position = "flat";
          action = "sell";
          reason = `Negative momentum over ${config.shortPeriod} observations.`;
        }
      }
    } else if (isSmaRsi) {
      const shortValue = shortSma[index];
      const longValue = longSma[index];
      const rsiValue = rsi[index];

      if (
        shortValue === null ||
        longValue === null ||
        rsiValue === null
      ) {
        reason = "Insufficient SMA/RSI history.";
      } else {
        const bullishTrend = shortValue > longValue;
        const bearishTrend = shortValue < longValue;
        const oversoldSetup = rsiValue <= config.rsiOversold;
        const overboughtSetup = rsiValue >= config.rsiOverbought;

        if (
          position === "flat" &&
          bullishTrend &&
          oversoldSetup
        ) {
          position = "long";
          action = "buy";
          reason =
            "Bullish trend confirmed by short SMA above long SMA with RSI at or below the oversold threshold.";
        } else if (
          position === "long" &&
          (bearishTrend || overboughtSetup)
        ) {
          position = "flat";
          action = "sell";
          reason = bearishTrend
            ? "Bearish trend confirmed by short SMA below long SMA."
            : "RSI reached the overbought threshold.";
        } else {
          reason = "Waiting for SMA trend and RSI confirmation.";
        }
      }
    }

    return {
      timestamp: point.timestamp,
      action,
      position,
      price: point.price,
      reason,
    };
  });
}
