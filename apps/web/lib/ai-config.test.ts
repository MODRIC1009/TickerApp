import {
  describe,
  expect,
  it,
} from "vitest";

import {
  AIError,
} from "@tickerapp/ai";

import {
  getAIConfig,
} from "./ai-config";

describe("getAIConfig", () => {
  it("uses safe defaults when AI environment variables are missing", () => {
    const config =
      getAIConfig({});

    expect(config).toEqual({
      providerId: "demo-ai",
      apiKey: "",
      baseUrl: "",
      model: "",
      providerName:
        "OpenAI Compatible AI",
      timeoutMs: 30_000,
    });
  });

  it("reads configured AI provider settings", () => {
    const config =
      getAIConfig({
        AI_PROVIDER:
          "openai-compatible",
        AI_API_KEY:
          "test-api-key",
        AI_BASE_URL:
          "https://example.com/v1",
        AI_MODEL:
          "test-model",
        AI_PROVIDER_NAME:
          "Test AI",
        AI_TIMEOUT_MS:
          "15000",
      });

    expect(config).toEqual({
      providerId:
        "openai-compatible",
      apiKey:
        "test-api-key",
      baseUrl:
        "https://example.com/v1",
      model:
        "test-model",
      providerName:
        "Test AI",
      timeoutMs: 15_000,
    });
  });

  it("trims configured values", () => {
    const config =
      getAIConfig({
        AI_PROVIDER:
          "  openai-compatible  ",
        AI_API_KEY:
          "  test-api-key  ",
        AI_BASE_URL:
          "  https://example.com/v1  ",
        AI_MODEL:
          "  test-model  ",
        AI_PROVIDER_NAME:
          "  Test AI  ",
        AI_TIMEOUT_MS:
          "  10000  ",
      });

    expect(config.providerId).toBe(
      "openai-compatible",
    );

    expect(config.apiKey).toBe(
      "test-api-key",
    );

    expect(config.baseUrl).toBe(
      "https://example.com/v1",
    );

    expect(config.model).toBe(
      "test-model",
    );

    expect(config.providerName).toBe(
      "Test AI",
    );

    expect(config.timeoutMs).toBe(
      10_000,
    );
  });

  it("uses the default timeout when AI_TIMEOUT_MS is empty", () => {
    const config =
      getAIConfig({
        AI_TIMEOUT_MS: "",
      });

    expect(
      config.timeoutMs,
    ).toBe(30_000);
  });

  it("rejects a zero timeout", () => {
    expect(() =>
      getAIConfig({
        AI_TIMEOUT_MS: "0",
      }),
    ).toThrow(AIError);
  });

  it("rejects a negative timeout", () => {
    expect(() =>
      getAIConfig({
        AI_TIMEOUT_MS: "-1000",
      }),
    ).toThrow(AIError);
  });

  it("rejects a non-numeric timeout", () => {
    expect(() =>
      getAIConfig({
        AI_TIMEOUT_MS: "abc",
      }),
    ).toThrow(AIError);
  });
});