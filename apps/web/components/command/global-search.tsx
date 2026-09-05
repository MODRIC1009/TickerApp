"use client";

import { useEffect, useRef, useState } from "react";

const suggestions = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    type: "US Equity",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    type: "US Equity",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    type: "US Equity",
  },
  {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    type: "India Equity",
  },
];

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

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
        inputRef.current?.blur();
        setIsFocused(false);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  const normalizedQuery = query.trim().toLowerCase();

  const filteredSuggestions = normalizedQuery
    ? suggestions.filter(
        (item) =>
          item.symbol.toLowerCase().includes(normalizedQuery) ||
          item.name.toLowerCase().includes(normalizedQuery),
      )
    : suggestions;

  const showSuggestions = isFocused && filteredSuggestions.length > 0;

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
            {filteredSuggestions.map((item) => (
              <a
                key={item.symbol}
                href={`/stocks/${item.symbol}`}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-surface-hover"
              >
                <div className="min-w-0">
                  <div className="font-mono text-sm font-semibold text-foreground">
                    {item.symbol}
                  </div>

                  <div className="truncate text-xs text-muted">
                    {item.name}
                  </div>
                </div>

                <span className="ml-4 shrink-0 text-[10px] uppercase tracking-[0.1em] text-muted">
                  {item.type}
                </span>
              </a>
            ))}
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