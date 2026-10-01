"use client";

import { useMemo, useState } from "react";

import type { StrategyInput } from "@tickerapp/analytics";

interface StrategyLabProps {
  symbol: string;
  prices: StrategyInput[];
}

type Strategy =
  | "buy-and-hold"
  | "sma-crossover"
  | "momentum";

type BacktestResult = {
  initialCapital: number;
  finalCapital: number;
  totalReturn: number;
  maxDrawdown: number;
  tradeCount: number;
};

type BacktestResponse = {
  result?: BacktestResult;
  error?: string;
};

const strategies: {
  id: Strategy;
  label: string;
  shortLabel: string;
  description: string;
  methodology: string;
}[] = [
  {
    id: "buy-and-hold",
    label: "Buy & Hold",
    shortLabel: "PASSIVE",
    description:
      "Passive exposure from the first available session.",
    methodology:
      "Maintains exposure throughout the available historical series.",
  },
  {
    id: "sma-crossover",
    label: "SMA Crossover",
    shortLabel: "TREND",
    description:
      "Long exposure when the short moving average exceeds the long moving average.",
    methodology:
      "Uses moving-average relationships to determine long exposure.",
  },
  {
    id: "momentum",
    label: "Momentum",
    shortLabel: "MOMENTUM",
    description:
      "Long exposure when recent price momentum is positive.",
    methodology:
      "Maintains long exposure when recent price momentum is positive.",
  },
];

