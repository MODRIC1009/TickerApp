import { PortfolioWorkspace } from "@/components/portfolio/portfolio-workspace";

export default function PortfolioPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          Portfolio Intelligence
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          Portfolio
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Track positions, monitor valuation, understand portfolio risk, and
          evaluate allocation using the quantitative analytics engine.
        </p>
      </section>

      <PortfolioWorkspace />
    </div>
  );
}