import type {
  BacktestConfig,
  BacktestResult,
  StrategyInput,
} from "@tickerapp/analytics";

export interface BacktestApiResponse {
  success: true;
  result: BacktestResult;
}

export interface BacktestApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export async function runBacktest(
  input: StrategyInput[],
  config: BacktestConfig,
): Promise<BacktestResult> {
  const response =
    await fetch(
      "/api/analytics/backtest",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          input,
          config,
        }),
      },
    );

  let body:
    | BacktestApiResponse
    | BacktestApiError;

  try {
    body = await response.json();
  } catch {
    throw new Error(
      "The backtest service returned an invalid response.",
    );
  }

  if (
    !response.ok ||
    !body.success
  ) {
    throw new Error(
      body.success
        ? "Unable to execute backtest."
        : body.error.message,
    );
  }

  return body.result;
}