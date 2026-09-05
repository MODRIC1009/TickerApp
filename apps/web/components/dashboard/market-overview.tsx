const markets = [
  {
    name: "S&P 500",
    value: "6,502.08",
    change: "+0.42%",
    direction: "positive",
  },
  {
    name: "NASDAQ 100",
    value: "23,806.82",
    change: "+0.68%",
    direction: "positive",
  },
  {
    name: "NIFTY 50",
    value: "24,741.90",
    change: "-0.18%",
    direction: "negative",
  },
  {
    name: "FTSE 100",
    value: "9,214.56",
    change: "+0.27%",
    direction: "positive",
  },
  {
    name: "Nikkei 225",
    value: "43,018.75",
    change: "+0.81%",
    direction: "positive",
  },
];

export function MarketOverview() {
  return (
    <section className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Global Markets
          </h2>
          <p className="mt-1 text-xs text-muted">
            Major benchmark performance
          </p>
        </div>

        <span className="rounded-md border border-border-subtle bg-background px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted">
          Demo Data
        </span>
      </div>

      <div className="divide-y divide-border-subtle">
        {markets.map((market) => (
          <div
            key={market.name}
            className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface-hover"
          >
            <span className="text-sm font-medium text-muted-strong">
              {market.name}
            </span>

            <div className="flex items-center gap-5">
              <span className="font-mono text-sm text-foreground">
                {market.value}
              </span>

              <span
                className={`w-16 text-right font-mono text-xs ${
                  market.direction === "positive"
                    ? "text-accent"
                    : "text-negative"
                }`}
              >
                {market.change}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}