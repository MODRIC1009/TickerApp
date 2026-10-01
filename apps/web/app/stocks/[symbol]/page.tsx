import Link from "next/link";

import { RiskScorePanel } from "@/components/analytics/risk-score-panel";
import { PriceHistoryChart } from "@/components/market-data/price-history-chart";
import { StockResearchPanel } from "@/components/research/stock-research-panel";
import { StrategyLab } from "@/components/strategy/strategy-lab";
import { getMarketDataService } from "@/lib/market-data";
import { getRiskAnalysis } from "@/lib/risk-service";

import type { StrategyInput } from "@tickerapp/analytics";
import type {
  Instrument,
  OHLCVBar,
  Quote,
} from "@tickerapp/shared";

interface StockPageProps {
  params: Promise<{
    symbol: string;
  }>;
}

function formatSymbol(symbol: string) {
  return decodeURIComponent(symbol)
    .trim()
    .toUpperCase();
}

function formatNumber(
  value: number | undefined,
  maximumFractionDigits = 2,
) {
  if (
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "—";
  }

  return value.toLocaleString("en-US", {
    maximumFractionDigits,
  });
}

function formatPrice(
  price: number,
  currency: string,
) {
  const symbol =
    currency === "USD"
      ? "$"
      : currency === "INR"
        ? "₹"
        : currency === "EUR"
          ? "€"
          : currency === "GBP"
            ? "£"
            : "";

  return `${symbol}${formatNumber(price)}`;
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function getChangeClass(value: number) {
  if (value > 0) {
    return "text-accent";
  }

  if (value < 0) {
    return "text-negative";
  }

  return "text-muted";
}

function formatUpdatedAt(
  timestamp: string,
) {
  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Update time unavailable";
  }

  return `Updated ${date.toLocaleString(
    "en-US",
    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  )}`;
}

