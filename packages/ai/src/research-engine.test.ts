import { describe, expect, it, vi } from "vitest";

import type {
  Instrument,
  ResearchInput,
  ResearchResult,
} from "./types";

import { AIError } from "./errors";
import { AIProviderRegistry } from "./provider-registry";
import { ResearchEngine } from "./research-engine";

const instrument: Instrument = {
  symbol: "AAPL",
  name: "Apple Inc.",
  exchangeId: "nasdaq",
  countryCode: "US",
  currency: "USD",
  assetClass: "equity",
};

const researchResult: ResearchResult = {
  instrument,
  generatedAt:
    "2026-09-06T00:00:00.000Z",
  providerId: "primary",
  model: "test-model",
  thesis: "Strong business with durable competitive advantages.",
  bullCase: [
    "Revenue growth remains strong.",
  ],
  bearCase: [
    "Valuation compresses.",
  ],
  catalysts: [
    "New product cycle.",
  ],
  risks: [
    "Regulatory pressure.",
  ],
  sections: [],
  evidence: [],
  confidence: "medium",
  limitations: [],
};

function createProvider(
  overrides: Partial<
    import("./types").AIResearchProvider
  > = {},
) {
  return {
    id: "test-provider",
    name: "Test Provider",
    model: "test-model",
    capabilities: {
      research: true,
    },
    research: vi.fn(
      async (
        _input: ResearchInput,
      ) => researchResult,
    ),
    healthCheck: vi.fn(
      async () => ({
        status: "healthy" as const,
        checkedAt:
          "2026-09-06T00:00:00.000Z",
      }),
    ),
    ...overrides,
  };
}

