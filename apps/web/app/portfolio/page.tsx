import { PortfolioWorkspace } from "@/components/portfolio/portfolio-workspace";

export default function PortfolioPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-8">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
              Personal Intelligence
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Portfolio
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
              Track holdings, transactions, valuation, and portfolio
              performance across your global equity investments.
            </p>
          </div>

          <div className="text-xs text-muted">
            Portfolio intelligence workspace
          </div>
        </div>
      </section>

      <PortfolioWorkspace />
    </div>
  );
}