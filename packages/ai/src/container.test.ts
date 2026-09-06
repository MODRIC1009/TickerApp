import {
  describe,
  expect,
  it,
} from "vitest";

import {
  createAIContainer,
} from "./container";

import type {
  AIProviderHealth,
  AIResearchProvider,
  AIResearchRequest,
  ResearchResult,
} from "./types";

const testProvider: AIResearchProvider = {
  id: "test-ai",
  name: "Test AI",
  model: "test-model",
  capabilities: {
    research: true,
  },

  async research(
    request: AIResearchRequest,
  ): Promise<ResearchResult> {
    return {
      instrument:
        request.input.instrument,
      generatedAt:
        new Date().toISOString(),
      providerId: "test-ai",
      model: "test-model",
      thesis: "Test thesis.",
      bullCase: [
        "Test bull case",
      ],
      bearCase: [
        "Test bear case",
      ],
      catalysts: [
        "Test catalyst",
      ],
      risks: [
        "Test risk",
      ],
      sections: [
        {
          title: "Test section",
          summary: "Test summary.",
          keyPoints: [
            "Test point",
          ],
        },
      ],
      evidence: [
        {
          source: "Test source",
          claim: "Test claim",
          relevance: "high",
        },
      ],
      confidence: "low",
      limitations: [
        "Test limitation",
      ],
    };
  },

  async healthCheck(): Promise<AIProviderHealth> {
    return {
      status: "healthy",
      checkedAt:
        new Date().toISOString(),
      message:
        "Test provider is healthy.",
    };
  },
};

describe("createAIContainer", () => {
  it("registers the demo AI provider", () => {
    const container =
      createAIContainer();

    expect(
      container.registry.has(
        "demo-ai",
      ),
    ).toBe(true);
  });

  it("uses the demo provider as the default", () => {
    const container =
      createAIContainer();

    expect(
      container.researchEngine
        .getDefaultProvider()
        .id,
    ).toBe("demo-ai");
  });

  it("accepts an explicit default provider", () => {
    const container =
      createAIContainer({
        defaultProviderId:
          "demo-ai",
      });

    expect(
      container.researchEngine
        .getDefaultProvider()
        .id,
    ).toBe("demo-ai");
  });

  it("registers injected providers", () => {
    const container =
      createAIContainer({
        providers: [
          testProvider,
        ],
      });

    expect(
      container.registry.has(
        "test-ai",
      ),
    ).toBe(true);
  });

  it("uses an injected provider as the default", () => {
    const container =
      createAIContainer({
        providers: [
          testProvider,
        ],
        defaultProviderId:
          "test-ai",
      });

    expect(
      container.researchEngine
        .getDefaultProvider()
        .id,
    ).toBe("test-ai");
  });

  it("rejects an unknown configured provider", () => {
    expect(() =>
      createAIContainer({
        defaultProviderId:
          "unknown-provider",
      }),
    ).toThrow(
      'Configured AI provider "unknown-provider" is not registered.',
    );
  });

  it("rejects duplicate demo provider injection", () => {
    expect(() =>
      createAIContainer({
        providers: [
          {
            ...testProvider,
            id: "demo-ai",
          },
        ],
      }),
    ).toThrow(
      'The "demo-ai" provider is registered automatically.',
    );
  });

  it("creates a working research engine", async () => {
    const container =
      createAIContainer();

    const result =
      await container.researchEngine.research(
        {
          instrument: {
            symbol: "AAPL",
            name: "Apple Inc.",
            exchangeId: "NASDAQ",
            countryCode: "US",
            currency: "USD",
            assetClass: "equity",
          },
        },
      );

    expect(result.providerId).toBe(
      "demo-ai",
    );

    expect(result.model).toBe(
      "deterministic-research-v1",
    );

    expect(
      result.thesis,
    ).toBeTruthy();
  });

  it("reports healthy provider health", async () => {
    const container =
      createAIContainer();

    const health =
      await container.researchEngine.getHealth();

    expect(health.status).toBe(
      "healthy",
    );

    expect(
      health.providers,
    ).toHaveLength(1);

    expect(
      health.providers[0].providerId,
    ).toBe("demo-ai");

    expect(
      health.providers[0].status,
    ).toBe("healthy");
  });
});