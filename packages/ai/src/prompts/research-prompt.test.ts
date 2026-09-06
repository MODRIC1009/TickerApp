import { describe, expect, it } from "vitest";

import type {
  ResearchInput,
} from "../types";

import {
  RESEARCH_PROMPT_VERSION,
  buildResearchPrompt,
} from "./research-prompt";

const instrument =
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    exchangeId: "nasdaq",
    countryCode: "US",
    currency: "USD",
    assetClass: "equity" as const,
  };

describe("buildResearchPrompt", () => {
  it("includes the research prompt version", () => {
    const input: ResearchInput = {
      instrument,
    };

    const prompt =
      buildResearchPrompt(input);

    expect(prompt).toContain(
      `Research prompt version: ${RESEARCH_PROMPT_VERSION}`,
    );
  });

  it("includes instrument identity", () => {
    const input: ResearchInput = {
      instrument,
    };

    const prompt =
      buildResearchPrompt(input);

    expect(prompt).toContain(
      "Instrument: Apple Inc.",
    );
    expect(prompt).toContain(
      "Symbol: AAPL",
    );
    expect(prompt).toContain(
      "Exchange: nasdaq",
    );
    expect(prompt).toContain(
      "Country: US",
    );
    expect(prompt).toContain(
      "Currency: USD",
    );
    expect(prompt).toContain(
      "Asset class: equity",
    );
  });

  it("includes quote data when available", () => {
    const input: ResearchInput = {
      instrument,
      quote: {
        symbol: "AAPL",
        price: 200,
        change: 2,
        changePercent: 1,
        volume: 1_000_000,
        marketCap: 3_000_000_000_000,
        timestamp:
          "2026-09-06T00:00:00.000Z",
      },
    };

    const prompt =
      buildResearchPrompt(input);

    expect(prompt).toContain(
      "Price: 200",
    );
    expect(prompt).toContain(
      "Change: 2",
    );
    expect(prompt).toContain(
      "Change percent: 1",
    );
    expect(prompt).toContain(
      "Volume: 1000000",
    );
    expect(prompt).toContain(
      "Market cap: 3000000000000",
    );
  });

  it("explicitly identifies missing quote data", () => {
    const prompt =
      buildResearchPrompt({
        instrument,
      });

    expect(prompt).toContain(
      "Current quote: unavailable",
    );
  });

  it("includes financial metrics when available", () => {
    const prompt =
      buildResearchPrompt({
        instrument,
        metrics: {
          valuation: {
            priceToEarnings: 30,
          },
          profitability: {
            returnOnEquity: 1.5,
          },
          growth: {
            revenueGrowth: 0.12,
          },
          balanceSheet: {
            totalDebt: 10_000,
          },
          cashFlow: {
            freeCashFlow: 20_000,
          },
          technical: {
            rsi14: 55,
          },
          risk: {
            beta: 1.1,
          },
          ownership: {
            institutionalOwnership: 0.6,
          },
          earnings: {
            eps: 7,
          },
          relative: {
            sectorPercentile: 80,
          },
          factors: {
            quality: 85,
          },
        },
      });

    expect(prompt).toContain(
      "Financial metrics:",
    );
    expect(prompt).toContain(
      '"priceToEarnings": 30',
    );
    expect(prompt).toContain(
      '"returnOnEquity": 1.5',
    );
    expect(prompt).toContain(
      '"revenueGrowth": 0.12',
    );
  });

  it("explicitly identifies missing financial metrics", () => {
    const prompt =
      buildResearchPrompt({
        instrument,
      });

    expect(prompt).toContain(
      "Financial metrics: unavailable",
    );
  });

  it("includes a user research question", () => {
    const prompt =
      buildResearchPrompt({
        instrument,
        question:
          "Is the current valuation justified by growth?",
      });

    expect(prompt).toContain(
      "User research question:",
    );
    expect(prompt).toContain(
      "Is the current valuation justified by growth?",
    );
  });

  it("uses a default research question when none is supplied", () => {
    const prompt =
      buildResearchPrompt({
        instrument,
      });

    expect(prompt).toContain(
      "User research question: Provide a balanced research overview.",
    );
  });

  it("trims whitespace from the user question", () => {
    const prompt =
      buildResearchPrompt({
        instrument,
        question:
          "  Analyze the downside risks.  ",
      });

    expect(prompt).toContain(
      "Analyze the downside risks.",
    );
    expect(prompt).not.toContain(
      "  Analyze the downside risks.  ",
    );
  });

  it("includes all required analysis sections", () => {
    const prompt =
      buildResearchPrompt({
        instrument,
      });

    const requiredSections = [
      "Investment thesis",
      "Bull case",
      "Bear case",
      "Catalysts",
      "Risks",
      "Financial quality",
      "Valuation",
      "Technical and market context",
      "Relative/peer context",
      "Data limitations and uncertainty",
    ];

    for (const section of requiredSections) {
      expect(prompt).toContain(section);
    }
  });

  it("states the risk-aware research constraints", () => {
    const prompt =
      buildResearchPrompt({
        instrument,
      });

    expect(prompt).toContain(
      "Produce evidence-aware, risk-aware equity research.",
    );
    expect(prompt).toContain(
      "Do not claim certainty or guaranteed investment outcomes.",
    );
    expect(prompt).toContain(
      "Distinguish supplied facts from interpretation.",
    );
    expect(prompt).toContain(
      "If data is missing, explicitly state the limitation.",
    );
  });
});
