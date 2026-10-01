import { describe, expect, it } from "vitest";

import type {
  AIResearchProvider,
} from "./types";

import { AIProviderRegistry } from "./provider-registry";

function createProvider(
  overrides: Partial<AIResearchProvider> = {},
): AIResearchProvider {
  return {
    id: "test-provider",
    name: "Test Provider",
    model: "test-model",
    capabilities: {
      research: true,
    },
    research: async (input) => ({
      instrument: input.instrument,
      generatedAt: "2026-09-06T00:00:00.000Z",
      providerId: "test-provider",
      model: "test-model",
      thesis: "Test thesis.",
      bullCase: [],
      bearCase: [],
      catalysts: [],
      risks: [],
      sections: [],
      evidence: [],
      confidence: "medium",
      limitations: [],
    }),
    healthCheck: async () => ({
      status: "healthy",
      checkedAt: "2026-09-06T00:00:00.000Z",
    }),
    ...overrides,
  };
}

describe("AIProviderRegistry", () => {
  it("registers and retrieves providers", () => {
    const registry =
      new AIProviderRegistry();

    const provider =
      createProvider();

    registry.register(provider);

    expect(
      registry.get("test-provider"),
    ).toBe(provider);
  });

  it("normalizes provider IDs for lookup", () => {
    const registry =
      new AIProviderRegistry();

    const provider =
      createProvider({
        id: " provider ",
      });

    registry.register(provider);

    expect(
      registry.get(" provider "),
    ).toBe(provider);
  });

  it("rejects empty provider IDs", () => {
    const registry =
      new AIProviderRegistry();

    expect(() =>
      registry.register(
        createProvider({
          id: "   ",
        }),
      ),
    ).toThrow(
      "AI provider ID cannot be empty.",
    );
  });

  it("rejects duplicate provider IDs", () => {
    const registry =
      new AIProviderRegistry();

    registry.register(
      createProvider(),
    );

    expect(() =>
      registry.register(
        createProvider(),
      ),
    ).toThrow(
      'AI provider "test-provider" is already registered.',
    );
  });

  it("reports whether a provider exists", () => {
    const registry =
      new AIProviderRegistry();

    registry.register(
      createProvider(),
    );

    expect(
      registry.has("test-provider"),
    ).toBe(true);

    expect(
      registry.has("missing"),
    ).toBe(false);
  });

  it("lists registered providers", () => {
    const registry =
      new AIProviderRegistry();

    const first =
      createProvider({
        id: "first",
      });

    const second =
      createProvider({
        id: "second",
      });

    registry.register(first);
    registry.register(second);

    expect(
      registry.list(),
    ).toEqual([
      first,
      second,
    ]);
  });

  it("returns a fallback provider", () => {
    const registry =
      new AIProviderRegistry();

    const primary =
      createProvider({
        id: "primary",
      });

    const fallback =
      createProvider({
        id: "fallback",
      });

    registry.register(primary);
    registry.register(fallback);

    expect(
      registry.getFallbackProvider(
        "primary",
      ),
    ).toBe(fallback);
  });

  it("returns null when no fallback exists", () => {
    const registry =
      new AIProviderRegistry();

    registry.register(
      createProvider(),
    );

    expect(
      registry.getFallbackProvider(
        "test-provider",
      ),
    ).toBeNull();
  });

  it("throws when retrieving an unknown provider", () => {
    const registry =
      new AIProviderRegistry();

    expect(() =>
      registry.get("missing"),
    ).toThrow(
      'AI provider "missing" is not registered.',
    );
  });
});
