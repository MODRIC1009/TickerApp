"use client";

import {
  useMemo,
  useState,
} from "react";

import type { Instrument } from "@tickerapp/shared";

import { StockResearchPanel } from "./stock-research-panel";

const popularSymbols = [
  "AAPL",
  "NVDA",
  "MSFT",
  "RELIANCE",
];

function assetClassLabel(
  assetClass: Instrument["assetClass"],
) {
  switch (assetClass) {
    case "equity":
      return "Equity";
    case "etf":
      return "ETF";
    case "adr":
      return "ADR";
    case "reit":
      return "REIT";
    case "fund":
      return "Fund";
    default:
      return assetClass;
  }
}

export function ResearchWorkspace() {
  const [symbol, setSymbol] =
    useState("AAPL");

  const [instrument, setInstrument] =
    useState<Instrument | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const normalizedSymbol = useMemo(
    () => symbol.trim().toUpperCase(),
    [symbol],
  );

  async function researchSecurity(
    requestedSymbol?: string,
  ) {
    const target = (
      requestedSymbol ??
      normalizedSymbol
    )
      .trim()
      .toUpperCase();

    if (!target) {
      setError(
        "Enter a ticker symbol to begin.",
      );
      setInstrument(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/market-data/instrument?symbol=${encodeURIComponent(
          target,
        )}`,
        {
          cache: "no-store",
        },
      );

      const payload =
        (await response.json()) as {
          instrument?: Instrument;
          error?: string;
        };

      if (
        !response.ok ||
        !payload.instrument
      ) {
        throw new Error(
          payload.error ??
            `Security "${target}" could not be found.`,
        );
      }

      setSymbol(
        payload.instrument.symbol,
      );

      setInstrument(
        payload.instrument,
      );
    } catch (requestError) {
      setInstrument(null);

      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to retrieve this security.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="glass-panel-elevated relative overflow-hidden rounded-2xl">
        <div className="spatial-grid pointer-events-none absolute inset-0 opacity-15" />

        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/5 blur-3xl" />

        <div className="relative border-b border-border-subtle px-5 py-5 sm:px-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_currentColor]" />

                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Security Research
                </p>
              </div>

              <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-foreground">
                Research a security
              </h2>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
                Search the global security universe to load market
                identity, live context, quantitative analysis, and
                AI-assisted research.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-accent/20 bg-accent-muted px-2.5 py-1.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-accent">
                Intelligence terminal
              </span>

              <span className="rounded-full border border-border-subtle bg-surface-hover px-2.5 py-1.5 text-[9px] font-medium uppercase tracking-[0.12em] text-muted">
                Live data
              </span>
            </div>
          </div>
        </div>

        <div className="relative p-5 sm:p-6">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void researchSecurity();
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <div className="relative min-w-0 flex-1">
              <label
                htmlFor="research-symbol"
                className="sr-only"
              >
                Ticker symbol
              </label>

              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-xs text-muted">
                  /
                </span>

                <input
                  id="research-symbol"
                  value={symbol}
                  onChange={(event) =>
                    setSymbol(
                      event.target.value.toUpperCase(),
                    )
                  }
                  placeholder="Enter ticker, e.g. AAPL"
                  autoComplete="off"
                  spellCheck={false}
                  className="h-12 w-full rounded-xl border border-border bg-background pl-8 pr-4 font-mono text-sm text-foreground outline-none transition-all placeholder:text-muted focus:border-accent/50 focus:ring-2 focus:ring-accent/10"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-12 rounded-xl border border-accent/40 bg-accent-muted px-6 text-sm font-semibold text-accent transition-all hover:border-accent hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                  Loading
                </span>
              ) : (
                "Research security"
              )}
            </button>
          </form>

          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between gap-4">
              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted">
                Quick research
              </p>

              <p className="hidden text-[9px] uppercase tracking-[0.12em] text-muted sm:block">
                Select a security
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {popularSymbols.map(
                (popularSymbol) => (
                  <button
                    key={popularSymbol}
                    type="button"
                    onClick={() => {
                      setSymbol(
                        popularSymbol,
                      );

                      void researchSecurity(
                        popularSymbol,
                      );
                    }}
                    disabled={loading}
                    className={`group rounded-xl border px-3 py-2 font-mono text-[10px] font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 disabled:cursor-not-allowed disabled:opacity-60 ${
                      normalizedSymbol ===
                      popularSymbol
                        ? "border-accent/30 bg-accent-muted text-accent"
                        : "border-border-subtle bg-surface-hover text-muted hover:border-border hover:bg-surface hover:text-foreground"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className={`h-1.5 w-1.5 rounded-full transition-colors ${
                          normalizedSymbol ===
                          popularSymbol
                            ? "bg-accent"
                            : "bg-muted group-hover:bg-foreground"
                        }`}
                      />

                      {popularSymbol}
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>

          {instrument ? (
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-border-subtle bg-surface-hover p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-foreground">
                    {instrument.symbol}
                  </span>

                  <span className="rounded-full border border-border-subtle bg-surface px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-muted">
                    {assetClassLabel(
                      instrument.assetClass,
                    )}
                  </span>
                </div>

                <p className="mt-1 truncate text-xs text-muted">
                  {instrument.name}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:min-w-[300px]">
                <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
                    Exchange
                  </p>

                  <p className="mt-1 truncate font-mono text-[10px] font-semibold text-foreground">
                    {instrument.exchangeId}
                  </p>
                </div>

                <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
                    Country
                  </p>

                  <p className="mt-1 font-mono text-[10px] font-semibold text-foreground">
                    {instrument.countryCode}
                  </p>
                </div>

                <div className="rounded-lg border border-border-subtle bg-surface px-3 py-2">
                  <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
                    Currency
                  </p>

                  <p className="mt-1 font-mono text-[10px] font-semibold text-foreground">
                    {instrument.currency}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {error ? (
            <div
              role="alert"
              className="mt-4 flex items-start gap-3 rounded-xl border border-negative/20 bg-negative-muted px-4 py-3"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-negative/30 font-mono text-[10px] font-semibold text-negative">
                !
              </span>

              <div>
                <p className="text-xs font-semibold text-negative">
                  Research request failed
                </p>

                <p className="mt-1 text-[11px] leading-5 text-muted">
                  {error}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {instrument ? (
        <StockResearchPanel
          instrument={instrument}
        />
      ) : (
        <section className="glass-panel-elevated relative overflow-hidden rounded-2xl">
          <div className="spatial-grid pointer-events-none absolute inset-0 opacity-10" />

          <div className="relative grid gap-8 px-6 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16">
            <div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/20 bg-accent-muted font-mono text-xs font-semibold text-accent">
                AI
              </div>

              <p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Intelligence workspace
              </p>

              <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-foreground">
                Research terminal ready
              </h2>

              <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
                Search a security to move from raw market identity into
                a unified research workflow spanning live market data,
                quantitative risk, historical behavior, and AI-assisted
                analysis.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <ResearchCapability
                number="01"
                title="Market context"
                description="Identity, exchange, geography, asset class, and live provider-backed context."
              />

              <ResearchCapability
                number="02"
                title="Quantitative risk"
                description="Volatility, drawdown, systematic risk, liquidity, tail risk, and model drivers."
              />

              <ResearchCapability
                number="03"
                title="AI research"
                description="Structured research workflows built around the selected security and available data."
              />

              <ResearchCapability
                number="04"
                title="Decision context"
                description="Bring market observations and quantitative evidence together without hiding data provenance."
              />
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function ResearchCapability({
  number,
  title,
  description,
}: {
  number: string;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-xl border border-border-subtle bg-surface-hover p-5 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-surface">
      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-[9px] font-semibold tracking-[0.12em] text-muted">
          {number}
        </span>

        <span className="h-1.5 w-1.5 rounded-full bg-border transition-colors group-hover:bg-accent" />
      </div>

      <h3 className="mt-5 text-sm font-semibold text-foreground">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-muted">
        {description}
      </p>
    </div>
  );
}