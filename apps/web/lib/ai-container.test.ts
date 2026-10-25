
import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { AIError } from "@tickerapp/ai";

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();

  const globalForAI = globalThis as typeof globalThis & {
    tickerAIContainer?: unknown;
  };

  delete globalForAI.tickerAIContainer;
});

function clearAIEnvironment() {
  vi.stubEnv("AI_PROVIDER", "");
  vi.stubEnv("AI_API_KEY", "");
  vi.stubEnv("AI_BASE_URL", "");
  vi.stubEnv("AI_MODEL", "");
  vi.stubEnv("AI_PROVIDER_NAME", "");
  vi.stubEnv("AI_TIMEOUT_MS", "");
}

describe("aiContainer", () => {
  it("reports unavailable when no provider is configured", async () => {
    clearAIEnvironment();

    const { aiContainer } = await import("./ai-container");

    expect(
      aiContainer.researchEngine.getDefaultProvider().id,
    ).toBe("ai-unconfigured");

    expect(
      aiContainer.registry.has("demo-ai"),
    ).toBe(false);

    await expect(
      aiContainer.researchEngine.getProviderHealth(),
    ).resolves.toMatchObject({
      status: "unavailable",
    });
  });

  it("uses demo-ai only when explicitly configured", async () => {
    clearAIEnvironment();
    vi.stubEnv("AI_PROVIDER", "demo-ai");

    const { aiContainer } = await import("./ai-container");

    expect(
      aiContainer.researchEngine.getDefaultProvider().id,
    ).toBe("demo-ai");

    expect(
      aiContainer.registry.has("demo-ai"),
    ).toBe(true);
  });

  it("registers and selects the configured real provider without demo fallback", async () => {
    clearAIEnvironment();
    vi.stubEnv("AI_PROVIDER", "test-ai");
    vi.stubEnv("AI_API_KEY", "test-api-key");
    vi.stubEnv("AI_BASE_URL", "https://example.com/v1");
    vi.stubEnv("AI_MODEL", "test-model");
    vi.stubEnv("AI_PROVIDER_NAME", "Test AI");
    vi.stubEnv("AI_TIMEOUT_MS", "15000");

    const { aiContainer } = await import("./ai-container");

    expect(aiContainer.registry.has("test-ai")).toBe(true);
    expect(aiContainer.registry.has("demo-ai")).toBe(false);

    expect(
      aiContainer.researchEngine.getDefaultProvider(),
    ).toMatchObject({
      id: "test-ai",
      name: "Test AI",
      model: "test-model",
    });
  });

  it("does not silently return demo research when a real provider fails", async () => {
    clearAIEnvironment();
    vi.stubEnv("AI_PROVIDER", "test-ai");
    vi.stubEnv("AI_API_KEY", "test-api-key");
    vi.stubEnv("AI_BASE_URL", "https://example.com/v1");
    vi.stubEnv("AI_MODEL", "test-model");

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockRejectedValue(
        new Error("Network failure"),
      );

    const { aiContainer } = await import("./ai-container");

    await expect(
      aiContainer.researchEngine.research({
        instrument: {
          symbol: "AAPL",
          name: "Apple Inc.",
          exchangeId: "NASDAQ",
          countryCode: "US",
          currency: "USD",
          assetClass: "equity",
        },
      }),
    ).rejects.toMatchObject({
      code: "provider_unavailable",
    } satisfies Partial<AIError>);

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(aiContainer.registry.has("demo-ai")).toBe(false);
  });

  it("does not register an incomplete real provider configuration", async () => {
    clearAIEnvironment();
    vi.stubEnv("AI_PROVIDER", "test-ai");
    vi.stubEnv("AI_API_KEY", "test-api-key");
    vi.stubEnv("AI_BASE_URL", "");
    vi.stubEnv("AI_MODEL", "test-model");

    const { aiContainer } = await import("./ai-container");

    expect(aiContainer.registry.has("test-ai")).toBe(false);

    expect(
      aiContainer.researchEngine.getDefaultProvider().id,
    ).toBe("ai-unconfigured");
  });

  it("surfaces invalid AI timeout configuration", async () => {
    clearAIEnvironment();
    vi.stubEnv("AI_TIMEOUT_MS", "invalid");

    await expect(
      import("./ai-container"),
    ).rejects.toMatchObject({
      code: "invalid_request",
    } satisfies Partial<AIError>);
  });
});
