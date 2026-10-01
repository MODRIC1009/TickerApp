"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type MarketQuote = {
  symbol: string;
  price: number | null;
  changePercent: number | null;
  currency: string;
  timestamp?: string | null;
};

type Market = {
  symbol: string;
  name: string;
  region: string;
  code: string;
};

const markets: Market[] = [
  {
    symbol: "SPX",
    name: "S&P 500",
    region: "United States",
    code: "US",
  },
  {
    symbol: "NDX",
    name: "Nasdaq 100",
    region: "United States",
    code: "US",
  },
  {
    symbol: "NSEI",
    name: "NIFTY 50",
    region: "India",
    code: "IN",
  },
  {
    symbol: "FTSE",
    name: "FTSE 100",
    region: "United Kingdom",
    code: "GB",
  },
  {
    symbol: "N225",
    name: "Nikkei 225",
    region: "Japan",
    code: "JP",
  },
];

type QuoteResponse = {
  quote?: {
    symbol?: string;
    price?: number;
    changePercent?: number;
    currency?: string;
    timestamp?: string;
  };
};

function formatPrice(
  price: number | null,
  currency: string,
) {
  if (
    price === null ||
    !Number.isFinite(price)
  ) {
    return "—";
  }

  const prefix =
    currency === "USD"
      ? "$"
      : currency === "INR"
        ? "₹"
        : currency === "GBP"
          ? "£"
          : currency === "JPY"
            ? "¥"
            : currency === "EUR"
              ? "€"
              : "";

  return `${prefix}${price.toLocaleString(
    "en-US",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    },
  )}`;
}

function formatChange(
  change: number | null,
) {
  if (
    change === null ||
    !Number.isFinite(change)
  ) {
    return "—";
  }

  return `${change > 0 ? "+" : ""}${change.toFixed(
    2,
  )}%`;
}

function getChangeClass(
  change: number | null,
) {
  if (
    change === null ||
    change === 0
  ) {
    return "text-muted";
  }

  return change > 0
    ? "text-accent"
    : "text-negative";
}

function getChangeBarClass(
  change: number | null,
) {
  if (
    change === null ||
    change === 0
  ) {
    return "bg-border";
  }

  return change > 0
    ? "bg-accent"
    : "bg-negative";
}

function getFlag(code: string) {
  const flags: Record<
    string,
    string
  > = {
    US: "US",
    IN: "IN",
    GB: "GB",
    JP: "JP",
  };

  return flags[code] ?? code;
}

