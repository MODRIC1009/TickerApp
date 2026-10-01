"use client";

import type {
  RiskProvenance,
  RiskResult,
} from "@/lib/risk-api";

type RiskScorePanelProps = {
  result: RiskResult | null;
  provenance?: RiskProvenance | null;
  loading?: boolean;
  error?: string | null;
};

const riskDescriptions: Record<RiskResult["group"], string> = {
  "Very Stable":
    "Low modeled risk with comparatively resilient behavior across the major risk factors.",
  Stable:
    "Relatively controlled modeled risk with limited concentration across the risk factors.",
  Moderate:
    "Balanced modeled risk with several factors requiring ongoing monitoring.",
  Risky:
    "Elevated modeled risk driven by one or more material risk factors.",
  "Very Risky":
    "High modeled risk with significant exposure to adverse volatility, drawdown, liquidity, or tail-risk conditions.",
};

const riskLabels: Record<RiskResult["group"], string> = {
  "Very Stable": "LOW",
  Stable: "LOW–MODERATE",
  Moderate: "MODERATE",
  Risky: "HIGH",
  "Very Risky": "VERY HIGH",
};

function formatPercent(value: number | null, digits = 1): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return `${(value * 100).toFixed(digits)}%`;
}

function formatNumber(value: number | null, digits = 2): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return value.toFixed(digits);
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "Unavailable";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unavailable";
  }

  return (
    new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "UTC",
    }).format(date) + " UTC"
  );
}

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    return `${startDate} → ${endDate}`;
  }

  const formatter = new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  return `${formatter.format(start)} → ${formatter.format(end)}`;
}

function getRiskTone(group: RiskResult["group"]): {
  accent: string;
  bar: string;
  badge: string;
} {
  switch (group) {
    case "Very Stable":
      return {
        accent: "text-accent",
        bar: "bg-accent",
        badge: "border-accent/30 bg-accent/10 text-accent",
      };

    case "Stable":
      return {
        accent: "text-accent",
        bar: "bg-accent",
        badge: "border-accent/30 bg-accent/10 text-accent",
      };

    case "Moderate":
      return {
        accent: "text-warning",
        bar: "bg-warning",
        badge: "border-warning/30 bg-warning/10 text-warning",
      };

    case "Risky":
      return {
        accent: "text-negative",
        bar: "bg-negative",
        badge: "border-negative/30 bg-negative/10 text-negative",
      };

    case "Very Risky":
      return {
        accent: "text-negative",
        bar: "bg-negative",
        badge: "border-negative/30 bg-negative/10 text-negative",
      };
  }
}

