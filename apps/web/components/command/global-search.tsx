"use client";

import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
} from "react";

type SearchInstrument = {
  symbol: string;
  name: string;
  exchangeId: string;
  countryCode: string;
  currency: string;
  assetClass: string;
};

type SearchResponse = {
  results?: SearchInstrument[];
  error?: string;
};

function getAssetClassLabel(
  assetClass: string,
): string {
  const labels: Record<string, string> = {
    equity: "Equity",
    etf: "ETF",
    adr: "ADR",
    reit: "REIT",
    fund: "Fund",
  };

  return (
    labels[assetClass.toLowerCase()] ??
    assetClass
  );
}

function getInstrumentInitials(
  symbol: string,
): string {
  return symbol.slice(0, 2).toUpperCase();
}

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    SearchInstrument[]
  >([]);
  const [loading, setLoading] =
    useState(false);
  const [open, setOpen] =
    useState(false);
  const [error, setError] =
    useState<string | null>(null);

  const containerRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const timeout =
      window.setTimeout(
        async () => {
          try {
            setLoading(true);
            setError(null);

            const response =
              await fetch(
                `/api/market-data/search?q=${encodeURIComponent(
                  trimmed,
                )}`,
                {
                  cache: "no-store",
                },
              );

            const payload =
              (await response.json()) as SearchResponse;

            if (!response.ok) {
              throw new Error(
                payload.error ??
                  "Search failed.",
              );
            }

            if (!cancelled) {
              setResults(
                payload.results ?? [],
              );
              setOpen(true);
            }
          } catch (searchError) {
            if (!cancelled) {
              setResults([]);
              setError(
                searchError instanceof Error
                  ? searchError.message
                  : "Search failed.",
              );
              setOpen(true);
            }
          } finally {
            if (!cancelled) {
              setLoading(false);
            }
          }
        },
        250,
      );

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    function handleOutsideClick(
      event: MouseEvent,
    ) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  useEffect(() => {
    function handleEscape(
      event: KeyboardEvent,
    ) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener(
      "keydown",
      handleEscape,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleEscape,
      );
    };
  }, []);

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    setOpen(true);
  }

  function handleClear() {
    setQuery("");
    setResults([]);
    setError(null);
    setOpen(false);
  }

  const showDropdown =
    open && query.trim().length >= 2;

  return (
    <div
      ref={containerRef}
      className="relative w-full"
    >
      <form
        onSubmit={handleSubmit}
        role="search"
      >
        <label
          htmlFor="global-stock-search"
          className="sr-only"
        >
          Search stocks and instruments
        </label>

        <div className="group relative">
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors duration-200 group-focus-within:text-accent"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
            />
            <path d="m20 20-4-4" />
          </svg>

          <input
            id="global-stock-search"
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => {
              if (
                query.trim().length >= 2
              ) {
                setOpen(true);
              }
            }}
            placeholder="Search stocks, ETFs, indices..."
            autoComplete="off"
            spellCheck={false}
            aria-expanded={showDropdown}
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
          ) : (
            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border-subtle bg-background/50 px-1.5 py-0.5 font-mono text-[8px] text-muted sm:block">
              /
            </span>
          )}
        </div>
      </form>

      {showDropdown ? (
        <div
          id="global-search-results"
          className="absolute left-0 right-0 top-[calc(100%+0.6rem)] z-50 overflow-hidden rounded-2xl border border-border bg-surface/95 shadow-[0_24px_70px_rgba(0,0,0,0.3)] backdrop-blur-2xl"
          role="listbox"
          aria-label="Search results"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent"
          />

          <div className="relative flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(53,208,127,0.45)]" />

              <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">
                Instrument search
              </span>
            </div>

            <span className="font-mono text-[9px] text-muted">
              {loading
                ? "Querying..."
                : `${results.length} result${
                    results.length === 1
                      ? ""
                      : "s"
                  }`}
            </span>
          </div>

          {error ? (
            <div className="px-5 py-7 text-center">
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-warning/20 bg-warning/[0.06] text-warning">
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="m10.3 4.5-7.2 12.6A2 2 0 0 0 4.8 20h14.4a2 2 0 0 0 1.7-2.9L13.7 4.5a2 2 0 0 0-3.4 0Z" />
                </svg>
              </div>

              <p className="mt-3 text-sm font-medium text-foreground">
                Search unavailable
              </p>

              <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-muted">
                {error}
              </p>

              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setQuery(
                    (current) =>
                      current.trim(),
                  );
                }}
                className="mt-4 rounded-lg border border-border-subtle bg-background/50 px-3 py-2 text-[10px] font-medium text-muted transition-colors hover:border-border hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                Retry search
              </button>
            </div>
          ) : loading ? (
            <div className="space-y-1 p-2">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-4 rounded-xl px-3 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 animate-pulse rounded-xl bg-surface-hover" />

                    <div className="space-y-2">
                      <div className="h-3 w-16 animate-pulse rounded bg-surface-hover" />
                      <div className="h-2.5 w-28 animate-pulse rounded bg-surface-hover" />
                    </div>
                  </div>

                  <div className="h-2.5 w-16 animate-pulse rounded bg-surface-hover" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-background/40 text-muted">
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                >
                  <circle
                    cx="11"
                    cy="11"
                    r="7"
                  />
                  <path d="m20 20-4-4" />
                </svg>
              </div>

              <p className="mt-3 text-sm font-medium text-foreground">
                No instruments found
              </p>

              <p className="mt-1 text-xs leading-5 text-muted">
                Try a ticker symbol or company name.
              </p>
            </div>
          ) : (
            <div className="max-h-[min(32rem,70vh)] overflow-y-auto p-2">
              {results.map(
                (instrument) => (
                  <Link
                    key={`${instrument.symbol}-${instrument.exchangeId}-${instrument.countryCode}`}
                    href={`/stocks/${encodeURIComponent(
                      instrument.symbol,
                    )}`}
                    role="option"
                    aria-selected="false"
                    onClick={() => {
                      setOpen(false);
                    }}
                    className="group relative flex items-center justify-between gap-4 overflow-hidden rounded-xl px-3 py-3 transition-all duration-150 hover:bg-surface-hover focus-visible:bg-surface-hover focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
                  >
                    <span
                      aria-hidden="true"
                      className="absolute inset-y-2 left-0 w-px scale-y-0 rounded-full bg-accent transition-transform duration-200 group-hover:scale-y-100"
                    />

                    <div className="flex min-w-0 items-center gap-3">
                      <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border-subtle bg-background/50 font-mono text-[9px] font-semibold text-muted transition-colors group-hover:border-accent/20 group-hover:text-accent">
                        <span
                          aria-hidden="true"
                          className="absolute right-1 top-1 h-1 w-1 rounded-full bg-accent/60 opacity-0 transition-opacity group-hover:opacity-100"
                        />

                        {getInstrumentInitials(
                          instrument.symbol,
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-foreground">
                            {instrument.symbol}
                          </span>

                          <span className="rounded-md border border-border-subtle bg-background/30 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.08em] text-muted">
                            {getAssetClassLabel(
                              instrument.assetClass,
                            )}
                          </span>
                        </div>

                        <p className="mt-0.5 truncate text-[11px] text-muted">
                          {instrument.name}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="font-mono text-[10px] font-medium text-foreground">
                        {instrument.exchangeId}
                      </div>

                      <div className="mt-1 text-[9px] uppercase tracking-[0.08em] text-muted">
                        {instrument.countryCode}
                        {" · "}
                        {instrument.currency}
                      </div>
                    </div>
                  </Link>
                ),
              )}
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