describe("ResearchEngine", () => {
  it("uses the default provider", () => {
    const provider =
      createProvider();

    const registry =
      new AIProviderRegistry();

    registry.register(provider);

    const engine =
      new ResearchEngine(
        registry,
        provider.id,
      );

    expect(
      engine.getDefaultProvider(),
    ).toBe(provider);
  });

  it("rejects an unknown provider", async () => {
    const provider =
      createProvider();

    const registry =
      new AIProviderRegistry();

    registry.register(provider);

    const engine =
      new ResearchEngine(
        registry,
        provider.id,
      );

    await expect(
      engine.research(
        { instrument },
        "unknown-provider",
      ),
    ).rejects.toMatchObject({
      code: "invalid_request",
      providerId:
        "unknown-provider",
    });
  });

  it("executes research through the selected provider", async () => {
    const provider =
      createProvider({
        id: "primary",
      });

    const registry =
      new AIProviderRegistry();

    registry.register(provider);

    const engine =
      new ResearchEngine(
        registry,
        "primary",
      );

    const result =
      await engine.research({
        instrument,
        question:
          "Is the valuation justified?",
      });

    expect(result).toEqual(
      researchResult,
    );

    expect(
  provider.research,
).toHaveBeenCalledWith(
  expect.objectContaining({
    input: {
      instrument,
      question:
        "Is the valuation justified?",
    },
    prompt: expect.stringContaining(
      "Is the valuation justified?",
    ),
  }),
);
  });

  it("uses an explicitly selected provider", async () => {
    const defaultProvider =
      createProvider({
        id: "default",
        research: vi.fn(
          async () => ({
            ...researchResult,
            providerId:
              "default",
          }),
        ),
      });

    const selectedProvider =
      createProvider({
        id: "selected",
        research: vi.fn(
          async () => ({
            ...researchResult,
            providerId:
              "selected",
          }),
        ),
      });

    const registry =
      new AIProviderRegistry();

    registry.register(
      defaultProvider,
    );
    registry.register(
      selectedProvider,
    );

    const engine =
      new ResearchEngine(
        registry,
        "default",
      );

    const result =
      await engine.research(
        { instrument },
        "selected",
      );

    expect(
      result.providerId,
    ).toBe("selected");

    expect(
      defaultProvider.research,
    ).not.toHaveBeenCalled();

    expect(
      selectedProvider.research,
    ).toHaveBeenCalled();
  });

  it("falls back when the primary provider is unavailable", async () => {
    const primary =
      createProvider({
        id: "primary",
        research: vi.fn(
          async () => {
            throw new AIError(
              "provider_unavailable",
              "Primary unavailable.",
              {
                providerId:
                  "primary",
              },
            );
          },
        ),
      });

    const fallback =
      createProvider({
        id: "fallback",
        research: vi.fn(
          async () => ({
            ...researchResult,
            providerId:
              "fallback",
          }),
        ),
      });

    const registry =
      new AIProviderRegistry();

    registry.register(primary);
    registry.register(fallback);

    const engine =
      new ResearchEngine(
        registry,
        "primary",
      );

    const result =
      await engine.research({
        instrument,
      });

    expect(
      result.providerId,
    ).toBe("fallback");

    expect(
      primary.research,
    ).toHaveBeenCalled();

    expect(
      fallback.research,
    ).toHaveBeenCalled();
  });

  it("does not fallback for invalid requests", async () => {
    const primary =
      createProvider({
        id: "primary",
        research: vi.fn(
          async () => {
            throw new AIError(
              "invalid_request",
              "Invalid research request.",
              {
                providerId:
                  "primary",
              },
            );
          },
        ),
      });

    const fallback =
      createProvider({
        id: "fallback",
      });

    const registry =
      new AIProviderRegistry();

    registry.register(primary);
    registry.register(fallback);

    const engine =
      new ResearchEngine(
        registry,
        "primary",
      );

    await expect(
      engine.research({
        instrument,
      }),
    ).rejects.toMatchObject({
      code: "invalid_request",
    });

    expect(
      fallback.research,
    ).not.toHaveBeenCalled();
  });

  it("does not use a provider without research capability", async () => {
    const provider =
      createProvider({
        id: "primary",
        capabilities: {
          research: false,
        },
      });

    const registry =
      new AIProviderRegistry();

    registry.register(provider);

    const engine =
      new ResearchEngine(
        registry,
        "primary",
      );

    await expect(
      engine.research({
        instrument,
      }),
    ).rejects.toMatchObject({
      code: "unsupported_capability",
      providerId: "primary",
    });

    expect(
      provider.research,
    ).not.toHaveBeenCalled();
  });

  it("falls back to a capable provider when the default lacks research capability", async () => {
    const primary =
      createProvider({
        id: "primary",
        capabilities: {
          research: false,
        },
      });

    const fallback =
      createProvider({
        id: "fallback",
        capabilities: {
          research: true,
        },
        research: vi.fn(
          async () => ({
            ...researchResult,
            providerId:
              "fallback",
          }),
        ),
      });

    const registry =
      new AIProviderRegistry();

    registry.register(primary);
    registry.register(fallback);

    const engine =
      new ResearchEngine(
        registry,
        "primary",
      );

    const result =
      await engine.research({
        instrument,
      });

    expect(
      result.providerId,
    ).toBe("fallback");

    expect(
      primary.research,
    ).not.toHaveBeenCalled();

    expect(
      fallback.research,
    ).toHaveBeenCalled();
  });

  it("rejects an empty instrument symbol", async () => {
    const provider =
      createProvider();

    const registry =
      new AIProviderRegistry();

    registry.register(provider);

    const engine =
      new ResearchEngine(
        registry,
        provider.id,
      );

    await expect(
      engine.research({
        instrument: {
          ...instrument,
          symbol: "   ",
        },
      }),
    ).rejects.toMatchObject({
      code: "invalid_request",
    });

    expect(
      provider.research,
    ).not.toHaveBeenCalled();
  });

  it("rejects an empty instrument name", async () => {
    const provider =
      createProvider();

    const registry =
      new AIProviderRegistry();

    registry.register(provider);

    const engine =
      new ResearchEngine(
        registry,
        provider.id,
      );

    await expect(
      engine.research({
        instrument: {
          ...instrument,
          name: "   ",
        },
      }),
    ).rejects.toMatchObject({
      code: "invalid_request",
    });

    expect(
      provider.research,
    ).not.toHaveBeenCalled();
  });

  it("rejects a blank research question", async () => {
    const provider =
      createProvider();

    const registry =
      new AIProviderRegistry();

    registry.register(provider);

    const engine =
      new ResearchEngine(
        registry,
        provider.id,
      );

    await expect(
      engine.research({
        instrument,
        question: "   ",
      }),
    ).rejects.toMatchObject({
      code: "invalid_request",
    });

    expect(
      provider.research,
    ).not.toHaveBeenCalled();
  });

  it("rejects results for the wrong instrument", async () => {
    const provider =
      createProvider({
        research: vi.fn(
          async () => ({
            ...researchResult,
            instrument: {
              ...instrument,
              symbol: "MSFT",
            },
          }),
        ),
      });

    const registry =
      new AIProviderRegistry();

    registry.register(provider);

    const engine =
      new ResearchEngine(
        registry,
        provider.id,
      );

    await expect(
      engine.research({
        instrument,
      }),
    ).rejects.toMatchObject({
      code: "provider_error",
    });
  });

  it("rejects results with an empty thesis", async () => {
    const provider =
      createProvider({
        research: vi.fn(
          async () => ({
            ...researchResult,
            thesis: "   ",
          }),
        ),
      });

    const registry =
      new AIProviderRegistry();

    registry.register(provider);

    const engine =
      new ResearchEngine(
        registry,
        provider.id,
      );

    await expect(
      engine.research({
        instrument,
      }),
    ).rejects.toMatchObject({
      code: "provider_error",
    });
  });

  it("returns provider summaries", () => {
    const first =
      createProvider({
        id: "first",
        name: "First Provider",
        model: "first-model",
      });

    const second =
      createProvider({
        id: "second",
        name: "Second Provider",
        model: "second-model",
      });

    const registry =
      new AIProviderRegistry();

    registry.register(first);
    registry.register(second);

    const engine =
      new ResearchEngine(
        registry,
        "first",
      );

    expect(
      engine.getProviderSummaries(),
    ).toEqual([
      {
        id: "first",
        name: "First Provider",
        model: "first-model",
        capabilities: {
          research: true,
        },
      },
      {
        id: "second",
        name: "Second Provider",
        model: "second-model",
        capabilities: {
          research: true,
        },
      },
    ]);
  });

  it("aggregates provider health", async () => {
    const healthy =
      createProvider({
        id: "healthy",
        healthCheck: vi.fn(
          async () => ({
            status: "healthy" as const,
            checkedAt:
              "2026-09-06T00:00:00.000Z",
          }),
        ),
      });

    const unavailable =
      createProvider({
        id: "unavailable",
        healthCheck: vi.fn(
          async () => ({
            status:
              "unavailable" as const,
            checkedAt:
              "2026-09-06T00:00:00.000Z",
          }),
        ),
      });

    const registry =
      new AIProviderRegistry();

    registry.register(healthy);
    registry.register(unavailable);

    const engine =
      new ResearchEngine(
        registry,
        "healthy",
      );

    const health =
      await engine.getHealth();

    expect(
      health.status,
    ).toBe("healthy");

    expect(
      health.providers,
    ).toHaveLength(2);

    expect(
      health.providers,
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          providerId:
            "healthy",
          providerName:
            "Test Provider",
          model:
            "test-model",
          status:
            "healthy",
        }),
        expect.objectContaining({
          providerId:
            "unavailable",
          providerName:
            "Test Provider",
          model:
            "test-model",
          status:
            "unavailable",
        }),
      ]),
    );
  });

  it("gets individual provider health", async () => {
    const provider =
      createProvider();

    const registry =
      new AIProviderRegistry();

    registry.register(provider);

    const engine =
      new ResearchEngine(
        registry,
        provider.id,
      );

    const health =
      await engine.getProviderHealth();

    expect(health).toEqual({
      status: "healthy",
      checkedAt:
        "2026-09-06T00:00:00.000Z",
    });

    expect(
      provider.healthCheck,
    ).toHaveBeenCalled();
  });

  it("reports the actual fallback provider in the result", async () => {
  const primary =
    createProvider({
      id: "primary",
      model: "primary-model",
      research: async () => {
        throw new AIError(
          "provider_unavailable",
          "Primary unavailable.",
        );
      },
    });

  const fallback =
    createProvider({
      id: "fallback",
      model: "fallback-model",
    });

  const registry =
    new AIProviderRegistry();

  registry.register(primary);
  registry.register(fallback);

  const engine =
    new ResearchEngine(
      registry,
      "primary",
    );

  const result =
    await engine.research({
      instrument: instrument,
    });

  expect(result.providerId).toBe(
    "fallback",
  );

  expect(result.model).toBe(
    "fallback-model",
  );
});
});
