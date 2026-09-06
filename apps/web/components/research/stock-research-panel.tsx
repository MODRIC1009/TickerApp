"use client";

import { useState } from "react";

import type {
  ResearchInput,
  ResearchResult,
} from "@tickerapp/ai";

import {
  AIResearchClientError,
  runAIResearch,
} from "../../lib/ai-research-client";

interface StockResearchPanelProps {
  instrument: ResearchInput["instrument"];
}

export function StockResearchPanel({
  instrument,
}: StockResearchPanelProps) {
  const [result, setResult] =
    useState<ResearchResult | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  async function runResearch() {
    setLoading(true);
    setError(null);

    try {
      const research =
        await runAIResearch({
          instrument,
          question:
            "Give me a balanced research overview covering financial quality, valuation, catalysts, risks, and market context.",
        });

      setResult(research);
    } catch (caughtError) {
      setError(
        caughtError instanceof
          AIResearchClientError
          ? caughtError.message
          : "Unable to complete AI research.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface">
      <div className="border-b border-border px-5 py-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              AI Research
            </h2>

            <p className="mt-1 text-xs text-muted">
              Evidence-aware analysis for{" "}
              {instrument.name}.
            </p>
          </div>

          <button
            type="button"
            onClick={runResearch}
            disabled={loading}
            className="inline-flex items-center justify-center rounded-lg border border-accent/40 bg-accent-muted px-4 py-2.5 text-xs font-medium text-accent transition-colors hover:border-accent hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Researching..."
              : result
                ? "Refresh Research"
                : "Run AI Research"}
          </button>
        </div>
      </div>

      <div className="p-5">
        {error && (
          <div className="rounded-lg border border-negative/30 bg-negative-muted px-4 py-3 text-xs leading-5 text-negative">
            {error}
          </div>
        )}

        {!result &&
          !error &&
          !loading && (
            <div className="rounded-lg border border-border-subtle bg-background/50 px-4 py-6 text-center">
              <p className="text-sm text-muted-strong">
                Run AI Research to generate a structured
                analysis.
              </p>

              <p className="mt-2 text-xs text-muted">
                Results include thesis, bull and bear
                cases, catalysts, risks, evidence, and
                limitations.
              </p>
            </div>
          )}

        {loading && (
          <div className="grid gap-3 md:grid-cols-3">
            {[
              "Thesis",
              "Bull Case",
              "Risks",
            ].map((label) => (
              <div
                key={label}
                className="animate-pulse rounded-lg border border-border-subtle bg-background/50 p-4"
              >
                <div className="h-3 w-20 rounded bg-surface-elevated" />
                <div className="mt-3 h-10 rounded bg-surface-elevated" />
              </div>
            ))}
          </div>
        )}

        {result && !loading && (
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted">
                  Investment Thesis
                </p>

                <span className="rounded-md border border-border-subtle bg-background px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-accent">
                  {result.confidence} confidence
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-muted-strong">
                {result.thesis}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <SummaryList
                title="Bull Case"
                items={result.bullCase}
                tone="positive"
              />

              <SummaryList
                title="Bear Case"
                items={result.bearCase}
                tone="negative"
              />

              <SummaryList
                title="Catalysts"
                items={result.catalysts}
                tone="positive"
              />

              <SummaryList
                title="Risks"
                items={result.risks}
                tone="negative"
              />
            </div>

            <div className="border-t border-border pt-4">
              <div className="flex flex-wrap gap-2 text-[10px] text-muted">
                <span className="rounded border border-border-subtle px-2 py-1">
                  Provider: {result.providerId}
                </span>

                <span className="rounded border border-border-subtle px-2 py-1">
                  Model: {result.model}
                </span>

                <span className="rounded border border-border-subtle px-2 py-1">
                  {result.evidence.length} evidence item
                  {result.evidence.length === 1
                    ? ""
                    : "s"}
                </span>
              </div>
            </div>

            {result.limitations.length > 0 && (
              <div className="rounded-lg border border-warning/30 bg-warning-muted px-4 py-3">
                <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-warning">
                  Limitations
                </p>

                <ul className="mt-2 space-y-1">
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
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function SummaryList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "negative";
}) {
  const headingClass =
    tone === "positive"
      ? "text-accent"
      : "text-negative";

  const bulletClass =
    tone === "positive"
      ? "bg-accent"
      : "bg-negative";

  return (
    <div className="rounded-lg border border-border-subtle bg-background/50 p-4">
      <h3
        className={`text-xs font-semibold ${headingClass}`}
      >
        {title}
      </h3>

      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <li
            key={item}
            className="flex gap-2 text-xs leading-5 text-muted-strong"
          >
            <span
              className={`mt-2 h-1 w-1 shrink-0 rounded-full ${bulletClass}`}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}