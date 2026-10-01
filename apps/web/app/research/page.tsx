import { ResearchWorkspace } from "@/components/research/research-workspace";

export default function ResearchPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          Intelligence
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
          AI Research
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          Investigate securities with structured market context, quantitative
          analysis, and AI-assisted research.
        </p>
      </section>

      <ResearchWorkspace />
    </div>
  );
}