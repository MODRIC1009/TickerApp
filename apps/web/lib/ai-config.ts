
import { AIError } from "@tickerapp/ai";

export interface AIConfig {
  providerId: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  providerName: string;
  timeoutMs: number;
}

function parseTimeout(
  value: string | undefined,
): number {
  if (!value?.trim()) {
    return 30_000;
  }

  const timeoutMs = Number(value);

  if (
    !Number.isFinite(timeoutMs) ||
    timeoutMs <= 0
  ) {
    throw new AIError(
      "invalid_request",
      "AI_TIMEOUT_MS must be a positive number.",
    );
  }

  return timeoutMs;
}

export function getAIConfig(
  env: Partial<NodeJS.ProcessEnv> = process.env,
): AIConfig {
  return {
    // No configured provider means AI is unavailable,
    // rather than silently using demo responses.
    providerId:
      env.AI_PROVIDER?.trim() ||
      "unconfigured",
    apiKey:
      env.AI_API_KEY?.trim() || "",
    baseUrl:
      env.AI_BASE_URL?.trim() || "",
    model:
      env.AI_MODEL?.trim() || "",
    providerName:
      env.AI_PROVIDER_NAME?.trim() ||
      "OpenAI Compatible AI",
    timeoutMs: parseTimeout(
      env.AI_TIMEOUT_MS,
    ),
  };
}
