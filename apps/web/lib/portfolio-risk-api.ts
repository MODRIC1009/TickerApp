
export type PortfolioRiskGroup =
  | "Very Stable"
  | "Stable"
  | "Moderate"
  | "Risky"
  | "Very Risky";

export type PortfolioRiskComponent = {
  score: number;
  weight: number;
  contribution: number;
  label: string;
  explanation: string;
};

export type PortfolioRiskMetrics = {
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

export type PortfolioRiskPosition = {
  symbol: string;
  weight: number;
  marketValue: number;
  risk: {
    symbol: string;
    score: number;
    group: PortfolioRiskGroup;
    suggestedLeverage: number;
    confidence: number;
    components: {
      systematic: PortfolioRiskComponent;
      volatility: PortfolioRiskComponent;
      drawdown: PortfolioRiskComponent;
      liquidity: PortfolioRiskComponent;
      tail: PortfolioRiskComponent;
      momentum: PortfolioRiskComponent;
    };
    metrics: PortfolioRiskMetrics;
    drivers: string[];
  } | null;
  error: string | null;
};

export type PortfolioRiskAnalysis = {
  portfolioId: string;
  score: number | null;
  group: PortfolioRiskGroup | null;
  confidence: number | null;
  largestPositionWeight: number | null;
  weightedVolatility30d: number | null;
  weightedMaxDrawdown: number | null;
  weightedVar95: number | null;
  analyzedPositions: number;
  totalPositions: number;
  coveragePercent: number;
  drivers: string[];
  positions: PortfolioRiskPosition[];
};

type PortfolioRiskResponse = {
  success?: boolean;
  result?: PortfolioRiskAnalysis;
  error?: {
    code?: string;
    message?: string;
  };
};

export async function getPortfolioRisk(
  portfolioId: string,
  options: { signal?: AbortSignal } = {},
): Promise<PortfolioRiskAnalysis> {
  const response = await fetch(
    `/api/portfolio/${encodeURIComponent(portfolioId)}/risk`,
    {
      method: "GET",
      cache: "no-store",
      signal: options.signal,
    },
  );

  let payload: PortfolioRiskResponse;

  try {
    payload = (await response.json()) as PortfolioRiskResponse;
  } catch {
    throw new Error(
      "The portfolio risk service returned an invalid response.",
    );
  }

  if (
    !response.ok ||
    payload.success !== true ||
    !payload.result
  ) {
    throw new Error(
      payload.error?.message ??
        "Unable to calculate portfolio risk.",
    );
  }

  return payload.result;
}