function formatMoney(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function getPerformanceClass(value: number) {
  if (value > 0) {
    return "text-accent";
  }

  if (value < 0) {
    return "text-negative";
  }

  return "text-muted";
}

function getPerformanceTone(value: number) {
  if (value > 0) {
    return "border-accent/20 bg-accent-muted";
  }

  if (value < 0) {
    return "border-negative/20 bg-negative-muted";
  }

  return "border-border-subtle bg-background/50";
}

function getInitials(label: string) {
  return label
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function StrategyLab({
  symbol,
  prices,
}: StrategyLabProps) {
  const [strategy, setStrategy] =
    useState<Strategy>("buy-and-hold");

  const [capital, setCapital] =
    useState("10000");

  const [result, setResult] =
    useState<BacktestResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const selectedStrategy =
    strategies.find(
      (item) => item.id === strategy,
    ) ?? strategies[0];

  const dataReady = useMemo(
    () =>
      prices.length >= 2 &&
      prices.every((item) =>
        Number.isFinite(item.price),
      ),
    [prices],
  );

  const dataStatus = dataReady
    ? "Ready"
    : prices.length === 0
      ? "Unavailable"
      : "Insufficient";

  const dataStatusClass = dataReady
    ? "text-accent"
    : "text-warning";

  const capitalValue = Number(capital);

  const capitalValid =
    Number.isFinite(capitalValue) &&
    capitalValue > 0;

  const returnValue = result
    ? result.finalCapital - result.initialCapital
    : 0;

  async function runBacktest() {
    const initialCapital =
      Number(capital);

    if (
      !Number.isFinite(initialCapital) ||
      initialCapital <= 0
    ) {
      setError(
        "Enter a valid starting capital greater than zero.",
      );
      setResult(null);
      return;
    }

    if (!dataReady) {
      setError(
        "There is not enough historical price data to run this backtest.",
      );
      setResult(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "/api/analytics/backtest",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            symbol,
            strategy,
            initialCapital,
            prices,
          }),
        },
      );

      const payload =
        (await response.json()) as BacktestResponse;

      if (
        !response.ok ||
        !payload.result
      ) {
        throw new Error(
          payload.error ??
            "Backtest request failed.",
        );
      }

      setResult(payload.result);
    } catch (requestError) {
      setResult(null);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to run the strategy backtest.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass-panel-elevated relative overflow-hidden rounded-2xl">
      <div className="pointer-events-none absolute inset-0 spatial-grid opacity-25" />

      <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative">
        {/* Header */}
        <div className="border-b border-border px-5 py-5 sm:px-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-accent/20 bg-accent-muted font-mono text-xs font-semibold text-accent shadow-[0_0_24px_rgba(255,255,255,0.03)]">
                QL
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                    Quantitative Analysis
                  </p>

                  <span className="h-1 w-1 rounded-full bg-border-strong" />

                  <span className="font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-accent">
                    Strategy Engine
                  </span>
                </div>

                <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground">
                  Strategy Lab
                </h2>

                <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
                  Run historical strategy simulations for{" "}
                  <span className="font-mono font-medium text-muted-strong">
                    {symbol}
                  </span>{" "}
                  against the available price series.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start">
              <div className="rounded-lg border border-border-subtle bg-background/60 px-3 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                  History
                </p>

                <p className="mt-0.5 font-mono text-xs font-medium text-foreground">
                  {prices.length.toLocaleString(
                    "en-US",
                  )}{" "}
                  sessions
                </p>
              </div>

              <div className="rounded-lg border border-border-subtle bg-background/60 px-3 py-2">
                <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                  Data
                </p>

                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      dataReady
                        ? "status-dot-positive"
                        : "status-dot-warning"
                    }`}
                  />

                  <span
                    className={`text-[10px] font-medium ${dataStatusClass}`}
                  >
                    {dataStatus}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Strategy selection */}
        <div className="relative p-5 sm:p-6">
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                    Strategy configuration
                  </p>

                  <p className="mt-1 text-xs text-muted">
                    Select a model to simulate against the
                    historical series.
                  </p>
                </div>

                <span className="hidden rounded-md border border-border-subtle bg-background/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-muted sm:block">
                  {strategies.length} models
                </span>
              </div>

              <div
                className="grid gap-2"
                role="radiogroup"
                aria-label="Backtest strategy"
              >
                {strategies.map((item) => {
                  const active =
                    item.id === strategy;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => {
                        setStrategy(item.id);
                        setResult(null);
                        setError(null);
                      }}
                      className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 ${
                        active
                          ? "border-accent/35 bg-accent-muted shadow-[0_8px_30px_rgba(0,0,0,0.16)]"
                          : "border-border-subtle bg-background/45 hover:border-border-strong hover:bg-background/70"
                      }`}
                    >
                      {active ? (
                        <span className="absolute inset-y-0 left-0 w-0.5 bg-accent" />
                      ) : null}

                      <div className="flex items-start gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border font-mono text-[10px] font-semibold ${
                            active
                              ? "border-accent/25 bg-accent/10 text-accent"
                              : "border-border-subtle bg-surface text-muted"
                          }`}
                        >
                          {getInitials(
                            item.label,
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`text-sm font-semibold ${
                                active
                                  ? "text-foreground"
                                  : "text-muted-strong"
                              }`}
                            >
                              {item.label}
                            </span>

                            <span
                              className={`rounded border px-1.5 py-0.5 font-mono text-[8px] font-medium tracking-[0.08em] ${
                                active
                                  ? "border-accent/20 bg-accent/10 text-accent"
                                  : "border-border-subtle text-muted"
                              }`}
                            >
                              {item.shortLabel}
                            </span>
                          </div>

                          <p className="mt-1 text-[11px] leading-4 text-muted">
                            {item.description}
                          </p>
                        </div>

                        <span
                          aria-hidden="true"
                          className={`mt-1 h-3.5 w-3.5 shrink-0 rounded-full border ${
                            active
                              ? "border-accent bg-accent shadow-[0_0_10px_rgba(255,255,255,0.2)]"
                              : "border-border-strong"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configuration panel */}
            <div className="glass-panel rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                    Simulation inputs
                  </p>

                  <p className="mt-1 text-xs font-medium text-foreground">
                    {selectedStrategy.label}
                  </p>
                </div>

                <span className="rounded-md border border-border-subtle bg-background/60 px-2 py-1 font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
                  HISTORICAL
                </span>
              </div>

              <div className="mt-5">
                <label
                  htmlFor="initial-capital"
                  className="mb-2 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.13em] text-muted"
                >
                  <span>Starting capital</span>
                  <span className="font-normal normal-case tracking-normal text-muted">
                    Required
                  </span>
                </label>

                <div
                  className={`flex h-11 items-center rounded-lg border bg-background/70 transition-colors ${
                    capitalValid
                      ? "border-border"
                      : "border-negative/40"
                  }`}
                >
                  <span className="pl-3 font-mono text-xs text-muted">
                    $
                  </span>

                  <input
                    id="initial-capital"
                    type="number"
                    min="1"
                    step="100"
                    inputMode="decimal"
                    value={capital}
                    onChange={(event) => {
                      setCapital(
                        event.target.value,
                      );
                      setResult(null);
                    }}
                    className="h-full min-w-0 flex-1 bg-transparent px-2 font-mono text-sm text-foreground outline-none placeholder:text-muted"
                    placeholder="10000"
                    aria-invalid={
                      !capitalValid
                    }
                  />
                </div>

                <p className="mt-2 text-[10px] leading-4 text-muted">
                  Base currency is assumed from the
                  security.
                </p>
              </div>

              <div className="mt-5 rounded-lg border border-border-subtle bg-background/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] text-muted">
                    Historical observations
                  </span>

                  <span className="font-mono text-[10px] font-medium text-muted-strong">
                    {prices.length}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3">
                  <span className="text-[10px] text-muted">
                    Input validation
                  </span>

                  <span
                    className={`font-mono text-[9px] font-medium uppercase tracking-[0.08em] ${
                      dataReady &&
                      capitalValid
                        ? "text-accent"
                        : "text-warning"
                    }`}
                  >
                    {dataReady &&
                    capitalValid
                      ? "Ready"
                      : "Review inputs"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void runBacktest()
                }
                disabled={
                  loading ||
                  !dataReady ||
                  !capitalValid
                }
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-accent/40 bg-accent-muted px-4 text-xs font-semibold text-accent transition-all hover:border-accent hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                {loading ? (
                  <>
                    <span className="h-3 w-3 animate-spin rounded-full border border-accent/30 border-t-accent" />
                    Running simulation
                  </>
                ) : (
                  <>
                    <span>Run backtest</span>
                    <span aria-hidden="true">
                      →
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Methodology */}
          <div className="mt-5 rounded-xl border border-border-subtle bg-background/35 px-4 py-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <div className="flex items-center gap-2 sm:w-40 sm:shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-info" />

                <span className="text-[9px] font-semibold uppercase tracking-[0.13em] text-muted">
                  Methodology
                </span>
              </div>

              <p className="text-[10px] leading-5 text-muted">
                {selectedStrategy.methodology}
              </p>
            </div>
          </div>

          {/* Data warning */}
          {!dataReady ? (
            <div className="mt-4 rounded-xl border border-warning/20 bg-warning-muted px-4 py-3">
              <div className="flex gap-3">
                <span className="mt-0.5 text-warning">
                  !
                </span>

                <div>
                  <p className="text-xs font-medium text-warning">
                    Historical data unavailable or
                    insufficient
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-warning/80">
                    At least two valid historical price
                    observations are required before a
                    backtest can be submitted.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Error */}
          {error ? (
            <div
              role="alert"
              className="mt-4 rounded-xl border border-negative/20 bg-negative-muted px-4 py-3"
            >
              <div className="flex gap-3">
                <span className="mt-0.5 text-negative">
                  ×
                </span>

                <div>
                  <p className="text-xs font-medium text-negative">
                    Backtest could not be completed
                  </p>

                  <p className="mt-1 text-[10px] leading-4 text-negative/80">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Results */}
          {result ? (
            <div className="mt-7 border-t border-border pt-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(255,255,255,0.25)]" />

                    <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted">
                      Simulation output
                    </p>
                  </div>

                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">
                      {selectedStrategy.label}
                    </h3>

                    <span className="font-mono text-xs text-muted">
                      {symbol}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-md border border-accent/15 bg-accent-muted px-2 py-1 font-mono text-[8px] font-medium uppercase tracking-[0.1em] text-accent">
                    Completed
                  </span>

                  <span className="rounded-md border border-border-subtle bg-background/50 px-2 py-1 font-mono text-[8px] font-medium uppercase tracking-[0.1em] text-muted">
                    Historical
                  </span>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ResultCard
                  label="Final Capital"
                  value={formatMoney(
                    result.finalCapital,
                  )}
                  meta={`From ${formatMoney(
                    result.initialCapital,
                  )}`}
                />

                <ResultCard
                  label="Total Return"
                  value={formatPercent(
                    result.totalReturn,
                  )}
                  meta={
                    `${returnValue >= 0 ? "+" : ""}${formatMoney(
                      returnValue,
                    )} capital change`
                  }
                  valueClassName={getPerformanceClass(
                    result.totalReturn,
                  )}
                  className={getPerformanceTone(
                    result.totalReturn,
                  )}
                />

                <ResultCard
                  label="Max Drawdown"
                  value={formatPercent(
                    result.maxDrawdown,
                  )}
                  meta="Peak-to-trough decline"
                  valueClassName={getPerformanceClass(
                    -Math.abs(
                      result.maxDrawdown,
                    ),
                  )}
                  className={getPerformanceTone(
                    -Math.abs(
                      result.maxDrawdown,
                    ),
                  )}
                />

                <ResultCard
                  label="Trades"
                  value={result.tradeCount.toLocaleString(
                    "en-US",
                  )}
                  meta="Recorded strategy actions"
                />
              </div>

              {/* Result detail */}
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                <div className="glass-panel rounded-xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted">
                      Simulation profile
                    </p>

                    <span className="font-mono text-[9px] text-muted">
                      {prices.length} sessions
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <DetailRow
                      label="Instrument"
                      value={symbol}
                    />

                    <DetailRow
                      label="Strategy"
                      value={
                        selectedStrategy.label
                      }
                    />

                    <DetailRow
                      label="Initial capital"
                      value={formatMoney(
                        result.initialCapital,
                      )}
                    />

                    <DetailRow
                      label="Final capital"
                      value={formatMoney(
                        result.finalCapital,
                      )}
                      valueClassName={getPerformanceClass(
                        returnValue,
                      )}
                    />
                  </div>
                </div>

                <div className="glass-panel rounded-xl p-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted">
                    Risk & execution context
                  </p>

                  <div className="mt-4 space-y-3">
                    <DetailRow
                      label="Maximum drawdown"
                      value={formatPercent(
                        result.maxDrawdown,
                      )}
                      valueClassName="text-negative"
                    />

                    <DetailRow
                      label="Trade count"
                      value={result.tradeCount.toLocaleString(
                        "en-US",
                      )}
                    />

                    <DetailRow
                      label="Price observations"
                      value={prices.length.toLocaleString(
                        "en-US",
                      )}
                    />

                    <DetailRow
                      label="Output status"
                      value="Historical simulation"
                      valueClassName="text-accent"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-border-subtle bg-background/35 px-4 py-3">
                <div className="flex gap-3">
                  <span className="mt-0.5 text-info">
                    i
                  </span>

                  <p className="text-[10px] leading-5 text-muted">
                    Backtest results are historical
                    simulations, not predictions or
                    investment advice. They do not account
                    for every real-world execution cost,
                    tax, slippage, liquidity constraint, or
                    future market condition.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function ResultCard({
  label,
  value,
  meta,
  valueClassName = "text-foreground",
  className = "border-border-subtle bg-background/45",
}: {
  label: string;
  value: string;
  meta: string;
  valueClassName?: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border p-4 transition-colors ${className}`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.13em] text-muted">
        {label}
      </p>

      <p
        className={`mt-2 truncate font-mono text-lg font-semibold tracking-tight ${valueClassName}`}
      >
        {value}
      </p>

      <p className="mt-1 truncate text-[9px] text-muted">
        {meta}
      </p>
    </div>
  );
}

function DetailRow({
  label,
  value,
  valueClassName = "text-muted-strong",
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-subtle/70 pb-2 last:border-0 last:pb-0">
      <span className="text-[10px] text-muted">
        {label}
      </span>

      <span
        className={`truncate text-right font-mono text-[10px] font-medium ${valueClassName}`}
      >
        {value}
      </span>
    </div>
  );
}