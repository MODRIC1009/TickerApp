const watchlist = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: "$245.18",
    change: "+1.24%",
    direction: "positive",
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: "$177.83",
    change: "+2.87%",
    direction: "positive",
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: "$508.46",
    change: "-0.36%",
    direction: "negative",
  },
  {
    symbol: "RELIANCE",
    name: "Reliance Industries",
    price: "₹1,414.70",
    change: "+0.51%",
    direction: "positive",
  },
];

export function WatchlistPreview() {
  return (
    <section className="rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Watchlist
          </h2>
          <p className="mt-1 text-xs text-muted">
            Selected instruments
          </p>
        </div>

        <a
          href="/watchlist"
          className="text-xs text-muted transition-colors hover:text-accent"
        >
          View all →
        </a>
      </div>

      <div className="divide-y divide-border-subtle">
        {watchlist.map((stock) => (
          <a
            key={stock.symbol}
            href={`/stocks/${stock.symbol}`}
            className="flex items-center justify-between px-5 py-4 transition-colors hover:bg-surface-hover"
          >
            <div className="min-w-0">
              <div className="font-mono text-sm font-semibold text-foreground">
                {stock.symbol}
              </div>
              <div className="mt-1 truncate text-xs text-muted">
                {stock.name}
              </div>
            </div>

            <div className="ml-4 text-right">
              <div className="font-mono text-sm text-foreground">
                {stock.price}
              </div>
              <div
                className={`mt-1 font-mono text-xs ${
                  stock.direction === "positive"
                    ? "text-accent"
                    : "text-negative"
                }`}
              >
                {stock.change}
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}