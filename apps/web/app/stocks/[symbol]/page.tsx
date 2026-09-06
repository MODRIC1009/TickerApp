import { PriceHistoryChart } from "@/components/market-data/price-history-chart";
import { StockResearchPanel } from "@/components/research/stock-research-panel";
import { getMarketDataService } from "@/lib/market-data";

import type { OHLCVBar } from "@tickerapp/shared";

interface StockPageProps {
  params: Promise<{
    symbol: string;
  }>;
}

const stockData = {
  AAPL: {
    name: "Apple Inc.",
    exchange: "NASDAQ",
    country: "United States",
    currency: "USD",
    price: "$245.18",
    change: "+1.24%",
    marketCap: "$3.72T",
    pe: "34.8x",
    beta: "1.12",
    volatility: "24.6%",
    quality: "92",
    growth: "84",
  },
  NVDA: {
    name: "NVIDIA Corporation",
    exchange: "NASDAQ",
    country: "United States",
    currency: "USD",
    price: "$177.83",
    change: "+2.87%",
    marketCap: "$4.32T",
    pe: "43.7x",
    beta: "2.06",
    volatility: "51.2%",
    quality: "94",
    growth: "97",
  },
  MSFT: {
    name: "Microsoft Corporation",
    exchange: "NASDAQ",
    country: "United States",
    currency: "USD",
    price: "$508.46",
    change: "-0.36%",
    marketCap: "$3.78T",
    pe: "36.1x",
    beta: "1.01",
    volatility: "22.8%",
    quality: "95",
    growth: "88",
  },
  RELIANCE: {
    name: "Reliance Industries",
    exchange: "NSE",
    country: "India",
    currency: "INR",
    price: "₹1,414.70",
    change: "+0.51%",
    marketCap: "₹19.2T",
    pe: "23.4x",
    beta: "0.92",
    volatility: "27.3%",
    quality: "82",
    growth: "79",
  },
} as const;

function formatSymbol(symbol: string) {
  return symbol.trim().toUpperCase();
}

export default async function StockPage({
  params,
}: StockPageProps) {
  const { symbol: rawSymbol } = await params;
  const symbol = formatSymbol(rawSymbol);

  const stock =
    stockData[
      symbol as keyof typeof stockData
    ] ?? stockData.AAPL;

  const countryCode =
    stock.country === "United States"
      ? "US"
      : "IN";

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

  let historicalBars: OHLCVBar[] = [];

  try {
    historicalBars =
      await getMarketDataService().getHistoricalPrices({
        symbol,
        startDate,
        endDate,
        interval: "1d",
      });
  } catch {
    historicalBars = [];
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-3xl font-semibold tracking-tight text-foreground">
                {symbol}
              </span>

              <span className="rounded-md border border-border-subtle bg-background px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted">
                {stock.exchange}
              </span>
            </div>

            <h1 className="mt-2 text-lg font-medium text-muted-strong">
              {stock.name}
            </h1>

            <p className="mt-2 text-xs text-muted">
              {stock.country} · {stock.currency}
            </p>
          </div>

          <div className="lg:text-right">
            <div className="font-mono text-3xl font-semibold text-foreground">
              {stock.price}
            </div>

            <div
              className={`mt-2 font-mono text-sm ${
                stock.change.startsWith("+")
                  ? "text-accent"
                  : "text-negative"
              }`}
            >
              {stock.change} today
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Metric
          label="Market Cap"
          value={stock.marketCap}
        />

        <Metric
          label="P / E"
          value={stock.pe}
        />

        <Metric
          label="Beta"
          value={stock.beta}
        />

        <Metric
          label="Volatility"
          value={stock.volatility}
        />

        <Metric
          label="Quality Score"
          value={stock.quality}
        />

        <Metric
          label="Growth Score"
          value={stock.growth}
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Price History
            </h2>

            <p className="mt-1 text-xs text-muted">
              One year of daily historical closing prices
            </p>
          </div>

          <PriceHistoryChart
            bars={historicalBars}
          />
        </div>

        <div className="rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Research Snapshot
            </h2>

            <p className="mt-1 text-xs text-muted">
              Quantitative signal overview
            </p>
          </div>

          <div className="space-y-4 p-5">
            <ScoreRow
              label="Quality"
              value={stock.quality}
            />

            <ScoreRow
              label="Growth"
              value={stock.growth}
            />

            <ScoreRow
              label="Value"
              value="76"
            />

            <ScoreRow
              label="Momentum"
              value="88"
            />

            <ScoreRow
              label="Financial Health"
              value="91"
            />

            <ScoreRow
              label="Risk"
              value="72"
            />
          </div>
        </div>
      </section>

      <StockResearchPanel
        instrument={{
          symbol,
          name: stock.name,
          exchangeId: stock.exchange,
          countryCode,
          currency: stock.currency,
          assetClass: "equity",
        }}
      />
    </div>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </p>

      <p className="mt-2 font-mono text-lg font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}

function ScoreRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-strong">
          {label}
        </span>

        <span className="font-mono text-foreground">
          {value}/100
        </span>
      </div>

      <div className="h-1.5 overflow-hidden rounded-full bg-background">
        <div
          className="h-full rounded-full bg-accent"
          style={{
            width: `${value}%`,
          }}
        />
      </div>
    </div>
  );
}