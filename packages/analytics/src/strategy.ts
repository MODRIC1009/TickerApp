import { AnalyticsError } from "./errors";
import {
  calculateEMA,
  calculateRSI,
  calculateSMA,
} from "./indicators";

export type SignalAction =
  | "buy"
  | "sell"
  | "hold";

export type PositionState =
  | "flat"
  | "long";

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

function validateConfig(
  config: StrategyConfig,
): void {
  if (!config.id.trim()) {
    throw new AnalyticsError(
      "invalid_request",
      "Strategy id is required.",
    );
  }

  if (!config.name.trim()) {
    throw new AnalyticsError(
      "invalid_request",
      "Strategy name is required.",
    );
  }

  if (
    !Number.isInteger(config.shortPeriod) ||
    config.shortPeriod <= 0
  ) {
    throw new AnalyticsError(
      "invalid_parameter",
      "Short period must be a positive integer.",
    );
  }

  if (
    !Number.isInteger(config.longPeriod) ||
    config.longPeriod <= 0
  ) {
    throw new AnalyticsError(
      "invalid_parameter",
      "Long period must be a positive integer.",
    );
  }

  if (
    config.shortPeriod >=
    config.longPeriod
  ) {
    throw new AnalyticsError(
      "invalid_parameter",
      "Short period must be smaller than long period.",
    );
  }

  if (
    !Number.isInteger(config.rsiPeriod) ||
    config.rsiPeriod <= 0
  ) {
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

  if (
    config.rsiOversold >=
    config.rsiOverbought
  ) {
    throw new AnalyticsError(
      "invalid_parameter",
      "RSI oversold threshold must be smaller than overbought threshold.",
    );
  }
}

function validateInput(
  input: StrategyInput[],
): void {
  if (input.length === 0) {
    throw new AnalyticsError(
      "insufficient_data",
      "At least one price observation is required.",
    );
  }

  for (const point of input) {
    if (
      !point.timestamp.trim()
    ) {
      throw new AnalyticsError(
        "invalid_request",
        "Strategy timestamps are required.",
      );
    }

    if (
      !Number.isFinite(point.price) ||
      point.price <= 0
    ) {
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

  const prices = input.map(
    (point) => point.price,
  );

  const shortSma =
    calculateSMA(
      prices,
      config.shortPeriod,
    );

  const longSma =
    calculateSMA(
      prices,
      config.longPeriod,
    );

  const rsi =
    calculateRSI(
      prices,
      config.rsiPeriod,
    );

  let position: PositionState =
    "flat";

  return input.map(
    (point, index) => {
      const shortValue =
        shortSma[index];

      const longValue =
        longSma[index];

      const rsiValue =
        rsi[index];

      if (
        shortValue === null ||
        longValue === null ||
        rsiValue === null
      ) {
        return {
          timestamp: point.timestamp,
          action: "hold",
          position,
          price: point.price,
          reason:
            "Insufficient indicator history.",
        };
      }

      const bullishTrend =
        shortValue > longValue;

      const bearishTrend =
        shortValue < longValue;

      const oversold =
        rsiValue <=
        config.rsiOversold;

      const overbought =
        rsiValue >=
        config.rsiOverbought;

      if (
        position === "flat" &&
        bullishTrend &&
        oversold
      ) {
        position = "long";

        return {
          timestamp: point.timestamp,
          action: "buy",
          position,
          price: point.price,
          reason:
            "Bullish trend with oversold RSI.",
        };
      }

      if (
        position === "long" &&
        (bearishTrend || overbought)
      ) {
        position = "flat";

        return {
          timestamp: point.timestamp,
          action: "sell",
          position,
          price: point.price,
          reason: bearishTrend
            ? "Bearish trend."
            : "RSI reached overbought level.",
        };
      }

      return {
        timestamp: point.timestamp,
        action: "hold",
        position,
        price: point.price,
        reason:
          "No strategy transition.",
      };
    },
  );
}