function formatUpdateTime(
  timestamp?: string | null,
) {
  if (!timestamp) {
    return null;
  }

  const date = new Date(timestamp);

  if (
    Number.isNaN(date.getTime())
  ) {
    return null;
  }

  return date.toLocaleTimeString(
    "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

function getMagnitudeWidth(
  change: number | null,
) {
  if (
    change === null ||
    !Number.isFinite(change) ||
    change === 0
  ) {
    return "0%";
  }

  return `${Math.min(
    100,
    Math.max(
      8,
      Math.abs(change) * 12,
    ),
  )}%`;
}

export function MarketOverview() {
  const [quotes, setQuotes] =
    useState<
      Record<string, MarketQuote>
    >({});

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadMarkets() {
      try {
        setError(false);

        const responses =
          await Promise.all(
            markets.map(
              async (market) => {
                try {
                  const response =
                    await fetch(
                      `/api/market-data/quote?symbol=${encodeURIComponent(
                        market.symbol,
                      )}`,
                      {
                        cache: "no-store",
                      },
                    );

                  if (!response.ok) {
                    return null;
                  }

                  const payload =
                    (await response.json()) as QuoteResponse;

                  if (
                    !payload.quote
                  ) {
                    return null;
                  }

                  return {
                    symbol:
                      market.symbol,
                    price:
                      payload.quote
                        .price ?? null,
                    changePercent:
                      payload.quote
                        .changePercent ??
                      null,
                    currency:
                      payload.quote
                        .currency ??
                      "USD",
                    timestamp:
                      payload.quote
                        .timestamp ??
                      null,
                  };
                } catch {
                  return null;
                }
              },
            ),
          );

        const nextQuotes: Record<
          string,
          MarketQuote
        > = {};

        responses.forEach(
          (quote, index) => {
            if (!quote) {
              return;
            }

            const market =
              markets[index];

            if (market) {
              nextQuotes[
                market.symbol
              ] = quote;
            }
          },
        );

        if (!cancelled) {
          setQuotes(nextQuotes);
          setError(
            Object.keys(nextQuotes)
              .length === 0,
          );
        }
      } catch {
        if (!cancelled) {
          setQuotes({});
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadMarkets();

    const interval =
      window.setInterval(
        loadMarkets,
        60_000,
      );

    return () => {
      cancelled = true;
      window.clearInterval(
        interval,
      );
    };
  }, []);

  const marketStats = useMemo(() => {
    const available =
      markets
        .map(
          (market) =>
            quotes[market.symbol],
        )
        .filter(
          (
            quote,
          ): quote is MarketQuote =>
            Boolean(quote),
        );

    const advancing =
      available.filter(
        (quote) =>
          (quote.changePercent ??
            0) > 0,
      ).length;

    const declining =
      available.filter(
        (quote) =>
          (quote.changePercent ??
            0) < 0,
      ).length;

    return {
      available: available.length,
      advancing,
      declining,
      unchanged:
        available.length -
        advancing -
        declining,
    };
  }, [quotes]);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/80 shadow-[0_20px_60px_rgba(0,0,0,0.16)] backdrop-blur-xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/[0.045] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/3 h-40 w-40 rounded-full bg-info/[0.025] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 spatial-grid opacity-[0.16]"
      />

      <div className="relative border-b border-border px-5 py-5 sm:px-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                Global Markets
              </span>

              <span
                aria-hidden="true"
                className={`h-1.5 w-1.5 rounded-full ${
                  error
                    ? "bg-warning"
                    : "bg-accent shadow-[0_0_8px_rgba(53,208,127,0.55)]"
                }`}
              />
            </div>

            <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">
              Market pulse
            </h2>

            <p className="mt-1 max-w-xl text-xs leading-5 text-muted">
              Cross-market snapshot across
              major equity benchmarks.
              Values are provider-sourced
              and may be delayed or
              unavailable depending on
              coverage.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-border-subtle bg-background/50 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.13em] text-muted">
                Coverage
              </p>

              <p className="mt-1 font-mono text-xs font-medium text-foreground">
                {marketStats.available}/
                {markets.length}
              </p>
            </div>

            <div className="rounded-xl border border-border-subtle bg-background/50 px-3 py-2">
              <p className="text-[9px] uppercase tracking-[0.13em] text-muted">
                Breadth
              </p>

              <p className="mt-1 font-mono text-xs font-medium">
                <span className="text-accent">
                  {marketStats.advancing}
                </span>

                <span className="mx-1 text-muted">
                  /
                </span>

                <span className="text-negative">
                  {marketStats.declining}
                </span>

                {marketStats.unchanged >
                0 ? (
                  <>
                    <span className="mx-1 text-muted">
                      /
                    </span>

                    <span className="text-muted">
                      {marketStats.unchanged}
                    </span>
                  </>
                ) : null}
              </p>
            </div>

            <span
              className={`hidden rounded-xl border px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.12em] sm:block ${
                error
                  ? "border-warning/20 bg-warning/[0.05] text-warning"
                  : "border-accent/15 bg-accent/[0.05] text-accent"
              }`}
            >
              {error
                ? "Limited data"
                : "Live layer"}
            </span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="relative grid gap-px bg-border-subtle sm:grid-cols-2 xl:grid-cols-5">
          {markets.map(
            (market) => (
              <div
                key={market.symbol}
                className="min-h-44 bg-surface p-5"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="h-3 w-14 animate-pulse rounded bg-surface-hover" />
                    <div className="h-2.5 w-24 animate-pulse rounded bg-surface-hover" />
                  </div>

                  <div className="h-6 w-8 animate-pulse rounded-md bg-surface-hover" />
                </div>

                <div className="mt-10 space-y-2">
                  <div className="ml-auto h-6 w-24 animate-pulse rounded bg-surface-hover" />
                  <div className="ml-auto h-3 w-14 animate-pulse rounded bg-surface-hover" />
                </div>

                <div className="mt-5 h-1 animate-pulse rounded bg-surface-hover" />
              </div>
            ),
          )}
        </div>
      ) : (
        <div className="relative grid gap-px bg-border-subtle sm:grid-cols-2 xl:grid-cols-5">
          {markets.map(
            (market) => {
              const quote =
                quotes[
                  market.symbol
                ];

              const change =
                quote?.changePercent ??
                null;

              const updateTime =
                formatUpdateTime(
                  quote?.timestamp,
                );

              const changeWidth =
                getMagnitudeWidth(
                  change,
                );

              const isPositive =
                change !== null &&
                change > 0;

              const isNegative =
                change !== null &&
                change < 0;

              return (
                <Link
                  key={market.symbol}
                  href={`/stocks/${encodeURIComponent(
                    market.symbol,
                  )}`}
                  className="group relative min-h-44 overflow-hidden bg-surface p-5 transition-all duration-300 hover:bg-surface-hover focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60"
                >
                  <div
                    aria-hidden="true"
                    className={`absolute inset-x-0 top-0 h-px origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100 ${
                      isNegative
                        ? "bg-negative/50"
                        : "bg-accent/50"
                    }`}
                  />

                  <div
                    aria-hidden="true"
                    className={`absolute bottom-0 left-0 h-0.5 transition-all duration-500 ${
                      change === null
                        ? "w-0"
                        : isPositive
                          ? "bg-accent/50"
                          : "bg-negative/50"
                    }`}
                    style={{
                      width:
                        change === null
                          ? "0%"
                          : changeWidth,
                    }}
                  />

                  <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                      isNegative
                        ? "bg-negative/[0.035]"
                        : "bg-accent/[0.035]"
                    }`}
                  />

                  <div className="relative flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {market.symbol}
                        </span>

                        <span className="rounded border border-border-subtle px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.08em] text-muted">
                          {getFlag(
                            market.code,
                          )}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-[10px] text-muted">
                        {market.name}
                      </p>
                    </div>

                    <span
                      aria-hidden="true"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border-subtle bg-background/40 text-[10px] text-muted transition-all duration-300 group-hover:border-accent/20 group-hover:bg-accent/[0.05] group-hover:text-accent"
                    >
                      ↗
                    </span>
                  </div>

                  <div className="relative mt-8">
                    <p className="font-mono text-xl font-semibold tracking-tight text-foreground">
                      {quote
                        ? formatPrice(
                            quote.price,
                            quote.currency,
                          )
                        : "—"}
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-3">
                      <span
                        className={`font-mono text-xs font-medium ${getChangeClass(
                          change,
                        )}`}
                      >
                        {formatChange(
                          change,
                        )}
                      </span>

                      {updateTime ? (
                        <span className="font-mono text-[9px] text-muted">
                          {updateTime}
                        </span>
                      ) : (
                        <span className="text-[9px] text-muted">
                          Unavailable
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative mt-5 flex items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-background">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${getChangeBarClass(
                          change,
                        )}`}
                        style={{
                          width:
                            changeWidth,
                        }}
                      />
                    </div>

                    <span className="text-[8px] uppercase tracking-[0.1em] text-muted">
                      {market.region}
                    </span>
                  </div>

                  <div className="relative mt-3 flex items-center justify-between">
                    <span className="text-[8px] uppercase tracking-[0.1em] text-muted">
                      Benchmark
                    </span>

                    <span
                      className={`font-mono text-[8px] uppercase tracking-[0.08em] ${
                        quote
                          ? "text-accent"
                          : "text-muted"
                      }`}
                    >
                      {quote
                        ? "Covered"
                        : "No data"}
                    </span>
                  </div>
                </Link>
              );
            },
          )}
        </div>
      )}

      <div className="relative flex flex-col gap-2 border-t border-border px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-[10px] leading-4 text-muted">
          Refreshes automatically every
          60 seconds while this workspace
          is open.
        </p>

        <p className="text-[9px] uppercase tracking-[0.1em] text-muted">
          Provider coverage determines
          availability
        </p>
      </div>
    </section>
  );
}