function Metric({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </p>

      <p className="mt-2 font-mono text-lg font-semibold text-foreground">
        {value}
      </p>

      {description ? (
        <p className="mt-1 text-[11px] leading-4 text-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function ScoreRow({
  label,
  value,
}: {
  label: string;
  value?: number;
}) {
  const valid =
    value !== undefined &&
    Number.isFinite(value);

  const boundedValue = valid
    ? Math.max(
        0,
        Math.min(100, value),
      )
    : 0;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-strong">
          {label}
        </span>

        <span className="font-mono text-foreground">
          {valid
            ? `${value.toFixed(0)}/100`
            : "—"}
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-background">
        {valid ? (
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{
              width: `${boundedValue}%`,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

export default async function StockPage({
  params,
}: StockPageProps) {
  const { symbol: rawSymbol } = await params;
  const symbol = formatSymbol(rawSymbol);

  const marketDataService =
    getMarketDataService();

  let instrument: Instrument | null = null;
  let quote: Quote | null = null;
  let historicalBars: OHLCVBar[] = [];

  const today = new Date();

  const endDate = today
    .toISOString()
    .slice(0, 10);

  const start = new Date(today);

  start.setFullYear(
    start.getFullYear() - 1,
  );

  const startDate = start
    .toISOString()
    .slice(0, 10);

  try {
    instrument =
      await marketDataService.getInstrument(
        symbol,
      );
  } catch {
    instrument = null;
  }

  try {
    quote =
      await marketDataService.getQuote(
        symbol,
      );
  } catch {
    quote = null;
  }

  try {
    historicalBars =
      await marketDataService.getHistoricalPrices({
        symbol,
        startDate,
        endDate,
        interval: "1d",
      });
  } catch {
    historicalBars = [];
  }

  let riskAnalysis: Awaited<
    ReturnType<typeof getRiskAnalysis>
  > | null = null;

  let riskError: string | null = null;

  try {
    riskAnalysis =
      await getRiskAnalysis(symbol);
  } catch (error) {
    riskError =
      error instanceof Error
        ? error.message
        : "Unable to calculate quantitative risk.";
  }

  const displayName =
    instrument?.name ?? symbol;

  const exchange =
    instrument?.exchangeId ?? "—";

  const country =
    instrument?.countryCode ?? "—";

  const currency =
    instrument?.currency ??
    "USD";

  const strategyPrices: StrategyInput[] =
    historicalBars.map((bar) => ({
      timestamp: bar.timestamp,
      price: bar.close,
    }));

  const marketCap =
    quote?.marketCap;

  const changePercent =
    quote?.changePercent ?? 0;

  const valuationMetrics = {
    marketCap,
    priceToEarnings:
      undefined as
        | number
        | undefined,
  };

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-4">
        <Link
          href="/"
          className="text-xs text-muted transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
        >
          ← Back to overview
        </Link>
      </div>

      <section className="rounded-xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-3xl font-semibold tracking-tight text-foreground">
                {symbol}
              </span>

              <span className="rounded-md border border-border-subtle bg-background px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted">
                {exchange}
              </span>

              {quote ? (
                <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-accent">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-accent"
                    aria-hidden="true"
                  />
                  Live quote
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-warning">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-warning"
                    aria-hidden="true"
                  />
                  Quote unavailable
                </span>
              )}
            </div>

            <h1 className="mt-2 text-lg font-medium text-muted-strong">
              {displayName}
            </h1>

            <p className="mt-2 text-xs text-muted">
              {country} · {currency}
            </p>
          </div>

          <div className="lg:text-right">
            {quote ? (
              <>
                <div className="font-mono text-3xl font-semibold text-foreground">
                  {formatPrice(
                    quote.price,
                    currency,
                  )}
                </div>

                <div
                  className={`mt-2 font-mono text-sm ${getChangeClass(
                    quote.changePercent,
                  )}`}
                >
                  {formatPercent(
                    quote.changePercent,
                  )}{" "}
                  today
                </div>

                <p className="mt-2 text-[11px] text-muted">
                  {formatUpdatedAt(
                    quote.timestamp,
                  )}
                </p>
              </>
            ) : (
              <>
                <div className="font-mono text-3xl font-semibold text-muted">
                  —
                </div>

                <p className="mt-2 text-xs text-muted">
                  Current quote unavailable
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          label="Market Cap"
          value={
            marketCap !== undefined
              ? formatNumber(
                  marketCap,
                )
              : "—"
          }
          description={
            marketCap !== undefined
              ? currency
              : "Not supplied by provider"
          }
        />

        <Metric
          label="Daily Change"
          value={
            quote
              ? formatPercent(
                  changePercent,
                )
              : "—"
          }
          description={
            quote
              ? `${formatNumber(
                  quote.change,
                )} ${currency}`
              : "Live quote unavailable"
          }
        />

        <Metric
          label="Volume"
          value={
            quote
              ? formatNumber(
                  quote.volume,
                  0,
                )
              : "—"
          }
          description="Reported trading volume"
        />

        <Metric
          label="Currency"
          value={currency}
          description={`${country} listing`}
        />
      </section>

      <section className="mt-6">
        <RiskScorePanel
          result={
            riskAnalysis?.result ?? null
          }
          provenance={
            riskAnalysis?.provenance ?? null
          }
          loading={false}
          error={riskError}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                Price History
              </h2>

              <p className="mt-1 text-xs text-muted">
                One year of daily historical prices
              </p>
            </div>

            <span className="hidden rounded-md border border-border-subtle bg-background px-2 py-1 text-[9px] font-medium uppercase tracking-[0.1em] text-muted sm:block">
              {historicalBars.length > 0
                ? `${historicalBars.length} sessions`
                : "No history"}
            </span>
          </div>

          {historicalBars.length > 0 ? (
            <PriceHistoryChart
              bars={historicalBars}
            />
          ) : (
            <div className="flex min-h-64 items-center justify-center px-6 text-center">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Historical data unavailable
                </p>

                <p className="mt-1 max-w-sm text-xs leading-5 text-muted">
                  The configured market-data
                  provider did not return
                  historical prices for this
                  security.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Research Snapshot
            </h2>

            <p className="mt-1 text-xs text-muted">
              Provider-backed metrics only
            </p>
          </div>

          <div className="space-y-4 p-5">
            <ScoreRow label="Quality" />

            <ScoreRow label="Growth" />

            <ScoreRow
              label="Value"
              value={
                valuationMetrics.priceToEarnings !==
                undefined
                  ? Math.max(
                      0,
                      100 -
                        valuationMetrics.priceToEarnings *
                          2,
                    )
                  : undefined
              }
            />

            <ScoreRow label="Momentum" />

            <ScoreRow label="Financial Health" />

            <ScoreRow
              label="Risk"
              value={
                riskAnalysis
                  ? Math.max(
                      0,
                      100 -
                        riskAnalysis.result.score,
                    )
                  : undefined
              }
            />

            <div className="border-t border-border-subtle pt-4">
              <p className="text-[11px] leading-5 text-muted">
                Advanced factor scores require
                financial fundamentals and
                technical datasets. They are
                intentionally not fabricated when
                the configured provider does not
                supply them.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6">
        <StrategyLab
          symbol={symbol}
          prices={strategyPrices}
        />
      </section>

      <section className="mt-6">
        <StockResearchPanel
          instrument={{
            symbol,
            name: displayName,
            exchangeId: exchange,
            countryCode: country,
            currency,
            assetClass: "equity",
          }}
        />
      </section>
    </div>
  );
}