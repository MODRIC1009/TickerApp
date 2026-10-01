"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Instrument } from "@tickerapp/shared";

interface StockResearchPanelProps {
  instrument: Instrument;
}

type ResearchSource = {
  title?: string;
  url?: string;
};

type ResearchResponse = {
  answer?: string;
  summary?: string;
  sources?: ResearchSource[];
  error?: string;
};

const researchPrompts = [
  {
    label: "Investment thesis",
    prompt:
      "What is the investment thesis for this company? Cover the main strengths, growth drivers, risks, and what could invalidate the thesis.",
  },
  {
    label: "Key risks",
    prompt:
      "What are the most important risks for this company right now? Prioritize the risks that could materially affect earnings, valuation, or the stock price.",
  },
  {
    label: "Growth outlook",
    prompt:
      "Analyze the company's growth outlook. Discuss the major growth drivers, competitive position, and factors that could accelerate or slow growth.",
  },
  {
    label: "Valuation",
    prompt:
      "Explain how an investor should think about this company's valuation and which metrics or assumptions matter most.",
  },
];

function getResearchText(
  response: ResearchResponse,
) {
  return (
    response.answer ??
    response.summary ??
    null
  );
}

function assetClassLabel(
  assetClass: Instrument["assetClass"],
) {
  switch (assetClass) {
    case "equity":
      return "Equity";
    case "etf":
      return "ETF";
    case "adr":
      return "ADR";
    case "reit":
      return "REIT";
    case "fund":
      return "Fund";
    default:
      return assetClass;
  }
}

