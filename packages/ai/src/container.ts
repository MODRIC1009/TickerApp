
import { DemoAIProvider } from "./providers/demo-ai-provider";
import { AIProviderRegistry } from "./provider-registry";
import { ResearchEngine } from "./research-engine";
import type { AIResearchProvider } from "./types";

export interface AIContainer {
  registry: AIProviderRegistry;
  researchEngine: ResearchEngine;
}

export interface AIContainerConfig {
  defaultProviderId?: string;
  providers?: AIResearchProvider[];
}

export function createAIContainer(
  config: AIContainerConfig = {},
): AIContainer {
  const registry = new AIProviderRegistry();
  const configuredProviders = config.providers ?? [];

  const defaultProviderId =
    config.defaultProviderId?.trim() ||
    configuredProviders[0]?.id ||
    "demo-ai";

  if (defaultProviderId === "demo-ai") {
    registry.register(new DemoAIProvider());
  }

  for (const provider of configuredProviders) {
    if (provider.id === "demo-ai") {
      throw new Error(
        'The "demo-ai" provider is registered automatically.',
      );
    }

    registry.register(provider);
  }

  if (!registry.has(defaultProviderId)) {
    throw new Error(
      `Configured AI provider "${defaultProviderId}" is not registered.`,
    );
  }

  return {
    registry,
    researchEngine: new ResearchEngine(
      registry,
      defaultProviderId,
    ),
  };
}
