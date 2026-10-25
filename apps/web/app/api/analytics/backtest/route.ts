
import {
  AnalyticsError,
  runBacktest,
  type BacktestConfig,
  type StrategyConfig,
  type StrategyInput,
} from "@tickerapp/analytics";
import { NextResponse } from "next/server";

interface BacktestRequestBody {
  input: StrategyInput[];
  config: BacktestConfig;
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isStrategyInputArray(
  value: unknown,
): value is StrategyInput[] {
  return (
    Array.isArray(value) &&
    value.every(
      (point) =>
        isRecord(point) &&
        typeof point.timestamp === "string" &&
        typeof point.price === "number",
    )
  );
}

function isStrategyConfig(
  value: unknown,
): value is StrategyConfig {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.shortPeriod === "number" &&
    typeof value.longPeriod === "number" &&
    typeof value.rsiPeriod === "number" &&
    typeof value.rsiOversold === "number" &&
    typeof value.rsiOverbought === "number"
  );
}

function isBacktestConfig(
  value: unknown,
): value is BacktestConfig {
  return (
    isRecord(value) &&
    typeof value.symbol === "string" &&
    typeof value.initialCapital === "number" &&
    isStrategyConfig(value.strategy)
  );
}

function mapLegacyStrategy(strategy: unknown): StrategyConfig {
  const common = {
    shortPeriod: 10,
    longPeriod: 30,
    rsiPeriod: 14,
    rsiOversold: 30,
    rsiOverbought: 70,
  };

  switch (strategy) {
    case "buy-and-hold":
      return {
        id: "buy-and-hold",
        name: "Buy and Hold",
        ...common,
      };

    case "sma-crossover":
      return {
        id: "sma-crossover",
        name: "SMA Crossover",
        ...common,
      };

    case "momentum":
      return {
        id: "momentum",
        name: "Momentum",
        ...common,
      };

    case "sma-rsi":
      return {
        id: "sma-rsi",
        name: "SMA RSI",
        ...common,
      };

    default:
      throw new AnalyticsError(
        "invalid_request",
        "Select a supported backtest strategy.",
      );
  }
}

function validateRequestBody(value: unknown): BacktestRequestBody {
  if (!isRecord(value)) {
    throw new AnalyticsError(
      "invalid_request",
      "Request body must be an object.",
    );
  }

  if (
    isStrategyInputArray(value.input) &&
    isBacktestConfig(value.config)
  ) {
    return {
      input: value.input,
      config: value.config,
    };
  }

  if (
    typeof value.symbol === "string" &&
    typeof value.initialCapital === "number" &&
    isStrategyInputArray(value.prices)
  ) {
    return {
      input: value.prices,
      config: {
        symbol: value.symbol,
        strategy: mapLegacyStrategy(value.strategy),
        initialCapital: value.initialCapital,
      },
    };
  }

  throw new AnalyticsError(
    "invalid_request",
    "Expected timestamped price observations and a valid backtest configuration.",
  );
}

function getAnalyticsStatus(error: AnalyticsError): number {
  switch (error.code) {
    case "invalid_request":
    case "invalid_parameter":
    case "invalid_price":
      return 400;

    case "insufficient_data":
      return 422;

    default:
      return 500;
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      const message = "Request body must be valid JSON.";

      return NextResponse.json(
        {
          success: false,
          error: {
            code: "invalid_request",
            message,
          },
          message,
          code: "invalid_request",
        },
        { status: 400 },
      );
    }

    const validated = validateRequestBody(body);
    const result = runBacktest(validated.input, validated.config);

    return NextResponse.json({
      success: true,
      result: {
        ...result,
        initialCapital: result.summary.initialCapital,
        finalCapital: result.summary.finalCapital,
        totalReturn: result.summary.totalReturn,
        maxDrawdown: result.summary.maxDrawdown,
        tradeCount: result.summary.tradeCount,
      },
    });
  } catch (error) {
    if (error instanceof AnalyticsError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
          },
          message: error.message,
          code: error.code,
        },
        { status: getAnalyticsStatus(error) },
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Unable to execute backtest.";

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "backtest_error",
          message,
        },
        message,
        code: "backtest_error",
      },
      { status: 500 },
    );
  }
}
