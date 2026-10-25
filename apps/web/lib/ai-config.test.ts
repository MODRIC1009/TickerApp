
import {
  describe,
  expect,
  it,
} from "vitest";

import { AIError } from "@tickerapp/ai";
import { getAIConfig } from "./ai-config";

describe("getAIConfig", () => {
  it("does not silently enable demo mode when configuration is missing", () => {
    expect(getAIConfig({})).toEqual({
      providerId: "unconfigured",
      apiKey: "",
      baseUrl: "",
      model: "",
      providerName: "OpenAI Compatible AI",
      timeoutMs: 30_000,
    });
  });

  it("reads configured AI provider settings", () => {
    expect(
      getAIConfig({
        AI_PROVIDER: "openai-compatible",
        AI_API_KEY: "test-api-key",
        AI_BASE_URL: "https://example.com/v1",
        AI_MODEL: "test-model",
        AI_PROVIDER_NAME: "Test AI",
        AI_TIMEOUT_MS: "15000",
      }),
    ).toEqual({
      providerId: "openai-compatible",
      apiKey: "test-api-key",
      baseUrl: "https://example.com/v1",
      model: "test-model",
      providerName: "Test AI",
      timeoutMs: 15_000,
    });
  });

  it("trims configured values", () => {
    const config = getAIConfig({
      AI_PROVIDER: "  ollama  ",
      AI_API_KEY: "  ollama  ",
      AI_BASE_URL: "  http://localhost:11434/v1  ",
      AI_MODEL: "  qwen2.5:3b  ",
      AI_PROVIDER_NAME: "  Ollama Local  ",
      AI_TIMEOUT_MS: " 120000 ",
    });

    expect(config.providerId).toBe("ollama");
    expect(config.apiKey).toBe("ollama");
    expect(config.baseUrl).toBe(
      "http://localhost:11434/v1",
    );
    expect(config.model).toBe("qwen2.5:3b");
    expect(config.providerName).toBe("Ollama Local");
    expect(config.timeoutMs).toBe(120_000);
  });

  it("uses the default timeout when the setting is empty", () => {
    expect(
      getAIConfig({ AI_TIMEOUT_MS: "" }).timeoutMs,
    ).toBe(30_000);
  });

  it.each(["0", "-1000", "abc"])(
    "rejects invalid timeout %s",
    (value) => {
      expect(() =>
        getAIConfig({ AI_TIMEOUT_MS: value }),
      ).toThrow(AIError);
    },
  );
});