function RiskMetric({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="group rounded-xl border border-border-subtle bg-surface-hover p-4 transition-colors hover:border-border hover:bg-surface">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
        {label}
      </p>

      <p className="mt-1.5 font-mono text-sm font-semibold text-foreground">
        {value}
      </p>

      {description ? (
        <p className="mt-1 text-[10px] leading-4 text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function RiskComponentRow({
  label,
  score,
  weight,
  contribution,
  explanation,
}: {
  label: string;
  score: number;
  weight: number;
  contribution?: number;
  explanation: string;
}) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const normalizedWeight = Math.max(0, weight);

  return (
    <div className="group border-t border-border-subtle py-4 first:border-t-0 first:pt-0 last:pb-0">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-foreground">
              {label}
            </p>

            <span className="rounded-full border border-border-subtle bg-surface-hover px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
              {(normalizedWeight * 100).toFixed(0)}% weight
            </span>
          </div>

          <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
            {explanation}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-sm font-semibold text-foreground">
            {normalizedScore.toFixed(0)}
          </p>

          {typeof contribution === "number" &&
          Number.isFinite(contribution) ? (
            <p className="mt-0.5 font-mono text-[10px] text-muted">
              +{contribution.toFixed(1)}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-hover">
        <div
          className="h-full rounded-full bg-foreground/80 transition-all duration-700 group-hover:bg-accent"
          style={{
            width: `${normalizedScore}%`,
          }}
        />
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <section
      aria-busy="true"
      aria-label="Quantitative risk analysis loading"
      className="glass-panel-elevated overflow-hidden rounded-2xl"
    >
      <div className="spatial-grid absolute inset-0 opacity-20" />

      <div className="relative border-b border-border-subtle p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              TickerApp quantitative risk
            </p>

            <div className="mt-4 h-10 w-28 animate-pulse rounded-lg bg-surface-hover" />

            <div className="mt-4 h-4 w-24 animate-pulse rounded bg-surface-hover" />

            <div className="mt-2 h-3 w-72 max-w-full animate-pulse rounded bg-surface-hover" />
          </div>

          <div className="hidden gap-3 sm:grid sm:grid-cols-2">
            <div className="h-20 w-28 animate-pulse rounded-xl border border-border-subtle bg-surface-hover" />
            <div className="h-20 w-28 animate-pulse rounded-xl border border-border-subtle bg-surface-hover" />
          </div>
        </div>

        <div className="mt-6 h-2 animate-pulse rounded-full bg-surface-hover" />
      </div>

      <div className="relative grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            Quantitative risk analysis
          </p>

          <p className="mt-2 text-sm text-muted">
            Loading quantitative risk analysis...
          </p>

          <div className="mt-6 space-y-5">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index}>
                <div className="flex items-center justify-between gap-4">
                  <div className="h-4 w-32 animate-pulse rounded bg-surface-hover" />
                  <div className="h-4 w-10 animate-pulse rounded bg-surface-hover" />
                </div>

                <div className="mt-3 h-1.5 animate-pulse rounded-full bg-surface-hover" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-border-subtle p-6 lg:border-l lg:border-t-0">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-20 animate-pulse rounded-xl border border-border-subtle bg-surface-hover"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ErrorState({
  error,
}: {
  error: string;
}) {
  return (
    <section className="glass-panel-elevated overflow-hidden rounded-2xl">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-negative" />

          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            TickerApp quantitative risk
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-negative/20 bg-negative-muted p-5">
          <p className="text-sm font-semibold text-foreground">
            Risk engine unavailable
          </p>

          <p className="mt-2 text-xs leading-5 text-muted">
            {error}
          </p>

          <p className="mt-3 text-[11px] leading-5 text-muted">
            Risk analysis requires sufficient market and historical
            data. Please try again when the data provider is available.
          </p>
        </div>
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="glass-panel-elevated overflow-hidden rounded-2xl">
      <div className="p-6">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-warning" />

          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
            TickerApp quantitative risk
          </p>
        </div>

        <div className="mt-5 rounded-xl border border-border-subtle bg-surface-hover p-5">
          <p className="text-sm font-semibold text-foreground">
            Quantitative risk unavailable
          </p>

          <p className="mt-2 text-xs leading-5 text-muted">
            Risk analysis will appear when sufficient market and
            historical data is available.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProvenancePanel({
  provenance,
}: {
  provenance: RiskProvenance;
}) {
  return (
    <div className="border-t border-border-subtle p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />

            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Data provenance
            </p>
          </div>

          <p className="mt-2 text-sm font-medium text-foreground">
            Calculated from market data supplied by{" "}
            {provenance.providerName}
          </p>

          <p className="mt-1 text-xs leading-5 text-muted">
            Historical analysis window:{" "}
            {formatDateRange(
              provenance.historyStartDate,
              provenance.historyEndDate,
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-border-subtle bg-surface-hover px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
              Provider
            </p>

            <p className="mt-1 font-mono text-xs font-semibold text-foreground">
              {provenance.providerId}
            </p>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface-hover px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
              History
            </p>

            <p className="mt-1 font-mono text-xs font-semibold text-foreground">
              {provenance.historyBars} bars
            </p>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface-hover px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
              Benchmark
            </p>

            <p className="mt-1 font-mono text-xs font-semibold text-foreground">
              {provenance.benchmarkSymbol ?? "None"}
            </p>
          </div>

          <div className="rounded-xl border border-border-subtle bg-surface-hover px-3 py-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
              Quote time
            </p>

            <p className="mt-1 font-mono text-[10px] font-semibold text-foreground">
              {formatTimestamp(provenance.quoteTimestamp)}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-[10px] leading-4 text-muted">
        Live quote data and historical observations are provider-sourced.
        The risk score and all derived metrics are calculated by TickerApp
        and should not be interpreted as an official rating or personalized
        investment recommendation.
      </p>
    </div>
  );
}

export function RiskScorePanel({
  result,
  provenance = null,
  loading = false,
  error = null,
}: RiskScorePanelProps) {
  if (loading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} />;
  }

  if (!result) {
    return <EmptyState />;
  }

  const tone = getRiskTone(result.group);

  const components = [
    result.components.systematic,
    result.components.volatility,
    result.components.drawdown,
    result.components.liquidity,
    result.components.tail,
    result.components.momentum,
  ];

  return (
    <section className="glass-panel-elevated relative overflow-hidden rounded-2xl">
      <div className="spatial-grid pointer-events-none absolute inset-0 opacity-15" />

      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative border-b border-border-subtle p-6">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_12px_currentColor]" />

              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                TickerApp quantitative risk
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-2">
              <p
                className={`font-mono text-5xl font-semibold tracking-[-0.04em] ${tone.accent}`}
              >
                {result.score.toFixed(0)}
              </p>

              <p className="font-mono text-sm text-muted">
                / 100
              </p>

              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${tone.badge}`}
              >
                {riskLabels[result.group]}
              </span>
            </div>

            <p className="mt-3 text-sm font-medium text-foreground">
              {result.group}
            </p>

            <p className="mt-1 max-w-xl text-xs leading-5 text-muted">
              {riskDescriptions[result.group]}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
            <div className="rounded-xl border border-border-subtle bg-surface-hover p-4 transition-colors hover:border-border">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted">
                  Confidence
                </p>

                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              </div>

              <p className="mt-2 font-mono text-xl font-semibold text-foreground">
                {result.confidence}%
              </p>

              <p className="mt-1 text-[10px] text-muted">
                Data/model confidence
              </p>
            </div>

            <div className="rounded-xl border border-border-subtle bg-surface-hover p-4 transition-colors hover:border-border">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted">
                  Model leverage
                </p>

                <span className="h-1.5 w-1.5 rounded-full bg-warning" />
              </div>

              <p className="mt-2 font-mono text-xl font-semibold text-foreground">
                {result.suggestedLeverage.toFixed(2)}×
              </p>

              <p className="mt-1 text-[10px] text-muted">
                Model-derived reference
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 h-2 overflow-hidden rounded-full bg-surface-hover">
          <div
            className={`h-full rounded-full transition-all duration-700 ${tone.bar}`}
            style={{
              width: `${Math.min(
                100,
                Math.max(0, result.score),
              )}%`,
            }}
          />
        </div>

        <div className="mt-2 flex justify-between font-mono text-[9px] uppercase tracking-[0.1em] text-muted">
          <span>Lower modeled risk</span>
          <span>Higher modeled risk</span>
        </div>

        <p className="mt-4 text-[11px] leading-5 text-muted">
          The score is a TickerApp quantitative model based on available
          market and historical data. It is not an official rating or
          personalized investment recommendation.
        </p>
      </div>

      <div className="relative grid gap-0 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="p-6">
          <div className="mb-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Risk decomposition
            </p>

            <p className="mt-2 text-sm text-muted">
              Six quantitative dimensions contribute to the composite
              risk score according to their model weights.
            </p>
          </div>

          <div>
            {components.map((component) => (
              <RiskComponentRow
                key={component.label}
                label={component.label}
                score={component.score}
                weight={component.weight}
                contribution={component.contribution}
                explanation={component.explanation}
              />
            ))}
          </div>
        </div>

        <div className="border-t border-border-subtle p-6 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                Quantitative metrics
              </p>

              <p className="mt-1 text-xs text-muted">
                Underlying measurements used by the model.
              </p>
            </div>

            <span className="rounded-full border border-border-subtle bg-surface-hover px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
              Calculated
            </span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <RiskMetric
              label="Beta"
              value={formatNumber(result.metrics.beta)}
              description="Systematic sensitivity"
            />

            <RiskMetric
              label="Benchmark correlation"
              value={formatNumber(result.metrics.correlation)}
              description="Return co-movement"
            />

            <RiskMetric
              label="30D volatility"
              value={formatPercent(result.metrics.volatility30d)}
              description="Recent realized risk"
            />

            <RiskMetric
              label="60D volatility"
              value={formatPercent(result.metrics.volatility60d)}
              description="Medium-term realized risk"
            />

            <RiskMetric
              label="90D volatility"
              value={formatPercent(result.metrics.volatility90d)}
              description="Longer-term realized risk"
            />

            <RiskMetric
              label="Downside deviation"
              value={formatPercent(result.metrics.downsideDeviation)}
              description="Negative-return dispersion"
            />

            <RiskMetric
              label="Max drawdown"
              value={formatPercent(result.metrics.maxDrawdown)}
              description="Largest historical peak-to-trough"
            />

            <RiskMetric
              label="Current drawdown"
              value={formatPercent(result.metrics.currentDrawdown)}
              description="Distance from recent peak"
            />

            <RiskMetric
              label="VaR 95%"
              value={formatPercent(result.metrics.var95)}
              description="Estimated daily loss threshold"
            />

            <RiskMetric
              label="CVaR 95%"
              value={formatPercent(result.metrics.cvar95)}
              description="Average tail loss estimate"
            />

            <RiskMetric
              label="30D momentum"
              value={formatPercent(result.metrics.momentum30d)}
              description="Recent price trend"
            />
          </div>
        </div>
      </div>

      <div className="relative border-t border-border-subtle p-6">
        <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Primary risk drivers
            </p>

            <p className="mt-2 text-sm text-muted">
              The highest-contributing factors identified in the current
              model output.
            </p>
          </div>

          <div className="space-y-3">
            {result.drivers.length > 0 ? (
              result.drivers.map((driver, index) => (
                <div
                  key={`${driver}-${index}`}
                  className="flex gap-3 rounded-xl border border-border-subtle bg-surface-hover p-4 transition-colors hover:border-border hover:bg-surface"
                >
                  <span className="font-mono text-xs text-muted">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <span className="text-xs leading-5 text-foreground">
                    {driver}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-border-subtle bg-surface-hover p-4">
                <span className="text-xs leading-5 text-muted">
                  No primary drivers were returned by the current model
                  output.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {provenance ? (
        <ProvenancePanel provenance={provenance} />
      ) : null}
    </section>
  );
}