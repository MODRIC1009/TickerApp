import {
  describe,
  expect,
  it,
} from "vitest";

import {
  DemoAIProvider,
} from "./demo-ai-provider";

import type {
  ResearchInput,
} from "../types";

const input: ResearchInput = {
  instrument: {
    symbol: "AAPL",
    name: "Apple Inc.",
    exchangeId: "NASDAQ",
    countryCode: "US",
    currency: "USD",
    assetClass: "equity",
  },
  quote: {
    price: 200,
    change: 2,
    changePercent: 1,
    volume: 1000000,
    marketCap: 3000000000000,
    timestamp: "2026-09-06T10:00:00.000Z",
  },
  question:
    "Is Apple worth researching further?",
};

describe("DemoAIProvider", () => {
  it("exposes the expected provider metadata", () => {
    const provider =
      new DemoAIProvider();

    expect(provider.id).toBe(
      "demo-ai",
    );

    expect(provider.name).toBe(
      "TickerApp Demo AI",
    );

    expect(provider.model).toBe(
      "deterministic-research-v1",
    );

    expect(
      provider.capabilities.research,
    ).toBe(true);
  });

  it("produces a structured research result", async () => {
    const provider =
      new DemoAIProvider();

    const result =
      await provider.research({
  input,
  prompt:
    "Test research prompt",
});

    expect(result.instrument).toEqual(
      input.instrument,
    );

    expect(result.providerId).toBe(
      provider.id,
    );

    expect(result.model).toBe(
      provider.model,
    );

    expect(result.thesis).toBeTruthy();
    expect(result.bullCase.length).toBeGreaterThan(0);
    expect(result.bearCase.length).toBeGreaterThan(0);
    expect(result.catalysts.length).toBeGreaterThan(0);
    expect(result.risks.length).toBeGreaterThan(0);
    expect(result.sections.length).toBeGreaterThan(0);
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.limitations.length).toBeGreaterThan(0);
  });

  it("uses supplied quote information", async () => {
    const provider =
      new DemoAIProvider();

    const result =
      await provider.research({
  input,
  prompt:
    "Test research prompt",
});

    expect(
      result.sections
        .find(
          (section) =>
            section.title ===
            "Market Context",
        )
        ?.summary,
    ).toContain("200");
  });

  it("reports missing market data explicitly", async () => {
    const provider =
      new DemoAIProvider();

    const result =
      await provider.research({
  input: {
    instrument:
      input.instrument,
  },
  prompt:
    "Test research prompt",
});

    expect(
      result.sections
        .find(
          (section) =>
            section.title ===
            "Market Context",
        )
        ?.summary,
    ).toContain(
      "Current quote data was not supplied.",
    );

    expect(
      result.limitations.length,
    ).toBeGreaterThan(0);
  });

  it("passes the research question into the result", async () => {
    const provider =
      new DemoAIProvider();

    const question =
      "What are the biggest risks?";

    const result =
      await provider.research({
  input: {
    instrument:
      input.instrument,
    question,
  },
  prompt:
    "Test research prompt",
});

    expect(
      result.sections
        .find(
          (section) =>
            section.title ===
            "Research Question",
        )
        ?.summary,
    ).toBe(question);
  });

  it("reports a healthy local provider", async () => {
    const provider =
      new DemoAIProvider();

    const health =
      await provider.healthCheck();

    expect(health.status).toBe(
      "healthy",
    );

    expect(health.message).toContain(
      "available locally",
    );

    expect(
      health.checkedAt,
    ).toBeTruthy();
  });

  it("requires a non-empty research prompt", async () => {
  const provider =
    new DemoAIProvider();

  await expect(
    provider.research({
      input,
      prompt: "   ",
    }),
  ).rejects.toThrow(
    "Research prompt cannot be empty.",
  );
});
});