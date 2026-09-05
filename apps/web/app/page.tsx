import { MarketOverview } from "@/components/dashboard/market-overview";
import { MetricCard } from "@/components/dashboard/metric-card";
import { WatchlistPreview } from "@/components/dashboard/watchlist-preview";

const metrics = [
  {
    label: "Tracked Instruments",
    value: "10,000+",
    change: "GLOBAL",
    changeType: "neutral" as const,
    description: "Target universe across supported exchanges",
  },
  {
    label: "Markets",
    value: "15+",
    change: "MULTI-REGION",
    changeType: "neutral" as const,
    description: "North America, Europe, Asia-Pacific and more",
  },
  {
    label: "Research Signals",
    value: "24",
    change: "ACTIVE",
    changeType: "positive" as const,
    description: "Quantitative signals available in the platform",
  },
  {
    label: "Data Status",
    value: "ONLINE",
    change: "HEALTHY",
    changeType: "positive" as const,
    description: "Market-data infrastructure operational",
  },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
              Market Intelligence
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Global Equity Intelligence
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Research companies, analyze markets, evaluate risk, and turn
              natural-language questions into structured investment research.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-accent shadow-[0_0_10px_rgba(53,208,127,0.6)]" />
            Platform operational
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={metric.value}
            change={metric.change}
            changeType={metric.changeType}
            description={metric.description}
          />
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <MarketOverview />
        <WatchlistPreview />
      </section>

      <section className="mt-6 rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-accent">
              AI Research
            </p>

            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Ask the market anything.
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Describe what you want to research in plain language. TickerApp
              will eventually translate your request into market filters,
              quantitative analysis, risk evaluation, and evidence-backed
              research.
            </p>
          </div>

          <a
            href="/research"
            className="inline-flex shrink-0 items-center justify-center rounded-lg border border-accent/40 bg-accent-muted px-4 py-2.5 text-sm font-medium text-accent transition-colors hover:border-accent hover:bg-accent/15"
          >
            Open AI Research →
          </a>
        </div>
      </section>
    </div>
  );
}