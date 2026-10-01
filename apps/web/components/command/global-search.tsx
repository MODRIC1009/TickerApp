"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

import type { Instrument } from "@tickerapp/shared";

import {
  searchMarketDataInstruments,
  type MarketDataSearchResult,
} from "@/lib/market-data-search-client";

const SEARCH_DEBOUNCE_MS = 220;

function instrumentKey(
  instrument: Instrument,
  index: number,
): string {
  const exchange = instrument.exchangeId ?? "unknown";
  const country = instrument.countryCode ?? "unknown";
  return `${instrument.symbol}-${exchange}-${country}-${index}`;
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Instrument[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    const currentRequestId = ++requestId.current;
    setLoading(true);

    const timeout = window.setTimeout(() => {
      void searchMarketDataInstruments(normalizedQuery)
        .then((response: MarketDataSearchResult) => {
          if (currentRequestId !== requestId.current) {
            return;
          }

          setResults(response.instruments ?? []);
        })
        .catch(() => {
          if (currentRequestId !== requestId.current) {
            return;
          }

          setResults([]);
        })
        .finally(() => {
          if (currentRequestId === requestId.current) {
            setLoading(false);
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [query]);

  const visibleResults = useMemo(
    () => results.slice(0, 20),
    [results],
  );

  const handleClear = () => {
    requestId.current += 1;
    setQuery("");
    setResults([]);
    setLoading(false);
    setShowDropdown(false);
  };

  return (
    <div className="relative w-full">
      <div className="group relative">
        <svg
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors duration-200 group-focus-within:text-accent"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>

        <input
          id="global-stock-search"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => {
            if (query.trim().length >= 2) {
              setShowDropdown(true);
            }
          }}
          placeholder="Search stocks, ETFs, indices..."
          autoComplete="off"
          spellCheck={false}
          aria-controls="global-search-results"
          className="h-10 w-full rounded-xl border border-border bg-surface/75 pl-10 pr-11 text-sm text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.025)] outline-none backdrop-blur-md transition-all duration-200 placeholder:text-muted hover:border-border-strong focus:border-accent/30 focus:bg-surface focus:ring-2 focus:ring-accent/10"
        />

        {loading ? (
          <span
            className="absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin rounded-full border-2 border-border border-t-accent"
            aria-label="Searching"
            role="status"
          />
        ) : query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
          >
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        ) : null}
      </div>

      {showDropdown && query.trim().length >= 2 ? (
        <div
          id="global-search-results"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-50 overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
        >
          {loading ? (
            <div className="px-4 py-5 text-sm text-muted">
              Searching market data…
            </div>
          ) : visibleResults.length === 0 ? (
            <div className="px-4 py-5 text-sm text-muted">
              No matching instruments found.
            </div>
          ) : (
            <div className="max-h-[min(32rem,70vh)] overflow-y-auto p-2">
              {visibleResults.map((instrument, index) => (
                <Link
                  key={instrumentKey(instrument, index)}
                  href={`/stocks/${encodeURIComponent(instrument.symbol)}`}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {instrument.symbol}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {instrument.name}
                    </p>
                  </div>
                  <div className="ml-4 shrink-0 text-right">
                    <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                      {instrument.exchangeId ?? "Unknown exchange"}
                    </p>
                    <p className="text-xs text-muted">
                      {instrument.currency ?? instrument.countryCode ?? ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="border-t border-border-subtle px-4 py-2.5">
            <p className="text-[9px] leading-4 text-muted">
              Search results depend on the configured market-data provider and its coverage.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
