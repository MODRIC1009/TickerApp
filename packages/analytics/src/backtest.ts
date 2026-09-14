import { AnalyticsError } from "./errors";
import { calculatePerformanceMetrics } from "./performance";
import { calculateDrawdown } from "./risk";
import {
  generateStrategySignals,
  type StrategyConfig,
  type StrategyInput,
} from "./strategy";
import type {
  BacktestResult,
  EquityPoint,
  Trade,
} from "./types";

export interface BacktestConfig {
  symbol: string;
  strategy: StrategyConfig;
  initialCapital: number;
  positionSizePercent?: number;
  transactionFeePercent?: number;
  slippagePercent?: number;
}

function validateConfig(
  config: BacktestConfig,
): void {
  if (!config.symbol.trim()) {
    throw new AnalyticsError(
      "invalid_request",
      "Backtest symbol is required.",
    );
  }

  if (
    !Number.isFinite(
      config.initialCapital,
    ) ||
    config.initialCapital <= 0
  ) {
    throw new AnalyticsError(
      "invalid_parameter",
      "Initial capital must be finite and greater than zero.",
    );
  }

  const positionSizePercent =
    config.positionSizePercent ?? 100;

  if (
    !Number.isFinite(
      positionSizePercent,
    ) ||
    positionSizePercent <= 0 ||
    positionSizePercent > 100
  ) {
    throw new AnalyticsError(
      "invalid_parameter",
      "Position size percent must be greater than zero and at most 100.",
    );
  }

  const transactionFeePercent =
    config.transactionFeePercent ?? 0;

  if (
    !Number.isFinite(
      transactionFeePercent,
    ) ||
    transactionFeePercent < 0
  ) {
    throw new AnalyticsError(
      "invalid_parameter",
      "Transaction fee percent must be finite and non-negative.",
    );
  }

  const slippagePercent =
    config.slippagePercent ?? 0;

  if (
    !Number.isFinite(
      slippagePercent,
    ) ||
    slippagePercent < 0
  ) {
    throw new AnalyticsError(
      "invalid_parameter",
      "Slippage percent must be finite and non-negative.",
    );
  }
}

function validateInput(
  input: StrategyInput[],
): void {
  if (input.length < 2) {
    throw new AnalyticsError(
      "insufficient_data",
      "At least two observations are required for a backtest.",
    );
  }

  for (const point of input) {
    if (!point.timestamp.trim()) {
      throw new AnalyticsError(
        "invalid_request",
        "Backtest timestamps are required.",
      );
    }

    if (
      !Number.isFinite(point.price) ||
      point.price <= 0
    ) {
      throw new AnalyticsError(
        "invalid_price",
        "Backtest prices must be finite and greater than zero.",
      );
    }
  }
}

