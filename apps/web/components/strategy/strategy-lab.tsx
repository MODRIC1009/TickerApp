"use client";

import {
  useMemo,
  useState,
} from "react";

import type {
  BacktestConfig,
  BacktestResult,
  StrategyInput,
} from "@tickerapp/analytics";

import { runBacktest } from "@/lib/analytics-api";

import { BacktestEquityChart } from "./backtest-equity-chart";

interface StrategyLabProps {
  symbol: string;
  prices: StrategyInput[];
}

const DEFAULT_CONFIG: Omit<
  BacktestConfig,
  "symbol" | "strategy"
> = {
  initialCapital: 10_000,
  positionSizePercent: 100,
  transactionFeePercent: 0.1,
  slippagePercent: 0.05,
};

export function StrategyLab({
  symbol,
  prices,
}: StrategyLabProps) {
  const [shortPeriod, setShortPeriod] =
    useState(10);

  const [longPeriod, setLongPeriod] =
    useState(30);

  const [rsiPeriod, setRsiPeriod] =
    useState(14);

  const [rsiOversold, setRsiOversold] =
    useState(30);

  const [
    rsiOverbought,
    setRsiOverbought,
  ] = useState(70);

  const [isRunning, setIsRunning] =
    useState(false);

  const [error, setError] =
    useState("");

  const [result, setResult] =
    useState<BacktestResult | null>(
      null,
    );

  const strategyConfig =
    useMemo(
      () => ({
        id: "sma-rsi",
        name: "SMA + RSI Strategy",
        shortPeriod,
        longPeriod,
        rsiPeriod,
        rsiOversold,
        rsiOverbought,
      }),
      [
        shortPeriod,
        longPeriod,
        rsiPeriod,
        rsiOversold,
        rsiOverbought,
      ],
    );

  async function handleRunBacktest() {
    setError("");
    setResult(null);

    if (prices.length < 2) {
      setError(
        "At least two historical price observations are required.",
      );
      return;
    }

    setIsRunning(true);

    try {
      const config: BacktestConfig = {
        symbol,
        strategy: strategyConfig,
        ...DEFAULT_CONFIG,
      };

      const backtestResult =
        await runBacktest(
          prices,
          config,
        );

      setResult(
        backtestResult,
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to run the backtest.",
      );
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <section className="space-y-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">
          Quant Strategy Lab
        </p>

        <h2 className="mt-2 text-2xl font-semibold text-foreground">
          Backtest {symbol}
        </h2>

        <p className="mt-2 text-sm text-muted-strong">
          Test a deterministic SMA + RSI
          strategy against the loaded
          historical price series.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <label className="space-y-2">
          <span className="text-sm font-medium text-muted-strong">
            Short SMA
          </span>

          <input
            type="number"
            min={1}
            value={shortPeriod}
            onChange={(event) =>
              setShortPeriod(
                Number(event.target.value),
              )
            }
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-muted-strong"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-muted-strong">
            Long SMA
          </span>

          <input
            type="number"
            min={2}
            value={longPeriod}
            onChange={(event) =>
              setLongPeriod(
                Number(event.target.value),
              )
            }
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-muted-strong"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-muted-strong">
            RSI Period
          </span>

          <input
            type="number"
            min={1}
            value={rsiPeriod}
            onChange={(event) =>
              setRsiPeriod(
                Number(event.target.value),
              )
            }
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-muted-strong"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-muted-strong">
            RSI Oversold
          </span>

          <input
            type="number"
            min={0}
            max={100}
            value={rsiOversold}
            onChange={(event) =>
              setRsiOversold(
                Number(event.target.value),
              )
            }
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-muted-strong"
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium text-muted-strong">
            RSI Overbought
          </span>

          <input
            type="number"
            min={0}
            max={100}
            value={rsiOverbought}
            onChange={(event) =>
              setRsiOverbought(
                Number(event.target.value),
              )
            }
            className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground outline-none focus:border-muted-strong"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleRunBacktest}
          disabled={isRunning}
          className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isRunning
            ? "Running..."
            : "Run Backtest"}
        </button>

        <span className="text-sm text-muted">
          {prices.length} observations
        </span>
      </div>

      {error ? (
        <div className="rounded-lg border border-negative/30 bg-negative/10 px-4 py-3 text-sm text-negative">
          {error}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Backtest Results
            </h3>

            <p className="mt-1 text-sm text-muted">
              {result.startDate} →{" "}
              {result.endDate}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric
              label="Final Capital"
              value={formatCurrency(
                result.summary
                  .finalCapital,
              )}
            />

            <Metric
              label="Net Profit"
              value={formatCurrency(
                result.summary
                  .netProfit,
              )}
            />

            <Metric
              label="Total Return"
              value={formatPercent(
                result.summary
                  .totalReturn,
              )}
            />

            <Metric
              label="Max Drawdown"
              value={formatPercent(
                result.summary
                  .maxDrawdownPercent /
                  100,
              )}
            />

            <Metric
              label="Volatility"
              value={formatPercent(
                result.summary
                  .volatility,
              )}
            />

            <Metric
              label="Sharpe Ratio"
              value={formatNumber(
                result.summary
                  .sharpeRatio,
              )}
            />

            <Metric
              label="Sortino Ratio"
              value={formatNumber(
                result.summary
                  .sortinoRatio,
              )}
            />

            <Metric
              label="Completed Trades"
              value={String(
                result.summary
                  .tradeCount,
              )}
            />
          </div>

          <div className="rounded-xl border border-border bg-background p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-foreground">
                Equity Curve
              </h3>

              <p className="mt-1 text-xs text-muted">
                Portfolio value throughout
                the backtest.
              </p>
            </div>

            <BacktestEquityChart
              points={
                result.equityCurve
              }
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </p>

      <p className="mt-2 text-xl font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function formatCurrency(
  value: number,
): string {
  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    },
  ).format(value);
}

function formatPercent(
  value: number,
): string {
  return `${(value * 100).toFixed(2)}%`;
}

function formatNumber(
  value: number,
): string {
  if (!Number.isFinite(value)) {
    return "∞";
  }

  return value.toFixed(2);
}