export function StockResearchPanel({
  instrument,
}: StockResearchPanelProps) {
  const [question, setQuestion] =
    useState("");

  const [answer, setAnswer] =
    useState<string | null>(null);

  const [sources, setSources] =
    useState<ResearchSource[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const identity = useMemo(
    () =>
      `${instrument.symbol}-${instrument.exchangeId}-${instrument.countryCode}`,
    [instrument],
  );

  useEffect(() => {
    setAnswer(null);
    setSources([]);
    setError(null);
    setQuestion("");
  }, [identity]);

  async function submitResearch(
    requestedQuestion?: string,
  ) {
    const prompt = (
      requestedQuestion ??
      question
    ).trim();

    if (!prompt) {
      setError(
        "Enter a research question to continue.",
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setAnswer(null);
      setSources([]);

      const response = await fetch(
        "/api/ai/research",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question: prompt,
            instrument,
          }),
        },
      );

      const payload =
        (await response.json()) as ResearchResponse;

      if (!response.ok) {
        throw new Error(
          payload.error ??
            "Research request failed.",
        );
      }

      const text =
        getResearchText(payload);

      if (!text) {
        throw new Error(
          "The research engine returned no answer.",
        );
      }

      setAnswer(text);
      setSources(
        payload.sources ?? [],
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to complete the research request.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="glass-panel-elevated relative overflow-hidden rounded-2xl">
      <div className="spatial-grid pointer-events-none absolute inset-0 opacity-10" />

      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-accent/5 blur-3xl" />

      <div className="relative border-b border-border-subtle px-5 py-5 sm:px-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/20 bg-accent-muted font-mono text-[10px] font-semibold text-accent">
                AI
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    AI Research Assistant
                  </p>

                  <span className="rounded-full border border-accent/20 bg-accent-muted px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-accent">
                    Intelligence
                  </span>
                </div>

                <p className="mt-1 text-xs text-muted">
                  Structured research workspace
                </p>
              </div>
            </div>

            <p className="mt-4 max-w-2xl text-xs leading-5 text-muted">
              Ask questions about{" "}
              <span className="font-mono font-semibold text-muted-strong">
                {instrument.symbol}
              </span>{" "}
              and receive AI-assisted research context using the
              security selected in the market-data workspace.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-[300px]">
            <ResearchMeta
              label="Symbol"
              value={instrument.symbol}
            />

            <ResearchMeta
              label="Asset"
              value={assetClassLabel(
                instrument.assetClass,
              )}
            />

            <ResearchMeta
              label="Exchange"
              value={instrument.exchangeId}
            />
          </div>
        </div>
      </div>

      <div className="relative p-5 sm:p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between gap-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
              Research prompts
            </p>

            <p className="hidden text-[9px] uppercase tracking-[0.1em] text-muted sm:block">
              Start with a structured question
            </p>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {researchPrompts.map(
              (item) => (
                <button
                  key={item.label}
                  type="button"
                  disabled={loading}
                  onClick={() => {
                    setQuestion(
                      item.prompt,
                    );

                    void submitResearch(
                      item.prompt,
                    );
                  }}
                  className="group rounded-xl border border-border-subtle bg-surface-hover p-3 text-left transition-all hover:-translate-y-0.5 hover:border-border hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[10px] font-semibold text-muted-strong group-hover:text-foreground">
                      {item.label}
                    </span>

                    <span className="font-mono text-[10px] text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent">
                      →
                    </span>
                  </div>

                  <p className="mt-2 line-clamp-2 text-[10px] leading-4 text-muted">
                    {item.prompt}
                  </p>
                </button>
              ),
            )}
          </div>
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submitResearch();
          }}
        >
          <label
            htmlFor="stock-research-question"
            className="sr-only"
          >
            Research question
          </label>

          <div className="overflow-hidden rounded-2xl border border-border bg-background transition-colors focus-within:border-accent/40 focus-within:ring-2 focus-within:ring-accent/10">
            <div className="flex items-center gap-2 border-b border-border-subtle px-4 py-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />

              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted">
                Ask about {instrument.symbol}
              </span>

              <span className="ml-auto font-mono text-[9px] text-muted">
                AI
              </span>
            </div>

            <textarea
              id="stock-research-question"
              value={question}
              onChange={(event) =>
                setQuestion(
                  event.target.value,
                )
              }
              placeholder={`Ask anything about ${instrument.symbol}...`}
              rows={5}
              disabled={loading}
              className="block w-full resize-none bg-transparent px-4 py-4 text-sm leading-6 text-foreground outline-none placeholder:text-muted disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="flex flex-col gap-3 border-t border-border-subtle px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-medium text-muted-strong">
                  AI-assisted research
                </p>

                <p className="mt-0.5 text-[9px] text-muted">
                  Responses depend on available model and research context.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  !question.trim()
                }
                className="rounded-xl border border-accent/40 bg-accent-muted px-4 py-2.5 text-xs font-semibold text-accent transition-all hover:border-accent hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
                    Analyzing...
                  </span>
                ) : (
                  "Ask AI →"
                )}
              </button>
            </div>
          </div>
        </form>

        {error ? (
          <div
            role="alert"
            className="mt-4 flex items-start gap-3 rounded-xl border border-negative/20 bg-negative-muted px-4 py-3"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-negative/30 font-mono text-[10px] font-semibold text-negative">
              !
            </span>

            <div>
              <p className="text-xs font-semibold text-negative">
                Research request failed
              </p>

              <p className="mt-1 text-[11px] leading-5 text-muted">
                {error}
              </p>
            </div>
          </div>
        ) : null}

        {loading ? (
          <div
            className="mt-6 rounded-2xl border border-border-subtle bg-background/50 p-5"
            aria-live="polite"
          >
            <div className="flex items-center gap-3">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-50" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
              </span>

              <div>
                <p className="text-xs font-semibold text-muted-strong">
                  Building research context...
                </p>

                <p className="mt-0.5 text-[10px] text-muted">
                  Processing the request for {instrument.symbol}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="h-3 w-11/12 animate-pulse rounded bg-surface-hover" />
              <div className="h-3 w-full animate-pulse rounded bg-surface-hover" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-surface-hover" />
              <div className="h-3 w-9/12 animate-pulse rounded bg-surface-hover" />
            </div>
          </div>
        ) : null}

        {answer ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-border-subtle bg-background/50">
            <div className="flex flex-col justify-between gap-3 border-b border-border-subtle px-5 py-4 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />

                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-accent">
                    Research response
                  </p>
                </div>

                <p className="mt-1 text-xs text-muted">
                  {instrument.symbol} · AI-assisted analysis
                </p>
              </div>

              <span className="rounded-full border border-border-subtle bg-surface-hover px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.1em] text-muted">
                Generated analysis
              </span>
            </div>

            <div className="px-5 py-6">
              <div className="whitespace-pre-wrap text-sm leading-7 text-muted-strong">
                {answer}
              </div>
            </div>

            {sources.length > 0 ? (
              <div className="border-t border-border-subtle px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                    Sources
                  </p>

                  <span className="font-mono text-[9px] text-muted">
                    {sources.length}{" "}
                    {sources.length === 1
                      ? "source"
                      : "sources"}
                  </span>
                </div>

                <div className="mt-3 grid gap-2">
                  {sources.map(
                    (source, index) => (
                      <div
                        key={`${source.url ?? source.title ?? "source"}-${index}`}
                        className="rounded-xl border border-border-subtle bg-surface-hover px-4 py-3"
                      >
                        {source.url ? (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="group flex items-start justify-between gap-4 text-xs"
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-muted-strong transition-colors group-hover:text-accent">
                                {source.title ??
                                  source.url}
                              </span>

                              <span className="mt-1 block truncate text-[10px] text-muted">
                                {source.url}
                              </span>
                            </span>

                            <span className="shrink-0 font-mono text-[10px] text-muted transition-colors group-hover:text-accent">
                              ↗
                            </span>
                          </a>
                        ) : (
                          <span className="text-xs text-muted-strong">
                            {source.title ??
                              "Source"}
                          </span>
                        )}
                      </div>
                    ),
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function ResearchMeta({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-xl border border-border-subtle bg-surface-hover px-3 py-2.5">
      <p className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </p>

      <p className="mt-1 truncate font-mono text-[10px] font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}