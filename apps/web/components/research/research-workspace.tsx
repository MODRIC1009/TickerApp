"use client";

import { FormEvent, useState } from "react";

import type {
  ResearchInput,
  ResearchResult,
} from "@tickerapp/ai";

import {
  AIResearchClientError,
  runAIResearch,
} from "../../lib/ai-research-client";

const defaultInstrument: ResearchInput["instrument"] = {
  symbol: "AAPL",
  name: "Apple Inc.",
  exchangeId: "NASDAQ",
  countryCode: "US",
  currency: "USD",
  assetClass: "equity",
};

const exampleQuestions = [
  "Give me a balanced fundamental and risk overview.",
  "What are the main bull and bear cases?",
  "What should I monitor over the next few quarters?",
];

export function ResearchWorkspace() {
  const [instrument, setInstrument] =
    useState(defaultInstrument);
  const [question, setQuestion] =
    useState(
      exampleQuestions[0],
    );
  const [result, setResult] =
    useState<ResearchResult | null>(
      null,
    );
  const [loading, setLoading] =
    useState(false);
  const [error, setError] =
    useState<string | null>(
      null,
    );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setLoading(true);
    setError(null);

    try {
      const research =
        await runAIResearch({
          instrument,
          question,
        });

      setResult(research);
    } catch (caughtError) {
      if (
        caughtError instanceof
        AIResearchClientError
      ) {
        setError(
          caughtError.message,
        );
      } else {
        setError(
          "Unable to complete AI research. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <section className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-accent">
          AI Research Engine
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Research the market.
        </h1>

        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">
          Ask a natural-language question about an
          instrument and receive structured research
          covering thesis, catalysts, risks, evidence,
          and uncertainty.
        </p>
      </section>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <aside className="h-fit rounded-xl border border-border bg-surface">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">
              Research Request
            </h2>

            <p className="mt-1 text-xs text-muted">
              Define the company and question.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-5 p-5"
          >
            <div>
              <label
                htmlFor="research-symbol"
                className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted"
              >
                Symbol
              </label>

              <input
                id="research-symbol"
                value={instrument.symbol}
                onChange={(event) =>
                  setInstrument({
                    ...instrument,
                    symbol:
                      event.target.value.toUpperCase(),
                  })
                }
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
                placeholder="AAPL"
              />
            </div>

            <div>
              <label
                htmlFor="research-company"
                className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted"
              >
                Company
              </label>

              <input
                id="research-company"
                value={instrument.name}
                onChange={(event) =>
                  setInstrument({
                    ...instrument,
                    name: event.target.value,
                  })
                }
                className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
                placeholder="Apple Inc."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Exchange"
                value={instrument.exchangeId}
                onChange={(value) =>
                  setInstrument({
                    ...instrument,
                    exchangeId: value,
                  })
                }
              />

              <Field
                label="Country"
                value={instrument.countryCode}
                onChange={(value) =>
                  setInstrument({
                    ...instrument,
                    countryCode: value,
                  })
                }
              />

              <Field
                label="Currency"
                value={instrument.currency}
                onChange={(value) =>
                  setInstrument({
                    ...instrument,
                    currency: value,
                  })
                }
              />

              <Field
                label="Asset Class"
                value={instrument.assetClass}
                onChange={(value) =>
                  setInstrument({
                    ...instrument,
                    assetClass:
                      value as ResearchInput["instrument"]["assetClass"],
                  })
                }
              />
            </div>

            <div>
              <label
                htmlFor="research-question"
                className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted"
              >
                Research Question
              </label>

              <textarea
                id="research-question"
                value={question}
                onChange={(event) =>
                  setQuestion(
                    event.target.value,
                  )
                }
                rows={6}
                className="mt-2 w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-5 text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent"
                placeholder="What would you like to research?"
              />
            </div>

            <div>
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                Quick Questions
              </p>

              <div className="space-y-2">
                {exampleQuestions.map(
                  (example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() =>
                        setQuestion(
                          example,
                        )
                      }
                      className="w-full rounded-lg border border-border-subtle bg-background/50 px-3 py-2 text-left text-xs leading-5 text-muted-strong transition-colors hover:border-border hover:bg-surface-hover hover:text-foreground"
                    >
                      {example}
                    </button>
                  ),
                )}
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-negative/30 bg-negative-muted px-3 py-3 text-xs leading-5 text-negative">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg border border-accent/40 bg-accent-muted px-4 py-3 text-sm font-medium text-accent transition-colors hover:border-accent hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Generating research..."
                : "Run AI Research"}
            </button>

            <p className="text-[10px] leading-4 text-muted">
              AI-generated research is decision support,
              not a guarantee of investment outcomes.
            </p>
          </form>
        </aside>

        <main>
          {loading && (
            <LoadingState />
          )}

          {!loading && !result && (
            <EmptyState />
          )}

          {!loading && result && (
            <ResearchResultView
              result={result}
            />
          )}
        </main>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
        {label}
      </label>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-foreground outline-none transition-colors focus:border-accent"
      />
    </div>
  );
}

