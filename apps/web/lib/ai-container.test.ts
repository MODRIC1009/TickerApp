import {
  afterEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import {
  AIError,
} from "@tickerapp/ai";

afterEach(() => {
  vi.resetModules();
  vi.unstubAllEnvs();

  const globalForAI =
    globalThis as typeof globalThis & {
      tickerAIContainer?: unknown;
    };

  delete globalForAI.tickerAIContainer;
});

describe("aiContainer", () => {
  it("uses demo-ai when no real provider configuration is present", async () => {
    vi.stubEnv(
      "AI_PROVIDER",
      "demo-ai",
    );

    vi.stubEnv(
      "AI_API_KEY",
      "",
    );

    vi.stubEnv(
      "AI_BASE_URL",
      "",
    );

    vi.stubEnv(
      "AI_MODEL",
      "",
    );

    const {
      aiContainer,
    } = await import(
      "./ai-container"
    );

    expect(
      aiContainer.researchEngine
        .getDefaultProvider()
        .id,
    ).toBe("demo-ai");

    expect(
      aiContainer.registry.has(
        "demo-ai",
      ),
    ).toBe(true);
  });

  it("registers and selects the configured real provider", async () => {
    vi.stubEnv(
      "AI_PROVIDER",
      "test-ai",
    );

    vi.stubEnv(
      "AI_API_KEY",
      "test-api-key",
    );

    vi.stubEnv(
      "AI_BASE_URL",
      "https://example.com/v1",
    );

    vi.stubEnv(
      "AI_MODEL",
      "test-model",
    );

    vi.stubEnv(
      "AI_PROVIDER_NAME",
      "Test AI",
    );

    vi.stubEnv(
      "AI_TIMEOUT_MS",
      "15000",
    );

    const {
      aiContainer,
    } = await import(
      "./ai-container"
    );

    expect(
      aiContainer.registry.has(
        "test-ai",
      ),
    ).toBe(true);

    expect(
      aiContainer.researchEngine
        .getDefaultProvider()
        .id,
    ).toBe("test-ai");

    expect(
      aiContainer.researchEngine
        .getDefaultProvider()
        .name,
    ).toBe("Test AI");

    expect(
      aiContainer.researchEngine
        .getDefaultProvider()
        .model,
    ).toBe("test-model");

    expect(
      aiContainer.registry.has(
        "demo-ai",
      ),
    ).toBe(true);
  });

  it("falls back to demo-ai when the configured real provider fails", async () => {
    vi.stubEnv(
      "AI_PROVIDER",
      "test-ai",
    );

    vi.stubEnv(
      "AI_API_KEY",
      "test-api-key",
    );

    vi.stubEnv(
      "AI_BASE_URL",
      "https://example.com/v1",
    );

    vi.stubEnv(
      "AI_MODEL",
      "test-model",
    );

    const fetchMock =
      vi
        .spyOn(globalThis, "fetch")
        .mockRejectedValue(
          new Error(
            "Network failure",
          ),
        );

    const {
      aiContainer,
    } = await import(
      "./ai-container"
    );

    const result =
      await aiContainer.researchEngine.research(
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

    expect(
      fetchMock,
    ).toHaveBeenCalledOnce();

    expect(
      result.providerId,
    ).toBe("demo-ai");

    expect(
      result.model,
    ).toBe(
      "deterministic-research-v1",
    );
  });

  it("does not register an incomplete real provider configuration", async () => {
    vi.stubEnv(
      "AI_PROVIDER",
      "test-ai",
    );

    vi.stubEnv(
      "AI_API_KEY",
      "test-api-key",
    );

    vi.stubEnv(
      "AI_BASE_URL",
      "",
    );

    vi.stubEnv(
      "AI_MODEL",
      "test-model",
    );

    const {
      aiContainer,
    } = await import(
      "./ai-container"
    );

    expect(
      aiContainer.registry.has(
        "test-ai",
      ),
    ).toBe(false);

    expect(
      aiContainer.researchEngine
        .getDefaultProvider()
        .id,
    ).toBe("demo-ai");
  });

  it("surfaces invalid AI timeout configuration", async () => {
    vi.stubEnv(
      "AI_TIMEOUT_MS",
      "invalid",
    );

    await expect(
      import(
        "./ai-container"
      ),
    ).rejects.toMatchObject({
      code: "invalid_request",
    } satisfies Partial<
      AIError
    >);
  });
});