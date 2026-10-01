export type RiskGroup =
  | "Very Stable"
  | "Stable"
  | "Moderate"
  | "Risky"
  | "Very Risky";

export type RiskComponent = {
  score: number;
  weight: number;
  contribution: number;
  label: string;
  explanation: string;
};

export type RiskEngineInput = {
  symbol: string;

  marketCap?: number | null;
  volume?: number | null;
  volumeUsd?: number | null;

  beta?: number | null;

  returns?: number[] | null;
  benchmarkReturns?: number[] | null;

  currentPrice?: number | null;
  previousPeakPrice?: number | null;

  historyDays?: number | null;
};

export type RiskEngineResult = {
  symbol: string;
  score: number;
  group: RiskGroup;
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

const COMPONENT_WEIGHTS = {
  systematic: 0.2,
  volatility: 0.22,
  drawdown: 0.2,
  liquidity: 0.13,
  tail: 0.15,
  momentum: 0.1,
} as const;

const RISK_GROUPS: RiskGroup[] = [
  "Very Stable",
  "Stable",
  "Moderate",
  "Risky",
  "Very Risky",
];

function finite(
  value: number | null | undefined,
): number | null {
  return typeof value === "number" &&
    Number.isFinite(value)
    ? value
    : null;
}

function clamp(
  value: number,
  min = 0,
  max = 100,
): number {
  return Math.min(max, Math.max(min, value));
}

function sorted(
  values: number[],
): number[] {
  return [...values]
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
}

function mean(
  values: number[],
): number | null {
  if (values.length === 0) {
    return null;
  }

  return (
    values.reduce(
      (sum, value) => sum + value,
      0,
    ) / values.length
  );
}

function standardDeviation(
  values: number[],
): number | null {
  if (values.length < 2) {
    return null;
  }

  const average = mean(values);

  if (average === null) {
    return null;
  }

  const variance =
    values.reduce(
      (sum, value) =>
        sum +
        (value - average) ** 2,
      0,
    ) /
    (values.length - 1);

  return Math.sqrt(
    Math.max(variance, 0),
  );
}

function annualizedVolatility(
  returns: number[],
): number | null {
  if (returns.length < 2) {
    return null;
  }

  const dailyVolatility =
    standardDeviation(returns);

  if (dailyVolatility === null) {
    return null;
  }

  return (
    dailyVolatility *
    Math.sqrt(252)
  );
}

function downsideDeviation(
  returns: number[],
): number | null {
  if (returns.length < 2) {
    return null;
  }

  const squaredDownside =
    returns.reduce(
      (sum, value) =>
        sum +
        (value < 0
          ? value ** 2
          : 0),
      0,
    ) / returns.length;

  return (
    Math.sqrt(
      squaredDownside,
    ) * Math.sqrt(252)
  );
}

function covariance(
  left: number[],
  right: number[],
): number | null {
  const count = Math.min(
    left.length,
    right.length,
  );

  if (count < 2) {
    return null;
  }

  const leftValues =
    left.slice(-count);
  const rightValues =
    right.slice(-count);

  const leftMean =
    mean(leftValues);
  const rightMean =
    mean(rightValues);

  if (
    leftMean === null ||
    rightMean === null
  ) {
    return null;
  }

  return (
    leftValues.reduce(
      (sum, value, index) =>
        sum +
        (value - leftMean) *
          (rightValues[index] -
            rightMean),
      0,
    ) /
    (count - 1)
  );
}

function correlation(
  left: number[],
  right: number[],
): number | null {
  const count = Math.min(
    left.length,
    right.length,
  );

  if (count < 2) {
    return null;
  }

  const leftValues =
    left.slice(-count);
  const rightValues =
    right.slice(-count);

  const covarianceValue =
    covariance(
      leftValues,
      rightValues,
    );

  const leftDeviation =
    standardDeviation(
      leftValues,
    );

  const rightDeviation =
    standardDeviation(
      rightValues,
    );

  if (
    covarianceValue === null ||
    leftDeviation === null ||
    rightDeviation === null ||
    leftDeviation === 0 ||
    rightDeviation === 0
  ) {
    return null;
  }

  return clamp(
    covarianceValue /
      (leftDeviation *
        rightDeviation),
    -1,
    1,
  );
}

function calculateBeta(
  returns: number[],
  benchmarkReturns: number[],
): number | null {
  const count = Math.min(
    returns.length,
    benchmarkReturns.length,
  );

  if (count < 20) {
    return null;
  }

  const securityReturns =
    returns.slice(-count);

  const benchmark =
    benchmarkReturns.slice(-count);

  const covarianceValue =
    covariance(
      securityReturns,
      benchmark,
    );

  if (covarianceValue === null) {
    return null;
  }

  const benchmarkDeviation =
    standardDeviation(
      benchmark,
    );

  if (
    benchmarkDeviation === null ||
    benchmarkDeviation === 0
  ) {
    return null;
  }

  return (
    covarianceValue /
    benchmarkDeviation ** 2
  );
}

function calculateDrawdown(
  returns: number[],
): {
  maxDrawdown: number | null;
  currentDrawdown: number | null;
} {
  if (returns.length === 0) {
    return {
      maxDrawdown: null,
      currentDrawdown: null,
    };
  }

  let wealth = 1;
  let peak = 1;
  let maximumDrawdown = 0;

  for (const dailyReturn of returns) {
    if (
      !Number.isFinite(dailyReturn) ||
      dailyReturn <= -1
    ) {
      continue;
    }

    wealth *=
      1 + dailyReturn;

    if (wealth > peak) {
      peak = wealth;
    }

    const drawdown =
      wealth / peak - 1;

    if (
      drawdown <
      maximumDrawdown
    ) {
      maximumDrawdown =
        drawdown;
    }
  }

  return {
    maxDrawdown:
      Math.abs(
        maximumDrawdown,
      ),
    currentDrawdown:
      Math.abs(
        wealth / peak - 1,
      ),
  };
}

function calculateVaR95(
  returns: number[],
): number | null {
  if (returns.length < 20) {
    return null;
  }

  const values =
    sorted(returns);

  /*
   * Historical 95% VaR uses the lower 5th-percentile
   * return. Linear interpolation avoids the extremely
   * aggressive "minimum observation" behavior that occurs
   * when floor(n * 0.05) - 1 is used for small samples.
   */
  const position =
    0.05 *
    (values.length - 1);

  const lowerIndex =
    Math.floor(position);

  const upperIndex =
    Math.ceil(position);

  const lower =
    values[lowerIndex];

  const upper =
    values[upperIndex];

  const percentile =
    lower +
    (upper - lower) *
      (position -
        lowerIndex);

  return Math.max(
    0,
    Math.abs(percentile),
  );
}

function calculateCVaR95(
  returns: number[],
): number | null {
  if (returns.length < 20) {
    return null;
  }

  const values =
    sorted(returns);

  const cutoff =
    Math.max(
      1,
      Math.ceil(
        values.length * 0.05,
      ),
    );

  const tail =
    values.slice(0, cutoff);

  const averageTailReturn =
    mean(tail);

  return averageTailReturn ===
    null
    ? null
    : Math.max(
        0,
        Math.abs(
          averageTailReturn,
        ),
      );
}

function calculateMomentum(
  returns: number[],
): number | null {
  /*
   * A metric called momentum30d must have a full
   * 30-observation window. Do not label a shorter
   * history as 30-day momentum.
   */
  if (returns.length < 30) {
    return null;
  }

  const recent =
    returns.slice(-30);

  let cumulative = 1;

  for (const dailyReturn of recent) {
    if (
      !Number.isFinite(
        dailyReturn,
      ) ||
      dailyReturn <= -1
    ) {
      return null;
    }

    cumulative *=
      1 + dailyReturn;
  }

  return cumulative - 1;
}

function volatilityRisk(
  volatility: number | null,
): number {
  if (volatility === null) {
    return 50;
  }

  return clamp(
    (volatility / 0.8) * 100,
  );
}

function systematicRisk(
  beta: number | null,
  correlationValue: number | null,
): number {
  if (
    beta === null &&
    correlationValue === null
  ) {
    return 50;
  }

  const betaRisk =
    beta === null
      ? 50
      : clamp(
          (Math.abs(beta - 0.5) /
            2.0) *
            100,
        );

  const correlationRisk =
    correlationValue === null
      ? 50
      : clamp(
          Math.abs(
            correlationValue,
          ) * 100,
        );

  if (beta === null) {
    return correlationRisk;
  }

  if (
    correlationValue === null
  ) {
    return betaRisk;
  }

  return (
    betaRisk * 0.65 +
    correlationRisk * 0.35
  );
}

function drawdownRisk(
  maxDrawdown: number | null,
): number {
  if (maxDrawdown === null) {
    return 50;
  }

  return clamp(
    (maxDrawdown / 0.7) * 100,
  );
}

function liquidityRisk(
  volumeUsd: number | null,
  marketCap: number | null,
): number {
  if (
    volumeUsd === null ||
    volumeUsd <= 0
  ) {
    return 50;
  }

  const dollarVolumeRisk =
    clamp(
      100 -
        Math.log10(
          Math.max(
            volumeUsd,
            1,
          ),
        ) *
          10,
    );

  if (
    marketCap === null ||
    marketCap <= 0
  ) {
    return dollarVolumeRisk;
  }

  const turnover =
    volumeUsd / marketCap;

  const turnoverRisk =
    turnover >= 0.1
      ? 10
      : turnover >= 0.03
        ? 25
        : turnover >= 0.01
          ? 45
          : turnover >= 0.003
            ? 65
            : 85;

  return (
    dollarVolumeRisk * 0.55 +
    turnoverRisk * 0.45
  );
}

function tailRisk(
  var95: number | null,
  cvar95: number | null,
): number {
  if (
    var95 === null &&
    cvar95 === null
  ) {
    return 50;
  }

  const varRisk =
    var95 === null
      ? 50
      : clamp(
          (var95 / 0.08) * 100,
        );

  const cvarRisk =
    cvar95 === null
      ? 50
      : clamp(
          (cvar95 / 0.12) * 100,
        );

  return (
    varRisk * 0.4 +
    cvarRisk * 0.6
  );
}

function momentumRisk(
  momentum: number | null,
): number {
  if (momentum === null) {
    return 50;
  }

  /*
   * Momentum is deliberately a relatively small component.
   * Strong positive/negative momentum is treated as increased
   * behavioral risk rather than assuming direction predicts return.
   */
  return clamp(
    (Math.abs(momentum) / 0.5) *
      100,
  );
}

function riskGroup(
  score: number,
): RiskGroup {
  if (score < 20) {
    return RISK_GROUPS[0];
  }

  if (score < 40) {
    return RISK_GROUPS[1];
  }

  if (score < 60) {
    return RISK_GROUPS[2];
  }

  if (score < 80) {
    return RISK_GROUPS[3];
  }

  return RISK_GROUPS[4];
}

function suggestedLeverage(
  score: number,
): number {
  /*
   * Indicative model output only.
   * This remains deliberately conservative.
   */
  const leverage =
    4 - (score / 100) * 3;

  return (
    Math.round(
      clamp(
        leverage,
        1,
        4,
      ) * 100,
    ) / 100
  );
}

function component(
  score: number,
  weight: number,
  label: string,
  explanation: string,
): RiskComponent {
  const boundedScore =
    clamp(score);

  return {
    score:
      Math.round(
        boundedScore * 100,
      ) / 100,
    weight,
    contribution:
      Math.round(
        boundedScore *
          weight *
          100,
      ) / 100,
    label,
    explanation,
  };
}

function buildDrivers(
  components: RiskEngineResult["components"],
): string[] {
  return Object.values(
    components,
  )
    .sort(
      (left, right) =>
        right.contribution -
        left.contribution,
    )
    .slice(0, 3)
    .map(
      (item) =>
        item.explanation,
    );
}

function calculateConfidence(
  input: RiskEngineInput,
): number {
  let confidence = 35;

  const returnCount =
    input.returns?.filter(
      Number.isFinite,
    ).length ?? 0;

  const benchmarkCount =
    input.benchmarkReturns?.filter(
      Number.isFinite,
    ).length ?? 0;

  if (returnCount >= 30) {
    confidence += 10;
  }

  if (returnCount >= 60) {
    confidence += 10;
  }

  if (returnCount >= 90) {
    confidence += 10;
  }

  if (benchmarkCount >= 30) {
    confidence += 10;
  }

  if (
    finite(input.marketCap) !==
    null
  ) {
    confidence += 5;
  }

  if (
    finite(input.volumeUsd) !==
    null
  ) {
    confidence += 5;
  }

  if (
    finite(input.beta) !== null
  ) {
    confidence += 5;
  }

  if (
    finite(
      input.currentPrice,
    ) !== null &&
    finite(
      input.previousPeakPrice,
    ) !== null
  ) {
    confidence += 5;
  }

  if (
    finite(
      input.historyDays,
    ) !== null &&
    (input.historyDays ?? 0) >=
      252
  ) {
    confidence += 5;
  }

  return Math.round(
    clamp(confidence),
  );
}

export function calculateRisk(
  input: RiskEngineInput,
): RiskEngineResult {
  const returns =
    (input.returns ?? []).filter(
      Number.isFinite,
    );

  const benchmarkReturns =
    (
      input.benchmarkReturns ??
      []
    ).filter(Number.isFinite);

  /*
   * Explicit window requirements:
   *
   * 30-day volatility requires 30 returns.
   * 60-day volatility requires 60 returns.
   * 90-day volatility requires 90 returns.
   */
  const volatility30d =
    returns.length >= 30
      ? annualizedVolatility(
          returns.slice(-30),
        )
      : null;

  const volatility60d =
    returns.length >= 60
      ? annualizedVolatility(
          returns.slice(-60),
        )
      : null;

  const volatility90d =
    returns.length >= 90
      ? annualizedVolatility(
          returns.slice(-90),
        )
      : null;

  /*
   * Prefer the longest available window.
   * This produces a more stable primary volatility estimate.
   */
  const volatility =
    volatility90d ??
    volatility60d ??
    volatility30d;

  const downside =
    downsideDeviation(
      returns,
    );

  const drawdown =
    calculateDrawdown(
      returns,
    );

  /*
   * Correlation and beta require aligned observations.
   * calculateBeta/correlation use the common trailing
   * observation count.
   */
  const correlationValue =
    correlation(
      returns,
      benchmarkReturns,
    );

  const calculatedBeta =
    calculateBeta(
      returns,
      benchmarkReturns,
    );

  const beta =
    finite(input.beta) ??
    calculatedBeta;

  const var95 =
    calculateVaR95(returns);

  const cvar95 =
    calculateCVaR95(returns);

  const momentum =
    calculateMomentum(
      returns,
    );

  const systematic =
    systematicRisk(
      beta,
      correlationValue,
    );

  const volatilityComponent =
    volatilityRisk(
      volatility,
    );

  const drawdownComponent =
    drawdownRisk(
      drawdown.maxDrawdown,
    );

  const liquidityComponent =
    liquidityRisk(
      finite(input.volumeUsd),
      finite(input.marketCap),
    );

  const tailComponent =
    tailRisk(
      var95,
      cvar95,
    );

  const momentumComponent =
    momentumRisk(
      momentum,
    );

  const components = {
    systematic: component(
      systematic,
      COMPONENT_WEIGHTS.systematic,
      "Systematic risk",
      beta === null
        ? "Systematic-risk inputs are limited because beta or benchmark history is unavailable."
        : `Systematic risk reflects a beta of ${beta.toFixed(
            2,
          )} and the security's historical benchmark sensitivity.`,
    ),

    volatility: component(
      volatilityComponent,
      COMPONENT_WEIGHTS.volatility,
      "Volatility",
      volatility === null
        ? "Volatility confidence is limited because insufficient return history is available."
        : `Realized volatility is ${(
            volatility * 100
          ).toFixed(
            1,
          )}% annualized using the available historical return series.`,
    ),

    drawdown: component(
      drawdownComponent,
      COMPONENT_WEIGHTS.drawdown,
      "Drawdown",
      drawdown.maxDrawdown ===
      null
        ? "Drawdown cannot be estimated reliably without sufficient historical prices."
        : `Maximum historical drawdown in the supplied return series was ${(
            drawdown.maxDrawdown *
            100
          ).toFixed(
            1,
          )}%.`,
    ),

    liquidity: component(
      liquidityComponent,
      COMPONENT_WEIGHTS.liquidity,
      "Liquidity",
      finite(
        input.volumeUsd,
      ) === null
        ? "Liquidity confidence is limited because dollar-volume data is unavailable."
        : "Liquidity risk incorporates trading activity and the relationship between trading activity and market capitalization.",
    ),

    tail: component(
      tailComponent,
      COMPONENT_WEIGHTS.tail,
      "Tail risk",
      cvar95 === null
        ? "Tail-risk confidence is limited because the historical return sample is too small."
        : `The estimated 95% conditional tail loss is ${(
            cvar95 * 100
          ).toFixed(
            1,
          )}% for the available return history.`,
    ),

    momentum: component(
      momentumComponent,
      COMPONENT_WEIGHTS.momentum,
      "Price behavior",
      momentum === null
        ? "Recent price-behavior risk cannot be estimated reliably without a complete 30-session history."
        : `The latest 30-session cumulative movement was ${(
            momentum * 100
          ).toFixed(
            1,
          )}%, treated as a behavioral-risk signal rather than a return forecast.`,
    ),
  };

  const rawScore =
    components.systematic.score *
      components.systematic.weight +
    components.volatility.score *
      components.volatility.weight +
    components.drawdown.score *
      components.drawdown.weight +
    components.liquidity.score *
      components.liquidity.weight +
    components.tail.score *
      components.tail.weight +
    components.momentum.score *
      components.momentum.weight;

  const score =
    Math.round(
      clamp(rawScore) * 100,
    ) / 100;

  const result: RiskEngineResult = {
    symbol:
      input.symbol
        .trim()
        .toUpperCase(),

    score,

    group:
      riskGroup(score),

    suggestedLeverage:
      suggestedLeverage(score),

    confidence:
      calculateConfidence(input),

    components,

    metrics: {
      beta,
      correlation:
        correlationValue,

      volatility30d,
      volatility60d,
      volatility90d,

      downsideDeviation:
        downside,

      maxDrawdown:
        drawdown.maxDrawdown,

      currentDrawdown:
        drawdown.currentDrawdown,

      var95,
      cvar95,

      momentum30d:
        momentum,
    },

    drivers: [],
  };

  result.drivers =
    buildDrivers(
      result.components,
    );

  return result;
}