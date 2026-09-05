"use client";

import { useEffect, useRef, useState } from "react";

interface SearchResult {
  instrument: {
    symbol: string;
    name: string;
    exchangeId: string;
    countryCode: string;
    currency: string;
    assetClass: string;
  };
  score?: number;
}

const defaultSuggestions: SearchResult[] = [
  {
    instrument: {
      symbol: "AAPL",
      name: "Apple Inc.",
      exchangeId: "nasdaq",
      countryCode: "US",
      currency: "USD",
      assetClass: "equity",
    },
  },
  {
    instrument: {
      symbol: "NVDA",
      name: "NVIDIA Corporation",
      exchangeId: "nasdaq",
      countryCode: "US",
      currency: "USD",
      assetClass: "equity",
    },
  },
  {
    instrument: {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      exchangeId: "nasdaq",
      countryCode: "US",
      currency: "USD",
      assetClass: "equity",
    },
  },
  {
    instrument: {
      symbol: "RELIANCE",
      name: "Reliance Industries",
      exchangeId: "nse",
      countryCode: "IN",
      currency: "INR",
      assetClass: "equity",
    },
  },
];

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] =
    useState<SearchResult[]>(defaultSuggestions);
  const [isFocused, setIsFocused] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        document.activeElement !== inputRef.current
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }

      if (event.key === "Escape") {
        setQuery("");
        setResults(defaultSuggestions);
        inputRef.current?.blur();
        setIsFocused(false);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  useEffect(() => {
    const normalizedQuery = query.trim();

    if (normalizedQuery.length < 2) {
  return;
}

    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      try {
        setIsLoading(true);

        const response = await fetch(
          `/api/market-data/search?q=${encodeURIComponent(normalizedQuery)}`,
          {
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error("Search request failed.");
        }

        const data = (await response.json()) as {
          results?: SearchResult[];
        };

        setResults(data.results ?? []);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Global search failed:", error);
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  const showSuggestions = isFocused && (
    isLoading || results.length > 0
  );

  return (
    <div className="relative w-full max-w-xl">
      <div
        className={`flex h-9 items-center rounded-lg border bg-surface px-3 transition-colors ${
          isFocused
            ? "border-accent/50"
            : "border-border hover:border-muted"
        }`}
      >
        <span className="mr-3 text-sm text-muted">⌕</span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setIsFocused(false), 120);
          }}
          placeholder="Search stocks, companies, markets..."
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          aria-label="Search stocks, companies, and markets"
        />

        <span className="ml-3 hidden rounded border border-border-subtle px-1.5 py-0.5 font-mono text-[10px] text-muted sm:block">
          /
        </span>
      </div>

      {showSuggestions && (
        <div className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-2xl shadow-black/40">
          <div className="border-b border-border-subtle px-3 py-2">
            <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
              Instruments
            </span>
          </div>

          <div className="p-1.5">
            {isLoading ? (
              <div className="px-3 py-4 text-xs text-muted">
                Searching market data...
              </div>
            ) : results.length > 0 ? (
              results.map((result) => {
                const instrument = result.instrument;

                return (
                  <a
                    key={`${instrument.exchangeId}-${instrument.symbol}`}
                    href={`/stocks/${encodeURIComponent(instrument.symbol)}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-hover"
                  >
                    <div className="min-w-0">
                      <div className="font-mono text-sm font-semibold text-foreground">
                        {instrument.symbol}
                      </div>

                      <div className="truncate text-xs text-muted">
                        {instrument.name}
                      </div>
                    </div>

                    <span className="ml-4 shrink-0 text-[10px] uppercase tracking-[0.1em] text-muted">
                      {instrument.countryCode
                        ? `${instrument.countryCode} ${instrument.assetClass}`
                        : instrument.assetClass}
                    </span>
                  </a>
                );
              })
            ) : (
              <div className="px-3 py-4 text-xs text-muted">
                No instruments found.
              </div>
            )}
          </div>

          <div className="border-t border-border-subtle px-3 py-2">
            <p className="text-[10px] text-muted">
              Press / to focus search · Esc to clear
            </p>
          </div>
        </div>
      )}
    </div>
  );
}