function EmptyState() {
  return (
    <section className="flex min-h-[620px] items-center justify-center rounded-xl border border-border bg-surface">
      <div className="max-w-md px-6 text-center">
        <div className="font-mono text-3xl text-muted">
          AI
        </div>

        <h2 className="mt-4 text-lg font-semibold text-foreground">
          Your research workspace is ready.
        </h2>

        <p className="mt-2 text-sm leading-6 text-muted">
          Select an instrument, ask a question, and run
          the research engine to generate a structured
          analysis.
        </p>
      </div>
    </section>
  );
}

function LoadingState() {
  return (
    <section className="rounded-xl border border-border bg-surface p-6">
      <div className="animate-pulse space-y-5">
        <div className="h-5 w-48 rounded bg-surface-elevated" />
        <div className="h-20 rounded bg-surface-elevated" />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-32 rounded bg-surface-elevated" />
          <div className="h-32 rounded bg-surface-elevated" />
          <div className="h-32 rounded bg-surface-elevated" />
          <div className="h-32 rounded bg-surface-elevated" />
        </div>
      </div>
    </section>
  );
}

function ResearchResultView({
  result,
}: {
  result: ResearchResult;
}) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-surface p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-2xl font-semibold text-foreground">
                {result.instrument.symbol}
              </span>

              <span className="rounded-md border border-border-subtle bg-background px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-muted">
                {result.instrument.exchangeId}
              </span>
            </div>

            <p className="mt-2 text-sm text-muted-strong">
              {result.instrument.name}
            </p>
          </div>

          <div className="text-left md:text-right">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
              Confidence
            </p>

            <span className="mt-2 inline-flex rounded-md border border-border-subtle bg-background px-2.5 py-1 font-mono text-xs uppercase text-accent">
              {result.confidence}
            </span>
          </div>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
            Investment Thesis
          </p>

          <p className="mt-2 text-sm leading-7 text-foreground">
            {result.thesis}
          </p>
        </div>

        <div className="mt-5 flex flex-wrap gap-2 text-[10px] text-muted">
          <span className="rounded border border-border-subtle px-2 py-1">
            Provider: {result.providerId}
          </span>

          <span className="rounded border border-border-subtle px-2 py-1">
            Model: {result.model}
          </span>

          <span className="rounded border border-border-subtle px-2 py-1">
            Generated:{" "}
            {new Date(
              result.generatedAt,
            ).toLocaleString()}
          </span>
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <ResearchListCard
          title="Bull Case"
          items={result.bullCase}
          tone="positive"
        />

        <ResearchListCard
          title="Bear Case"
          items={result.bearCase}
          tone="negative"
        />

        <ResearchListCard
          title="Catalysts"
          items={result.catalysts}
          tone="positive"
        />

        <ResearchListCard
          title="Risks"
          items={result.risks}
          tone="negative"
        />
      </div>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Research Sections
          </h2>

          <p className="mt-1 text-xs text-muted">
            Structured analysis generated by the research engine.
          </p>
        </div>

        <div className="divide-y divide-border">
          {result.sections.map(
            (section) => (
              <article
                key={section.title}
                className="p-5"
              >
                <h3 className="text-sm font-medium text-foreground">
                  {section.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-muted-strong">
                  {section.summary}
                </p>

                <ul className="mt-3 space-y-2">
                  {section.keyPoints.map(
                    (point) => (
                      <li
                        key={point}
                        className="flex gap-2 text-xs leading-5 text-muted"
                      >
                        <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                        {point}
                      </li>
                    ),
                  )}
                </ul>
              </article>
            ),
          )}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-surface">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">
            Evidence
          </h2>

          <p className="mt-1 text-xs text-muted">
            Sources explicitly supplied to the AI provider.
          </p>
        </div>

        <div className="divide-y divide-border">
          {result.evidence.map(
            (item, index) => (
              <div
                key={`${item.source}-${index}`}
                className="grid gap-2 p-5 md:grid-cols-[180px_1fr_80px]"
              >
                <span className="text-xs font-medium text-muted-strong">
                  {item.source}
                </span>

                <p className="text-xs leading-5 text-muted">
                  {item.claim}
                </p>

                <span className="text-[10px] uppercase tracking-[0.1em] text-muted">
                  {item.relevance}
                </span>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="rounded-xl border border-warning/30 bg-warning-muted p-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-warning">
          Limitations
        </p>

        <ul className="mt-3 space-y-2">
          {result.limitations.map(
            (limitation) => (
              <li
                key={limitation}
                className="text-xs leading-5 text-muted-strong"
              >
                {limitation}
              </li>
            ),
          )}
        </ul>
      </section>
    </div>
  );
}

function ResearchListCard({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "negative";
}) {
  const toneClass =
    tone === "positive"
      ? "text-accent"
      : "text-negative";

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <h2
        className={`text-sm font-semibold ${toneClass}`}
      >
        {title}
      </h2>

      <ul className="mt-4 space-y-3">
        {items.map(
          (item) => (
            <li
              key={item}
              className="flex gap-3 text-xs leading-5 text-muted-strong"
            >
              <span
                className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                  tone === "positive"
                    ? "bg-accent"
                    : "bg-negative"
                }`}
              />
              {item}
            </li>
          ),
        )}
      </ul>
    </section>
  );
}