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

  const timeoutMs =
    Number(value);

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
  const providerId =
    env.AI_PROVIDER?.trim() ||
    "demo-ai";

  const apiKey =
    env.AI_API_KEY?.trim() ||
    "";

  const baseUrl =
    env.AI_BASE_URL?.trim() ||
    "";

  const model =
    env.AI_MODEL?.trim() ||
    "";

  const providerName =
    env.AI_PROVIDER_NAME?.trim() ||
    "OpenAI Compatible AI";

  return {
    providerId,
    apiKey,
    baseUrl,
    model,
    providerName,
    timeoutMs:
      parseTimeout(
        env.AI_TIMEOUT_MS,
      ),
  };
}