export function runBacktest(
  input: StrategyInput[],
  config: BacktestConfig,
): BacktestResult {
  validateConfig(config);
  validateInput(input);

  const signals =
    generateStrategySignals(
      input,
      config.strategy,
    );

  const positionSizePercent =
    config.positionSizePercent ?? 100;

  const transactionFeePercent =
    config.transactionFeePercent ?? 0;

  const slippagePercent =
    config.slippagePercent ?? 0;

  const feeRate =
    transactionFeePercent / 100;

  const slippageRate =
    slippagePercent / 100;

  let cash = config.initialCapital;
  let quantity = 0;
  let averageEntryPrice = 0;

  const trades: Trade[] = [];
  const equityCurve: EquityPoint[] = [];

  for (
    let index = 0;
    index < input.length;
    index += 1
  ) {
    const point = input[index];
    const signal = signals[index];

    if (signal.action === "buy") {
      const allocatedCapital =
        cash *
        (positionSizePercent / 100);

      const executionPrice =
        point.price *
        (1 + slippageRate);

      if (
        allocatedCapital > 0 &&
        executionPrice > 0
      ) {
        /*
         * The allocation includes transaction fees.
         * This prevents a 100% position-size order
         * from exceeding available cash.
         */
        const allocation =
          allocatedCapital /
          (1 + feeRate);

        const fee =
          allocation * feeRate;

        const totalCost =
          allocation + fee;

        const purchasedQuantity =
          allocation /
          executionPrice;

        if (
          totalCost <= cash &&
          purchasedQuantity > 0
        ) {
          const previousCost =
            quantity *
            averageEntryPrice;

          quantity +=
            purchasedQuantity;

          averageEntryPrice =
            quantity === 0
              ? 0
              : (previousCost +
                  allocation) /
                quantity;

          cash -= totalCost;

          trades.push({
            symbol:
              config.symbol,
            side: "buy",
            quantity:
              purchasedQuantity,
            price: executionPrice,
            fees: fee,
            slippage:
              executionPrice -
              point.price,
            timestamp:
              point.timestamp,
          });
        }
      }
    }

    if (
      signal.action === "sell" &&
      quantity > 0
    ) {
      const executionPrice =
        point.price *
        (1 - slippageRate);

      const grossProceeds =
        quantity *
        executionPrice;

      const fee =
        grossProceeds * feeRate;

      const netProceeds =
        grossProceeds - fee;

      const realizedPnl =
        netProceeds -
        quantity *
          averageEntryPrice;

      cash += netProceeds;

      trades.push({
        symbol:
          config.symbol,
        side: "sell",
        quantity,
        price: executionPrice,
        fees: fee,
        slippage:
          point.price -
          executionPrice,
        timestamp:
          point.timestamp,
        realizedPnl,
      });

      quantity = 0;
      averageEntryPrice = 0;
    }

    const positionValue =
      quantity * point.price;

    const equity =
      cash + positionValue;

    const previousEquity =
      equityCurve.length === 0
        ? null
        : equityCurve[
            equityCurve.length - 1
          ].equity;

    equityCurve.push({
      timestamp: point.timestamp,
      equity,
      cash,
      positionValue,
      return:
        previousEquity === null
          ? 0
          : equity /
              previousEquity -
            1,
      cumulativeReturn:
        equity /
          config.initialCapital -
        1,
      drawdown: 0,
      drawdownPercent: 0,
    });
  }

  const drawdown =
    calculateDrawdown(
      equityCurve.map(
        (point) => ({
          timestamp:
            point.timestamp,
          equity: point.equity,
        }),
      ),
    );

  for (
    let index = 0;
    index < equityCurve.length;
    index += 1
  ) {
    equityCurve[index].drawdown =
      drawdown[index].drawdown;

    equityCurve[index].drawdownPercent =
      drawdown[index].drawdownPercent;
  }

  /*
   * Performance metrics are calculated from
   * the strategy equity curve rather than the
   * underlying asset price series.
   */
  const strategyEquity =
    equityCurve.map((point) => ({
      timestamp: point.timestamp,
      price: point.equity,
    }));

  const performance =
    calculatePerformanceMetrics(
      strategyEquity,
    );

  const finalEquity =
    equityCurve[
      equityCurve.length - 1
    ].equity;

  const winningTrades =
    trades.filter(
      (trade) =>
        trade.side === "sell" &&
        (trade.realizedPnl ?? 0) > 0,
    );

  const losingTrades =
    trades.filter(
      (trade) =>
        trade.side === "sell" &&
        (trade.realizedPnl ?? 0) < 0,
    );

  const grossProfit =
    winningTrades.reduce(
      (total, trade) =>
        total +
        (trade.realizedPnl ?? 0),
      0,
    );

  const grossLoss =
    losingTrades.reduce(
      (total, trade) =>
        total +
        Math.abs(
          trade.realizedPnl ?? 0,
        ),
      0,
    );

  const completedTrades =
    trades.filter(
      (trade) =>
        trade.side === "sell",
    );

  const winRate =
    completedTrades.length === 0
      ? 0
      : winningTrades.length /
        completedTrades.length;

  const profitFactor =
    grossLoss === 0
      ? grossProfit > 0
        ? Number.POSITIVE_INFINITY
        : 0
      : grossProfit / grossLoss;

  return {
    strategyId:
      config.strategy.id,
    symbol:
      config.symbol,
    startDate:
      input[0].timestamp,
    endDate:
      input[input.length - 1]
        .timestamp,
    summary: {
      initialCapital:
        config.initialCapital,
      finalCapital: finalEquity,
      netProfit:
        finalEquity -
        config.initialCapital,
      totalReturn:
        finalEquity /
          config.initialCapital -
        1,
      annualizedReturn:
        performance.annualizedReturn,
      maxDrawdown:
        Math.min(
          ...drawdown.map(
            (point) =>
              point.drawdown,
          ),
        ),
      maxDrawdownPercent:
        Math.min(
          ...drawdown.map(
            (point) =>
              point.drawdownPercent,
          ),
        ),
      volatility:
        performance.volatility,
      sharpeRatio:
        performance.sharpeRatio,
      sortinoRatio:
        performance.sortinoRatio,
      winRate,
      profitFactor,
      tradeCount:
        completedTrades.length,
    },
    equityCurve,
    trades,
  };
}