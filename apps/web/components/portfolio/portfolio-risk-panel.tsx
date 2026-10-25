
"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  getPortfolioRisk,
  type PortfolioRiskAnalysis,
  type PortfolioRiskGroup,
} from "@/lib/portfolio-risk-api";

const portfolioId = "default";

function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return `${(value * 100).toFixed(2)}%`;
}

function formatConfidence(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return `${value.toFixed(0)}%`;
}

function formatScore(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "—";
  }

  return value.toFixed(1);
}

function getRiskTone(group: PortfolioRiskGroup | null): string {
  switch (group) {
    case "Very Stable":
      return "border-accent/20 bg-accent-muted text-accent";
    case "Stable":
      return "border-accent/20 bg-accent-muted text-accent";
    case "Moderate":
      return "border-warning/20 bg-warning/10 text-warning";
    case "Risky":
    case "Very Risky":
      return "border-negative/20 bg-negative-muted text-negative";
    default:
      return "border-border bg-surface-hover text-muted";
  }
}

function RiskMetric({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="rounded-xl border border-border-subtle bg-surface p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
        {label}
      </p>
      <p className="mt-3 font-mono text-xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-2 text-xs leading-5 text-muted">
        {description}
      </p>
    </article>
  );
}

function RiskLoadingState() {
  return (
    <section
      className="glass-panel-elevated space-y-4 rounded-2xl p-5 sm:p-6"
      aria-busy="true"
      aria-label="Loading portfolio risk analysis"
    >
      <div className="h-4 w-44 animate-pulse rounded bg-surface-hover" />
      <div className="h-3 w-72 max-w-full animate-pulse rounded bg-surface-hover" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="h-28 animate-pulse rounded-xl border border-border-subtle bg-surface"
          />
        ))}
      </div>
    </section>
  );
}

