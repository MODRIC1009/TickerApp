import { afterEach, describe, expect, it, vi } from "vitest";

import {
  AIResearchClientError,
  runAIResearch,
} from "./ai-research-client";

import type { ResearchResult } from "@tickerapp/ai";

const researchResult: ResearchResult = {
  instrument: {
    symbol: "AAPL",
    name: "Apple Inc.",
    exchangeId: "NASDAQ",
    countryCode: "US",
    currency: "USD",
    assetClass: "equity",
  },
  generatedAt: "2026-09-06T10:00:00.000Z",
  providerId: "demo-ai",
  model: "deterministic-research-v1",
  thesis: "Balanced research thesis.",
  bullCase: ["Positive growth."],
  bearCase: ["Valuation risk."],
  catalysts: ["Earnings."],
  risks: ["Market risk."],
  sections: [
    {
      title: "Financial Quality",
      summary: "Adequate.",
      keyPoints: ["Review fundamentals."],
    },
  ],
  evidence: [
    {
      source: "TickerApp supplied market data",
      claim: "Supplied data was used.",
      relevance: "high",
    },
  ],
  confidence: "low",
  limitations: ["Demo provider."],
};

const researchInput = {
  instrument: researchResult.instrument,
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("runAIResearch", () => {
  it("returns research data for a successful response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          data: researchResult,
        }),
        {
          status: 200,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    await expect(
      runAIResearch(researchInput),
    ).resolves.toEqual(researchResult);

    expect(fetch).toHaveBeenCalledWith(
      "/api/ai/research",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(researchInput),
      },
    );
  });

  it("maps API errors to AIResearchClientError", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "AI provider is unavailable.",
          code: "provider_unavailable",
          providerId: "openai-compatible",
        }),
        {
          status: 502,
          headers: {
            "content-type": "application/json",
          },
        },
      ),
    );

    const promise =
      runAIResearch(researchInput);

    await expect(
      promise,
    ).rejects.toBeInstanceOf(
      AIResearchClientError,
    );

    await expect(
      promise,
    ).rejects.toMatchObject({
      message:
        "AI provider is unavailable.",
      status: 502,
      code:
        "provider_unavailable",
      providerId:
        "openai-compatible",
    });
  });

  it("rejects an unsuccessful response without an API error message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({}),
        {
          status: 500,
        },
      ),
    );

    await expect(
      runAIResearch(researchInput),
    ).rejects.toMatchObject({
      message: "AI research failed.",
      status: 500,
    });
  });

  it("rejects invalid JSON responses", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        "not-json",
        {
          status: 200,
        },
      ),
    );

    await expect(
      runAIResearch(researchInput),
    ).rejects.toMatchObject({
      message:
        "The AI research service returned an invalid response.",
      status: 200,
    });
  });
});