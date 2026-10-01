import Link from "next/link";

import { MarketOverview } from "@/components/dashboard/market-overview";
import { MetricCard } from "@/components/dashboard/metric-card";
import { WatchlistPreview } from "@/components/dashboard/watchlist-preview";

const metrics = [
  {
    label: "Market Coverage",
    value: "GLOBAL",
    change: "MULTI-REGION",
    changeType: "neutral" as const,
    description:
      "Explore supported securities, exchanges, and global market regions.",
  },
  {
    label: "Live Quotes",
    value: "ACTIVE",
    change: "REAL-TIME",
    changeType: "positive" as const,
    description:
      "Current quotes supplied by the configured market-data provider.",
  },
  {
    label: "AI Research",
    value: "READY",
    change: "INTELLIGENCE",
    changeType: "positive" as const,
    description:
      "Investigate securities using structured AI research workflows.",
  },
  {
    label: "Quant Analytics",
    value: "READY",
    change: "RISK + STRATEGY",
    changeType: "neutral" as const,
    description:
      "Evaluate quantitative risk, portfolios, and systematic strategies.",
  },
];

const capabilityCards = [
  {
    number: "01",
    title: "Discover",
    description:
      "Search securities, explore markets, and inspect current provider-backed information.",
    href: "/",
    action: "Market Overview",
  },
  {
    number: "02",
    title: "Research",
    description:
      "Combine live market data with structured company and security research.",
    href: "/research",
    action: "AI Research",
  },
  {
    number: "03",
    title: "Measure",
    description:
      "Decompose quantitative risk across volatility, drawdown, liquidity, and systematic factors.",
    href: "/stocks/AAPL",
    action: "Risk Intelligence",
  },
  {
    number: "04",
    title: "Manage",
    description:
      "Track portfolio positions, valuation, allocation, and analytical performance.",
    href: "/portfolio",
    action: "Portfolio",
  },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-[1680px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="relative mb-8 overflow-hidden rounded-3xl border border-border bg-surface/60 shadow-[0_24px_80px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-40 h-96 w-96 rounded-full bg-accent/[0.055] blur-3xl"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_100%,rgba(53,208,127,0.035),transparent_35%)]"
        />

        <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:p-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(53,208,127,0.65)]"
                aria-hidden="true"
              />

              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-accent">
                TickerApp Intelligence Terminal
              </p>
            </div>

            <h1 className="mt-3 max-w-4xl text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl lg:text-5xl">
              Global Equity
              <span className="text-muted"> Intelligence.</span>
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-6 text-muted sm:text-[15px]">
              A unified workspace for global market discovery, live security
              analysis, quantitative risk, portfolio intelligence, and
              AI-assisted research.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Link
                href="/research"
                className="inline-flex items-center justify-center rounded-xl border border-accent/40 bg-accent-muted px-4 py-2.5 text-sm font-medium text-accent shadow-[0_8px_24px_rgba(53,208,127,0.08)] transition-all duration-200 hover:border-accent hover:bg-accent/15 hover:shadow-[0_10px_30px_rgba(53,208,127,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                Open AI Research
                <span className="ml-2">→</span>
              </Link>

              <Link
                href="/portfolio"
                className="inline-flex items-center justify-center rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm font-medium text-muted transition-all duration-200 hover:border-border-strong hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                Portfolio Workspace
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-2 lg:min-w-48">
            <div className="rounded-2xl border border-border-subtle bg-background/40 p-4 backdrop-blur-md">
              <div className="flex items-center justify-between gap-5">
                <span className="text-[8px] font-semibold uppercase tracking-[0.15em] text-muted">
                  System
                </span>

                <span className="flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.12em] text-accent">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(53,208,127,0.55)]"
                    aria-hidden="true"
                  />
                  Operational
                </span>
              </div>

              <p className="mt-3 font-mono text-xs text-foreground">
                MARKET INTELLIGENCE
              </p>

              <p className="mt-1 text-[9px] leading-4 text-muted">
                Live when supported by the configured provider.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Platform capabilities"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
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

      <section className="relative mt-6 overflow-hidden rounded-2xl border border-border bg-surface/70 shadow-[0_18px_60px_rgba(0,0,0,0.1)] backdrop-blur-xl">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-accent/[0.035] blur-3xl"
        />

        <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />

              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-accent">
                Intelligence Layer
              </p>
            </div>

            <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              From market data to structured insight.
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              TickerApp connects discovery, quantitative analytics, portfolio
              intelligence, and AI research into one analytical workflow.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            <Link
              href="/research"
              className="inline-flex items-center justify-center rounded-xl border border-accent/40 bg-accent-muted px-4 py-2.5 text-sm font-medium text-accent transition-all duration-200 hover:border-accent hover:bg-accent/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              Explore Intelligence
              <span className="ml-2">→</span>
            </Link>

            <Link
              href="/portfolio"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-background/50 px-4 py-2.5 text-sm font-medium text-muted transition-all duration-200 hover:border-border-strong hover:bg-surface-hover hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
            >
              Open Portfolio
            </Link>
          </div>
        </div>

        <div className="relative grid border-t border-border sm:grid-cols-2 xl:grid-cols-4">
          {capabilityCards.map((card, index) => (
            <Link
              key={card.number}
              href={card.href}
              className={`group relative p-5 transition-colors hover:bg-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent/60 ${
                index < capabilityCards.length - 1
                  ? "border-b border-border sm:border-r xl:border-b-0"
                  : ""
              } ${
                index === 1
                  ? "xl:border-r"
                  : ""
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className="font-mono text-[9px] text-muted">
                  {card.number}
                </span>

                <span className="text-muted transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent">
                  →
                </span>
              </div>

              <p className="mt-5 text-sm font-semibold text-foreground">
                {card.title}
              </p>

              <p className="mt-1.5 min-h-10 text-[10px] leading-5 text-muted">
                {card.description}
              </p>

              <p className="mt-4 text-[8px] font-semibold uppercase tracking-[0.12em] text-muted transition-colors group-hover:text-accent">
                {card.action}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border-subtle bg-surface/45 p-5 backdrop-blur-md">
          <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted">
            Data
          </p>

          <p className="mt-2 text-sm font-medium text-foreground">
            Provider-backed market information
          </p>

          <p className="mt-1 text-[10px] leading-5 text-muted">
            Live, calculated, reference, and unavailable states are kept
            distinct throughout the platform.
          </p>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface/45 p-5 backdrop-blur-md">
          <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted">
            Analytics
          </p>

          <p className="mt-2 text-sm font-medium text-foreground">
            Explainable quantitative models
          </p>

          <p className="mt-1 text-[10px] leading-5 text-muted">
            Risk and strategy outputs expose their underlying measurements and
            assumptions rather than hiding them behind a single number.
          </p>
        </div>

        <div className="rounded-2xl border border-border-subtle bg-surface/45 p-5 backdrop-blur-md">
          <p className="text-[9px] font-semibold uppercase tracking-[0.15em] text-muted">
            Workflow
          </p>

          <p className="mt-2 text-sm font-medium text-foreground">
            Discover → analyze → research
          </p>

          <p className="mt-1 text-[10px] leading-5 text-muted">
            Move from a market signal to security-level analysis and deeper
            research without leaving the workspace.
          </p>
        </div>
      </section>
    </div>
  );
}