export function PortfolioRiskPanel() {
  const [analysis, setAnalysis] =
    useState<PortfolioRiskAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRisk = useCallback(
    async (signal?: AbortSignal) => {
      setError(null);

      if (analysis === null) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      try {
        const result = await getPortfolioRisk(portfolioId, {
          signal,
        });

        if (!signal?.aborted) {
          setAnalysis(result);
        }
      } catch (requestError) {
        if (signal?.aborted) {
          return;
        }

        setError(
          requestError instanceof Error
            ? requestError.message
            : "Unable to load portfolio risk analysis.",
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [analysis],
  );

  useEffect(() => {
    const controller = new AbortController();

    queueMicrotask(() => {
      if (!controller.signal.aborted) {
        void loadRisk(controller.signal);
      }
    });

    return () => {
      controller.abort();
    };
  }, [loadRisk]);

  if (loading && analysis === null) {
    return <RiskLoadingState />;
  }

  const hasPositions =
    (analysis?.totalPositions ?? 0) > 0;

  const analyzedPositions = analysis?.positions.filter(
    (position) => position.risk !== null,
  ) ?? [];

  return (
    <section className="glass-panel-elevated relative overflow-hidden rounded-2xl">
      <div className="spatial-grid pointer-events-none absolute inset-0 opacity-10" />

      <div className="relative border-b border-border-subtle px-5 py-5 sm:px-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
              Quantitative analytics
            </p>

            <h2 className="mt-1.5 text-base font-semibold text-foreground">
              Portfolio risk analysis
            </h2>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
              Position-weighted security risk estimates based on the
              available historical market data.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadRisk()}
            disabled={refreshing || loading}
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-border bg-surface-hover px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:border-border-strong hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "Refresh risk"}
          </button>
        </div>
      </div>

      <div className="relative space-y-5 p-5 sm:p-6">
        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-negative/20 bg-negative-muted p-4"
          >
            <p className="text-sm font-semibold text-negative">
              Risk analysis could not be refreshed
            </p>
            <p className="mt-1 text-xs leading-5 text-muted">
              {error}
              {analysis
                ? " Previously loaded results are still shown."
                : ""}
            </p>

            {!analysis ? (
              <button
                type="button"
                onClick={() => void loadRisk()}
                className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground"
              >
                Try again
              </button>
            ) : null}
          </div>
        ) : null}

        {!hasPositions ? (
          <div className="rounded-xl border border-border-subtle bg-surface p-6 text-center">
            <p className="text-sm font-semibold text-foreground">
              No positions to analyze
            </p>
            <p className="mt-2 text-xs leading-5 text-muted">
              Add holdings to your default portfolio to calculate
              security-level risk estimates.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <RiskMetric
                label="Weighted risk score"
                value={formatScore(analysis?.score ?? null)}
                description={
                  analysis?.group
                    ? `Classification: ${analysis.group}`
                    : "A score is unavailable for the current holdings."
                }
              />

              <RiskMetric
                label="Analysis confidence"
                value={formatConfidence(analysis?.confidence ?? null)}
                description="Position-weighted confidence reported by the risk engine."
              />

              <RiskMetric
                label="Analysis coverage"
                value={`${(analysis?.coveragePercent ?? 0).toFixed(1)}%`}
                description={`${analysis?.analyzedPositions ?? 0} of ${analysis?.totalPositions ?? 0} holdings analyzed.`}
              />

              <RiskMetric
                label="Largest position"
                value={
                  analysis?.largestPositionWeight === null ||
                  analysis?.largestPositionWeight === undefined
                    ? "—"
                    : `${analysis.largestPositionWeight.toFixed(1)}%`
                }
                description="Largest holding's share of portfolio market value."
              />
            </div>

            {analysis?.score !== null &&
            analysis?.score !== undefined ? (
              <div className="rounded-xl border border-border-subtle bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                      Risk classification
                    </p>
                    <p className="mt-1.5 text-sm text-foreground">
                      Lower scores indicate lower estimated security risk.
                    </p>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getRiskTone(analysis.group)}`}
                  >
                    {analysis.group ?? "Unclassified"}
                  </span>
                </div>

                <div
                  className="mt-4 h-2 overflow-hidden rounded-full bg-surface-hover"
                  role="progressbar"
                  aria-label="Weighted risk score"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.min(
                    100,
                    Math.max(0, analysis.score),
                  )}
                >
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, analysis.score))}%`,
                    }}
                  />
                </div>

                <div className="mt-2 flex justify-between text-[10px] text-muted">
                  <span>0 · Lower risk</span>
                  <span>100 · Higher risk</span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-warning/20 bg-warning/10 p-4">
                <p className="text-sm font-semibold text-foreground">
                  Aggregate risk score unavailable
                </p>
                <p className="mt-1 text-xs leading-5 text-muted">
                  The engine did not return a usable score. Review coverage
                  and individual holding results below.
                </p>
              </div>
            )}

            <div>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Weighted risk metrics
                </h3>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Estimates are aggregated from successfully analyzed
                  securities, weighted by their share of portfolio value.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                <RiskMetric
                  label="30-day volatility"
                  value={formatPercent(
                    analysis?.weightedVolatility30d ?? null,
                  )}
                  description="Weighted annualized volatility estimate."
                />

                <RiskMetric
                  label="Maximum drawdown"
                  value={formatPercent(
                    analysis?.weightedMaxDrawdown ?? null,
                  )}
                  description="Weighted historical peak-to-trough drawdown estimate."
                />

                <RiskMetric
                  label="95% VaR"
                  value={formatPercent(
                    analysis?.weightedVar95 ?? null,
                  )}
                  description="Weighted historical daily value-at-risk estimate."
                />
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-border-subtle bg-surface p-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Common risk drivers
                </h3>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Most frequently reported drivers across analyzed holdings.
                </p>

                {analysis?.drivers.length ? (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {analysis.drivers.map((driver) => (
                      <li
                        key={driver}
                        className="rounded-full border border-border bg-surface-hover px-3 py-1.5 text-xs text-muted-strong"
                      >
                        {driver}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-xs text-muted">
                    No risk drivers were returned.
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-border-subtle bg-surface p-4">
                <h3 className="text-sm font-semibold text-foreground">
                  Coverage details
                </h3>

                <dl className="mt-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Total holdings</dt>
                    <dd className="font-mono font-semibold text-foreground">
                      {analysis?.totalPositions ?? 0}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Successfully analyzed</dt>
                    <dd className="font-mono font-semibold text-foreground">
                      {analysis?.analyzedPositions ?? 0}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Failed or unavailable</dt>
                    <dd className="font-mono font-semibold text-foreground">
                      {(analysis?.totalPositions ?? 0) -
                        (analysis?.analyzedPositions ?? 0)}
                    </dd>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-muted">Analyzed market-value coverage</dt>
                    <dd className="font-mono font-semibold text-foreground">
                      {(analysis?.coveragePercent ?? 0).toFixed(1)}%
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            <div>
              <div className="mb-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Security-level risk
                </h3>
                <p className="mt-1 text-xs leading-5 text-muted">
                  Individual results and data availability for each holding.
                </p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-border-subtle">
                <table className="data-table w-full min-w-[760px] text-left">
                  <thead>
                    <tr>
                      <th>Security</th>
                      <th className="text-right">Weight</th>
                      <th className="text-right">Risk score</th>
                      <th>Classification</th>
                      <th className="text-right">Volatility</th>
                      <th className="text-right">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {analysis?.positions.map((position) => (
                      <tr key={position.symbol}>
                        <td className="font-mono text-xs font-semibold text-foreground">
                          {position.symbol}
                        </td>

                        <td className="text-right font-mono text-xs text-muted-strong">
                          {position.weight.toFixed(2)}%
                        </td>

                        <td className="text-right font-mono text-xs text-foreground">
                          {formatScore(position.risk?.score ?? null)}
                        </td>

                        <td>
                          {position.risk ? (
                            <span
                              className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-medium ${getRiskTone(position.risk.group)}`}
                            >
                              {position.risk.group}
                            </span>
                          ) : (
                            <span className="text-xs text-muted">
                              Unavailable
                            </span>
                          )}
                        </td>

                        <td className="text-right font-mono text-xs text-muted-strong">
                          {formatPercent(
                            position.risk?.metrics.volatility30d ?? null,
                          )}
                        </td>

                        <td className="text-right">
                          {position.risk ? (
                            <span className="text-xs text-accent">
                              Analyzed
                            </span>
                          ) : (
                            <span
                              className="text-xs text-muted"
                              title={position.error ?? "Risk data unavailable"}
                            >
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {analyzedPositions.length === 0 ? (
                <p className="mt-3 text-xs leading-5 text-muted">
                  No holdings returned a valid risk result. Check market-data
                  availability and try refreshing the analysis.
                </p>
              ) : null}
            </div>

            <p className="text-[10px] leading-5 text-muted">
              Methodology note: the aggregate score and displayed metrics
              are position-weighted individual-security estimates. They do
              not account for cross-security return covariance and should
              not be interpreted as a full portfolio covariance model.
              Historical risk estimates are not guarantees of future results.
            </p>
          </>
        )}
      </div>
    </section>
  );
}
