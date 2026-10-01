import {
  AnalyticsError,
  runBacktest,
  type BacktestConfig,
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
  if (!Array.isArray(value)) {
    return false;
  }

  return value.every((point) => {
    if (!isRecord(point)) {
      return false;
    }

    return (
      typeof point.timestamp ===
        "string" &&
      typeof point.price === "number"
    );
  });
}

function isBacktestConfig(
  value: unknown,
): value is BacktestConfig {
  if (!isRecord(value)) {
    return false;
  }

  return isRecord(value.strategy);
}

function validateRequestBody(
  value: unknown,
): BacktestRequestBody {
  if (!isRecord(value)) {
    throw new AnalyticsError(
      "invalid_request",
      "Request body must be an object.",
    );
  }

  if (
    !isStrategyInputArray(
      value.input,
    )
  ) {
    throw new AnalyticsError(
      "invalid_request",
      "Input must be an array of timestamped price observations.",
    );
  }

  if (
    !isBacktestConfig(
      value.config,
    )
  ) {
    throw new AnalyticsError(
      "invalid_request",
      "Config must contain a valid strategy configuration.",
    );
  }

  return {
    input: value.input,
    config:
      value.config,
  };
}

export async function POST(
  request: Request,
): Promise<Response> {
  try {
    const body: unknown =
      await request.json();

    const validated =
      validateRequestBody(body);

    const result =
      runBacktest(
        validated.input,
        validated.config,
      );

    return NextResponse.json(
      {
        success: true,
        result,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    if (
      error instanceof AnalyticsError
    ) {
      const status =
        error.code ===
        "invalid_request"
          ? 400
          : error.code ===
              "invalid_parameter"
            ? 400
            : error.code ===
                "invalid_price"
              ? 400
              : error.code ===
                  "insufficient_data"
                ? 422
                : 500;

      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message:
              error.message,
          },
        },
        {
          status,
        },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: "backtest_error",
          message:
            "Unable to execute backtest.",
        },
      },
      {
        status: 500,
      },
    );
  }
}