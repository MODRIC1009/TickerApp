export type RiskApiError = {
  code: string;
  message: string;
};

export type RiskComponent = {
  score: number;
  weight: number;
  contribution: number;
  label: string;
  explanation: string;
};

export type RiskResult = {
  symbol: string;
  score: number;
  group:
    | "Very Stable"
    | "Stable"
    | "Moderate"
    | "Risky"
    | "Very Risky";
  suggestedLeverage: number;
  confidence: number;

  components: {
    systematic: RiskComponent;
    volatility: RiskComponent;
    drawdown: RiskComponent;
    liquidity: RiskComponent;
    tail: RiskComponent;
    momentum: RiskComponent;
  };

  metrics: {
    beta: number | null;
    correlation: number | null;

    volatility30d: number | null;
    volatility60d: number | null;
    volatility90d: number | null;

    downsideDeviation: number | null;

    maxDrawdown: number | null;
    currentDrawdown: number | null;

    var95: number | null;
    cvar95: number | null;

    momentum30d: number | null;
  };

  drivers: string[];
};

export type RiskProvenance = {
  providerId: string;
  providerName: string;
  quoteTimestamp: string | null;
  historyStartDate: string;
  historyEndDate: string;
  historyBars: number;
  benchmarkSymbol: string | null;
  benchmarkBars: number;
};

export type RiskInput = {
  symbol: string;
};

type RiskResponse = {
  success?: boolean;
  result?: RiskResult;
  provenance?: RiskProvenance;
  error?: RiskApiError;
};

function errorMessage(
  value: unknown,
): string {
  if (
    typeof value === "object" &&
    value !== null &&
    "error" in value
  ) {
    const error = value.error;

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return error.message;
    }
  }

  return "Unable to calculate quantitative risk.";
}

export async function calculateRisk(
  input: RiskInput,
): Promise<RiskResult> {
  const response = await fetch(
    "/api/analytics/risk",
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/json",
      },
      body: JSON.stringify({
        symbol: input.symbol,
      }),
      cache: "no-store",
    },
  );

  let payload: RiskResponse = {};

  try {
    payload =
      (await response.json()) as RiskResponse;
  } catch {
    throw new Error(
      "The risk service returned an invalid response.",
    );
  }

  if (
    !response.ok ||
    payload.success !== true ||
    !payload.result
  ) {
    throw new Error(
      errorMessage(payload),
    );
  }

  return payload.result;
}