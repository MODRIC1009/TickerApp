
import {
  AIError,
  createAIContainer,
  OpenAICompatibleProvider,
} from "@tickerapp/ai";

import type {
  AIProviderHealth,
  AIResearchProvider,
  ResearchResult,
} from "@tickerapp/ai";

import type {
  AIResearchRequest,
} from "../../../packages/ai/src/types";

import { getAIConfig } from "./ai-config";

class UnconfiguredAIProvider
  implements AIResearchProvider
{
  readonly id = "ai-unconfigured";
  readonly name = "AI Not Configured";
  readonly model = "none";

  readonly capabilities = {
    research: true,
  } as const;

  async research(
    _request: AIResearchRequest,
  ): Promise<ResearchResult> {
    throw new AIError(
      "provider_unavailable",
      "AI is not configured. Configure Ollama in apps/web/.env.local and restart TickerApp.",
      { providerId: this.id },
    );
  }

  async healthCheck(): Promise<AIProviderHealth> {
    return {
      status: "unavailable",
      checkedAt: new Date().toISOString(),
      message:
        "Configure a real AI provider to enable research.",
    };
  }
}

const globalForAI = globalThis as unknown as {
  tickerAIContainer:
    | ReturnType<typeof createAIContainer>
    | undefined;
};

function createConfiguredAIContainer() {
  const config = getAIConfig();

  const hasRealProviderConfig = Boolean(
    config.apiKey &&
    config.baseUrl &&
    config.model,
  );

  if (
    hasRealProviderConfig &&
    config.providerId !== "demo-ai"
  ) {
    const provider = new OpenAICompatibleProvider({
      id: config.providerId,
      name: config.providerName,
      model: config.model,
      baseUrl: config.baseUrl,
      apiKey: config.apiKey,
      timeoutMs: config.timeoutMs,
    });

    return createAIContainer({
      defaultProviderId: config.providerId,
      providers: [provider],
    });
  }

  if (config.providerId === "demo-ai") {
    return createAIContainer({
      defaultProviderId: "demo-ai",
    });
  }

  const unavailable = new UnconfiguredAIProvider();

  return createAIContainer({
    defaultProviderId: unavailable.id,
    providers: [unavailable],
  });
}

export const aiContainer =
  globalForAI.tickerAIContainer ??
  createConfiguredAIContainer();

if (process.env.NODE_ENV !== "production") {
  globalForAI.tickerAIContainer = aiContainer;
}
