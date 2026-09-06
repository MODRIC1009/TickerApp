import {
  createAIContainer,
  OpenAICompatibleProvider,
} from "@tickerapp/ai";

import {
  getAIConfig,
} from "./ai-config";

const globalForAI =
  globalThis as unknown as {
    tickerAIContainer:
      | ReturnType<
          typeof createAIContainer
        >
      | undefined;
  };

function createConfiguredAIContainer() {
  const config =
    getAIConfig();

  const hasRealProviderConfig =
    Boolean(
      config.apiKey &&
      config.baseUrl &&
      config.model,
    );

  if (
    hasRealProviderConfig &&
    config.providerId !== "demo-ai"
  ) {
    const provider =
      new OpenAICompatibleProvider({
        id:
          config.providerId,
        name:
          config.providerName,
        model:
          config.model,
        baseUrl:
          config.baseUrl,
        apiKey:
          config.apiKey,
        timeoutMs:
          config.timeoutMs,
      });

    return createAIContainer({
      defaultProviderId:
        config.providerId,
      providers: [
        provider,
      ],
    });
  }

  return createAIContainer({
    defaultProviderId:
      "demo-ai",
  });
}

export const aiContainer =
  globalForAI.tickerAIContainer ??
  createConfiguredAIContainer();

if (
  process.env.NODE_ENV !==
  "production"
) {
  globalForAI.tickerAIContainer =
    aiContainer;
}