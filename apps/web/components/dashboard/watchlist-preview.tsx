"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type WatchlistQuote = {
  symbol: string;
  name: string;
  price: number | null;
  changePercent: number | null;
  currency: string;
  timestamp: string | null;
};

type WatchlistItem = {
  symbol: string;
  name: string;
  region: string;
};

const watchlist: WatchlistItem[] = [
  {
    symbol: "AAPL",
    name: "Apple",
    region: "US",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA",
    region: "US",
  },
  {
    symbol: "MSFT",
    name: "Microsoft",
    region: "US",
  },
  {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    region: "IN",
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
): string {
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
): string {
  if (
    change === null ||
    !Number.isFinite(change)
  ) {
    return "—";
  }

  return `${change > 0 ? "+" : ""}${change.toFixed(2)}%`;
}

function getChangeClass(
  change: number | null,
): string {
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

function getChangeBarWidth(
  change: number | null,
): number {
  if (
    change === null ||
    !Number.isFinite(change)
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(8, Math.abs(change) * 12),
  );
}

function formatTimestamp(
  timestamp: string | null,
): string {
  if (!timestamp) {
    return "No timestamp";
  }

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "Timestamp unavailable";
  }

  return date.toLocaleTimeString(
    "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    },
  );
}

function getInitials(
  symbol: string,
): string {
  return symbol.slice(0, 2);
}

export function WatchlistPreview() {
  const [quotes, setQuotes] =
    useState<Record<string, WatchlistQuote>>(
      {},
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(false);

  const [lastUpdated, setLastUpdated] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWatchlist() {
      try {
        setError(false);

        const results =
          await Promise.all(
            watchlist.map(
              async (item) => {
                try {
                  const response =
                    await fetch(
                      `/api/market-data/quote?symbol=${encodeURIComponent(
                        item.symbol,
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

                  if (!payload.quote) {
                    return null;
                  }

                  return {
                    symbol: item.symbol,
                    name: item.name,
                    price:
                      payload.quote.price ??
                      null,
                    changePercent:
                      payload.quote
                        .changePercent ??
                      null,
                    currency:
                      payload.quote.currency ??
                      "USD",
                    timestamp:
                      payload.quote.timestamp ??
                      null,
                  };
                } catch {
                  return null;
                }
              },
            ),
          );

        if (cancelled) {
          return;
        }

        const nextQuotes: Record<
          string,
          WatchlistQuote
        > = {};

        results.forEach((quote) => {
          if (quote) {
            nextQuotes[quote.symbol] =
              quote;
          }
        });

        setQuotes(nextQuotes);

        setError(
          Object.keys(nextQuotes)
            .length === 0,
        );

        setLastUpdated(
          new Date().toISOString(),
        );
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

    void loadWatchlist();

    const interval =
      window.setInterval(
        loadWatchlist,
        60_000,
      );

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const availableCount =
    useMemo(
      () =>
        watchlist.filter(
          (item) =>
            Boolean(quotes[item.symbol]),
        ).length,
      [quotes],
    );

  const advancingCount =
    useMemo(
      () =>
        watchlist.filter(
          (item) =>
            (quotes[item.symbol]
              ?.changePercent ??
              0) > 0,
        ).length,
      [quotes],
    );

  const decliningCount =
    useMemo(
      () =>
        watchlist.filter(
          (item) =>
            (quotes[item.symbol]
              ?.changePercent ??
              0) < 0,
        ).length,
      [quotes],
    );

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border bg-surface/80 shadow-[0_16px_50px_rgba(0,0,0,0.12)] backdrop-blur-xl">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-accent/[0.035] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-info/[0.025] blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 spatial-grid opacity-[0.12]"
      />

      <div className="relative flex flex-col gap-4 border-b border-border px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                error
                  ? "bg-warning"
                  : "bg-accent shadow-[0_0_9px_rgba(53,208,127,0.5)]"
              }`}
            />

            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted">
              Watchlist
            </p>
          </div>

          <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-foreground">
            Selected securities
          </h2>

          <p className="mt-1 text-[11px] text-muted">
            Live quote snapshot across your tracked names.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="rounded-lg border border-border-subtle bg-background/40 px-2.5 py-1.5 text-right">
            <p className="font-mono text-[10px] font-semibold text-foreground">
              {availableCount}/{watchlist.length}
            </p>

            <p className="text-[8px] uppercase tracking-[0.12em] text-muted">
              Available
            </p>
          </div>

          <div className="hidden rounded-lg border border-border-subtle bg-background/40 px-2.5 py-1.5 text-right md:block">
            <p className="font-mono text-[10px] font-semibold text-accent">
              {advancingCount}
              <span className="mx-1 text-muted">
                /
              </span>
              <span className="text-negative">
                {decliningCount}
              </span>
            </p>

            <p className="text-[8px] uppercase tracking-[0.12em] text-muted">
              Breadth
            </p>
          </div>

          <span
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] ${
              error
                ? "border-warning/20 bg-warning/[0.05] text-warning"
                : "border-accent/15 bg-accent/[0.05] text-accent"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                error
                  ? "bg-warning"
                  : "bg-accent shadow-[0_0_8px_rgba(53,208,127,0.45)]"
              }`}
              aria-hidden="true"
            />

            {error
              ? "Unavailable"
              : "Live"}
          </span>
        </div>
      </div>

      <div className="relative divide-y divide-border-subtle">
        {loading
          ? watchlist.map((item) => (
              <div
                key={item.symbol}
                className="flex items-center justify-between gap-5 px-5 py-4.5"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="h-9 w-9 animate-pulse rounded-xl bg-surface-hover" />

                  <div className="space-y-2">
                    <div className="h-3 w-14 animate-pulse rounded bg-surface-hover" />
                    <div className="h-2.5 w-24 animate-pulse rounded bg-surface-hover" />
                  </div>
                </div>

                <div className="space-y-2 text-right">
                  <div className="ml-auto h-3 w-20 animate-pulse rounded bg-surface-hover" />
                  <div className="ml-auto h-2.5 w-12 animate-pulse rounded bg-surface-hover" />
                </div>
              </div>
            ))
          : watchlist.map((item) => {
              const quote =
                quotes[item.symbol];

              const change =
                quote?.changePercent ??
                null;

              const changeWidth =
                getChangeBarWidth(change);

              const isPositive =
                change !== null &&
                change > 0;

              const isNegative =
                change !== null &&
                change < 0;

              return (
                <Link
                  key={item.symbol}
                  href={`/stocks/${encodeURIComponent(
                    item.symbol,
                  )}`}
                  className="group/row relative flex items-center justify-between gap-4 px-5 py-4 transition-all duration-200 hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60 sm:gap-5"
                >
                  <div
                    aria-hidden="true"
                    className={`absolute bottom-0 left-5 right-5 h-px origin-left scale-x-0 transition-transform duration-300 group-hover/row:scale-x-100 ${
                      isNegative
                        ? "bg-negative/20"
                        : "bg-accent/20"
                    }`}
                  />

                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border bg-background/50 font-mono text-[10px] font-semibold transition-all duration-200 ${
                        quote
                          ? "border-border-subtle text-muted group-hover/row:border-accent/20 group-hover/row:text-accent"
                          : "border-warning/15 text-warning"
                      }`}
                    >
                      {quote ? (
                        <span
                          aria-hidden="true"
                          className="absolute right-1 top-1 h-1 w-1 rounded-full bg-accent"
                        />
                      ) : null}

                      {getInitials(
                        item.symbol,
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-semibold text-foreground">
                          {item.symbol}
                        </span>

                        <span className="rounded-md border border-border-subtle px-1.5 py-0.5 text-[7px] font-medium uppercase tracking-[0.1em] text-muted">
                          {item.region}
                        </span>
                      </div>

                      <div className="mt-0.5 truncate text-[10px] text-muted">
                        {item.name}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-4 sm:gap-5">
                    <div className="hidden text-right sm:block">
                      <div className="font-mono text-[9px] text-muted">
                        {quote
                          ? formatTimestamp(
                              quote.timestamp,
                            )
                          : "—"}
                      </div>

                      <div className="mt-1 text-[8px] uppercase tracking-[0.1em] text-muted">
                        Provider time
                      </div>
                    </div>

                    <div className="w-24 text-right sm:w-28">
                      <div className="font-mono text-sm font-semibold tracking-tight text-foreground">
                        {quote
                          ? formatPrice(
                              quote.price,
                              quote.currency,
                            )
                          : "—"}
                      </div>

                      <div
                        className={`mt-1 font-mono text-xs font-medium ${getChangeClass(
                          change,
                        )}`}
                      >
                        {formatChange(change)}
                      </div>

                      {change !== null ? (
                        <div className="mt-1.5 ml-auto h-0.5 w-16 overflow-hidden rounded-full bg-border-subtle sm:w-20">
                          <div
                            className={`h-full origin-right rounded-full ${
                              isPositive
                                ? "bg-accent"
                                : isNegative
                                  ? "bg-negative"
                                  : "bg-muted"
                            }`}
                            style={{
                              width: `${changeWidth}%`,
                            }}
                          />
                        </div>
                      ) : null}
                    </div>

                    <span
                      aria-hidden="true"
                      className="hidden h-7 w-7 items-center justify-center rounded-lg border border-border-subtle bg-background/40 text-[10px] text-muted transition-all duration-200 group-hover/row:border-accent/20 group-hover/row:bg-accent/[0.05] group-hover/row:text-accent sm:flex"
                    >
                      ↗
                    </span>
                  </div>
                </Link>
              );
            })}
      </div>

      <div className="relative flex flex-col gap-1.5 border-t border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[9px] leading-4 text-muted">
          Prices refresh automatically every 60 seconds.
          Freshness depends on the configured provider.
        </p>

        <p className="shrink-0 font-mono text-[9px] text-muted">
          {lastUpdated
            ? `UI ${formatTimestamp(lastUpdated)}`
            : "Awaiting update"}
        </p>
      </div>
    </section>
  );
}